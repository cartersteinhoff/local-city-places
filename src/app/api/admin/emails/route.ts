import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { emailCampaigns, users } from "@/db/schema";
import { eq, desc, sql, and, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status"); // draft, sent, failed, or null for all
    const search = searchParams.get("search")?.trim();

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (status && ["draft", "sending", "sent", "failed"].includes(status)) {
      conditions.push(eq(emailCampaigns.status, status as "draft" | "sending" | "sent" | "failed"));
    }
    if (search) {
      conditions.push(ilike(emailCampaigns.subject, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailCampaigns)
      .where(whereClause);

    const total = Number(countResult?.count) || 0;
    const totalPages = Math.ceil(total / limit);

    // Get paginated campaigns with creator info
    const campaigns = await db
      .select({
        id: emailCampaigns.id,
        subject: emailCampaigns.subject,
        previewText: emailCampaigns.previewText,
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
      .where(whereClause)
      .orderBy(desc(emailCampaigns.createdAt))
      .limit(limit)
      .offset(offset);

    // Get stats (always for all campaigns, not filtered)
    const [stats] = await db
      .select({
        totalCampaigns: sql<number>`count(*)`,
        draftCount: sql<number>`count(*) filter (where ${emailCampaigns.status} = 'draft')`,
        sentCount: sql<number>`count(*) filter (where ${emailCampaigns.status} = 'sent')`,
        totalRecipients: sql<number>`coalesce(sum(${emailCampaigns.totalSent}), 0)`,
      })
      .from(emailCampaigns);

    return NextResponse.json({
      campaigns: campaigns.map(c => ({
        ...c,
        totalSent: c.totalSent || 0,
        totalOpened: c.totalOpened || 0,
        totalClicked: c.totalClicked || 0,
        totalBounced: c.totalBounced || 0,
        uniqueOpens: c.uniqueOpens || 0,
        uniqueClicks: c.uniqueClicks || 0,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      stats: {
        totalCampaigns: Number(stats?.totalCampaigns) || 0,
        draftCount: Number(stats?.draftCount) || 0,
        sentCount: Number(stats?.sentCount) || 0,
        totalRecipients: Number(stats?.totalRecipients) || 0,
      },
    });
  } catch (error) {
    console.error("Admin emails API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, previewText, content, recipientType, recipientLists, recipientCount } = body;

    if (!subject || !content || !recipientType) {
      return NextResponse.json(
        { error: "Subject, content, and recipient type are required" },
        { status: 400 }
      );
    }

    const [campaign] = await db
      .insert(emailCampaigns)
      .values({
        subject,
        previewText: previewText || null,
        content,
        recipientType,
        recipientLists: recipientLists || null,
        recipientCount: recipientCount || 0,
        createdBy: session.user.id,
        status: "draft",
      })
      .returning();

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
