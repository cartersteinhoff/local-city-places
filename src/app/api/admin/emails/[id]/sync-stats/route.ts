import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { emailCampaigns, campaignRecipients } from "@/db/schema";
import { eq, isNotNull, sql } from "drizzle-orm";

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

    // Get current stats from campaign_recipients
    const [stats] = await db
      .select({
        totalSent: sql<number>`count(*) filter (where ${campaignRecipients.sentAt} is not null)`,
        uniqueOpens: sql<number>`count(*) filter (where ${campaignRecipients.openedAt} is not null)`,
        uniqueClicks: sql<number>`count(*) filter (where ${campaignRecipients.clickedAt} is not null)`,
        totalBounced: sql<number>`count(*) filter (where ${campaignRecipients.bouncedAt} is not null)`,
      })
      .from(campaignRecipients)
      .where(eq(campaignRecipients.campaignId, id));

    // Update campaign with calculated stats
    await db
      .update(emailCampaigns)
      .set({
        totalSent: Number(stats?.totalSent) || 0,
        uniqueOpens: Number(stats?.uniqueOpens) || 0,
        uniqueClicks: Number(stats?.uniqueClicks) || 0,
        totalBounced: Number(stats?.totalBounced) || 0,
        // Also update opened/clicked counts (can be same as unique for now)
        totalOpened: Number(stats?.uniqueOpens) || 0,
        totalClicked: Number(stats?.uniqueClicks) || 0,
        updatedAt: new Date(),
      })
      .where(eq(emailCampaigns.id, id));

    // TODO: In the future, integrate with Postmark API to fetch actual stats
    // This would use the postmarkBatchId to query Postmark for opens/clicks/bounces

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sync stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
