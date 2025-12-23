import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { campaignRecipients } from "@/db/schema";
import { eq, and, isNotNull, sql } from "drizzle-orm";

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
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const filter = searchParams.get("filter"); // all, sent, opened, clicked, bounced

    const offset = (page - 1) * limit;

    // Build where conditions
    let whereCondition = eq(campaignRecipients.campaignId, id);

    if (filter === "sent") {
      whereCondition = and(whereCondition, isNotNull(campaignRecipients.sentAt))!;
    } else if (filter === "opened") {
      whereCondition = and(whereCondition, isNotNull(campaignRecipients.openedAt))!;
    } else if (filter === "clicked") {
      whereCondition = and(whereCondition, isNotNull(campaignRecipients.clickedAt))!;
    } else if (filter === "bounced") {
      whereCondition = and(whereCondition, isNotNull(campaignRecipients.bouncedAt))!;
    }

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(campaignRecipients)
      .where(whereCondition);

    const total = Number(countResult?.count) || 0;
    const totalPages = Math.ceil(total / limit);

    // Get recipients
    const recipients = await db
      .select({
        id: campaignRecipients.id,
        email: campaignRecipients.email,
        name: campaignRecipients.name,
        status: campaignRecipients.status,
        sentAt: campaignRecipients.sentAt,
        openedAt: campaignRecipients.openedAt,
        clickedAt: campaignRecipients.clickedAt,
        bouncedAt: campaignRecipients.bouncedAt,
      })
      .from(campaignRecipients)
      .where(whereCondition)
      .orderBy(campaignRecipients.email)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      recipients,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get recipients error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
