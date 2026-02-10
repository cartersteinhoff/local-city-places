import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { emailCampaigns, campaignRecipients, users, members, merchants, emailPreferences } from "@/db/schema";
import { eq, and, or, inArray, isNotNull } from "drizzle-orm";
import { sendBroadcastEmail } from "@/lib/email/postmark-broadcast";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get campaign
    const [campaign] = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.id, id));

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status !== "draft") {
      return NextResponse.json({ error: "Campaign has already been sent" }, { status: 400 });
    }

    // Update status to sending
    await db
      .update(emailCampaigns)
      .set({ status: "sending" })
      .where(eq(emailCampaigns.id, id));

    // Get recipients based on type
    let recipientUsers: Array<{ id: string; email: string | null; name: string | null; role: string }> = [];

    if (campaign.recipientType === "individual" && campaign.individualRecipientId) {
      const [result] = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          memberFirstName: users.firstName,
          memberLastName: users.lastName,
          merchantBusinessName: merchants.businessName,
        })
        .from(users)
        .leftJoin(members, eq(users.id, members.userId))
        .leftJoin(merchants, eq(users.id, merchants.userId))
        .where(eq(users.id, campaign.individualRecipientId));

      if (result) {
        recipientUsers = [{
          id: result.id,
          email: result.email,
          role: result.role,
          name: result.memberFirstName && result.memberLastName
            ? `${result.memberFirstName} ${result.memberLastName}`
            : result.merchantBusinessName || null,
        }];
      }
    } else if (campaign.recipientLists && campaign.recipientLists.length > 0) {
      // Build conditions for each list
      const conditions = [];

      if (campaign.recipientLists.includes("members")) {
        conditions.push(eq(users.role, "member"));
      }
      if (campaign.recipientLists.includes("merchants")) {
        conditions.push(eq(users.role, "merchant"));
      }
      if (campaign.recipientLists.includes("admins")) {
        conditions.push(eq(users.role, "admin"));
      }

      if (conditions.length > 0) {
        const results = await db
          .select({
            id: users.id,
            email: users.email,
            role: users.role,
            memberFirstName: users.firstName,
            memberLastName: users.lastName,
            merchantBusinessName: merchants.businessName,
          })
          .from(users)
          .leftJoin(members, eq(users.id, members.userId))
          .leftJoin(merchants, eq(users.id, merchants.userId))
          .where(and(isNotNull(users.email), or(...conditions)));

        recipientUsers = results.map(r => ({
          id: r.id,
          email: r.email,
          role: r.role,
          name: r.memberFirstName && r.memberLastName
            ? `${r.memberFirstName} ${r.memberLastName}`
            : r.merchantBusinessName || null,
        }));
      }
    }

    if (recipientUsers.length === 0) {
      await db
        .update(emailCampaigns)
        .set({ status: "failed" })
        .where(eq(emailCampaigns.id, id));
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    // Filter out unsubscribed users
    const userIds = recipientUsers.map((u) => u.id);
    const preferences = await db
      .select({
        userId: emailPreferences.userId,
        unsubscribedAll: emailPreferences.unsubscribedAll,
        marketingEmails: emailPreferences.marketingEmails,
      })
      .from(emailPreferences)
      .where(inArray(emailPreferences.userId, userIds));

    const prefsMap = new Map(preferences.map((p) => [p.userId, p]));

    const eligibleRecipients = recipientUsers.filter((user) => {
      const prefs = prefsMap.get(user.id);
      if (!prefs) return true; // No preferences = wants emails
      if (prefs.unsubscribedAll) return false;
      if (prefs.marketingEmails === false) return false;
      return true;
    });

    if (eligibleRecipients.length === 0) {
      await db
        .update(emailCampaigns)
        .set({ status: "failed" })
        .where(eq(emailCampaigns.id, id));
      return NextResponse.json({ error: "All recipients have unsubscribed" }, { status: 400 });
    }

    // Create recipient records
    const recipientRecords = eligibleRecipients.map((recipient) => ({
      campaignId: id,
      userId: recipient.id,
      email: recipient.email || "",
      name: recipient.name,
      status: "pending" as const,
    }));

    await db.insert(campaignRecipients).values(recipientRecords).onConflictDoNothing();

    // Send emails
    const broadcastRecipients = eligibleRecipients
      .filter((r) => r.email)
      .map((r) => ({
        email: r.email!,
        name: r.name || undefined,
        userId: r.id,
      }));

    const result = await sendBroadcastEmail({
      subject: campaign.subject,
      htmlContent: campaign.content,
      recipients: broadcastRecipients,
      previewText: campaign.previewText || undefined,
      campaignId: id,
    });

    // Update campaign status
    await db
      .update(emailCampaigns)
      .set({
        status: "sent",
        sentAt: new Date(),
        totalSent: result.successCount,
        postmarkBatchId: result.batchId || null,
      })
      .where(eq(emailCampaigns.id, id));

    // Update recipient statuses
    for (const success of result.successes) {
      await db
        .update(campaignRecipients)
        .set({
          status: "sent",
          sentAt: new Date(),
          postmarkMessageId: success.messageId,
        })
        .where(
          and(
            eq(campaignRecipients.campaignId, id),
            eq(campaignRecipients.email, success.email)
          )
        );
    }

    for (const failure of result.failures) {
      await db
        .update(campaignRecipients)
        .set({
          status: "failed",
          errorMessage: failure.error,
        })
        .where(
          and(
            eq(campaignRecipients.campaignId, id),
            eq(campaignRecipients.email, failure.email)
          )
        );
    }

    return NextResponse.json({
      success: true,
      sent: result.successCount,
      failed: result.failures.length,
    });
  } catch (error) {
    console.error("Send campaign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
