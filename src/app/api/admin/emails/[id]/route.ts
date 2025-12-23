import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { emailCampaigns, campaignRecipients, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Get single campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [campaign] = await db
      .select({
        id: emailCampaigns.id,
        subject: emailCampaigns.subject,
        previewText: emailCampaigns.previewText,
        content: emailCampaigns.content,
        recipientType: emailCampaigns.recipientType,
        recipientLists: emailCampaigns.recipientLists,
        recipientCount: emailCampaigns.recipientCount,
        status: emailCampaigns.status,
        sentAt: emailCampaigns.sentAt,
        createdAt: emailCampaigns.createdAt,
        totalSent: emailCampaigns.totalSent,
        totalOpened: emailCampaigns.totalOpened,
        totalClicked: emailCampaigns.totalClicked,
        totalBounced: emailCampaigns.totalBounced,
        uniqueOpens: emailCampaigns.uniqueOpens,
        uniqueClicks: emailCampaigns.uniqueClicks,
        createdByEmail: users.email,
      })
      .from(emailCampaigns)
      .leftJoin(users, eq(emailCampaigns.createdBy, users.id))
      .where(eq(emailCampaigns.id, id));

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Get campaign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { subject, previewText, content, recipientType, recipientLists, recipientCount } = body;

    // Check campaign exists and is still draft
    const [existing] = await db
      .select({ status: emailCampaigns.status })
      .from(emailCampaigns)
      .where(eq(emailCampaigns.id, id));

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (existing.status !== "draft") {
      return NextResponse.json({ error: "Cannot edit sent campaign" }, { status: 400 });
    }

    const [updated] = await db
      .update(emailCampaigns)
      .set({
        subject,
        previewText: previewText || null,
        content,
        recipientType,
        recipientLists: recipientLists || null,
        recipientCount: recipientCount || 0,
        updatedAt: new Date(),
      })
      .where(eq(emailCampaigns.id, id))
      .returning();

    return NextResponse.json({ campaign: updated });
  } catch (error) {
    console.error("Update campaign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check campaign exists and is still draft
    const [existing] = await db
      .select({ status: emailCampaigns.status })
      .from(emailCampaigns)
      .where(eq(emailCampaigns.id, id));

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (existing.status !== "draft") {
      return NextResponse.json({ error: "Cannot delete sent campaign" }, { status: 400 });
    }

    await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete campaign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
