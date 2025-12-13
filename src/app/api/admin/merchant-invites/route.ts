import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateToken, hashToken } from "@/lib/auth";
import { db, merchantInvites, users } from "@/db";
import { eq, desc, sql, and, gt, isNull, isNotNull, lt } from "drizzle-orm";
import { sendMerchantInviteEmail } from "@/lib/email";
import { validateEmailForMerchant } from "@/lib/merchant-onboarding";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const DEFAULT_EXPIRY_DAYS = 7;

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status") || "all";
    const offset = (page - 1) * limit;

    const now = new Date();

    // Build where clause based on status
    let whereClause;
    switch (status) {
      case "pending":
        whereClause = and(
          isNull(merchantInvites.usedAt),
          gt(merchantInvites.expiresAt, now)
        );
        break;
      case "used":
        whereClause = isNotNull(merchantInvites.usedAt);
        break;
      case "expired":
        whereClause = and(
          isNull(merchantInvites.usedAt),
          lt(merchantInvites.expiresAt, now)
        );
        break;
      default:
        whereClause = undefined;
    }

    // Count query
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(merchantInvites)
      .where(whereClause);
    const total = Number(countResult[0].count);
    const totalPages = Math.ceil(total / limit);

    // Data query with pagination
    const invites = await db
      .select({
        id: merchantInvites.id,
        token: merchantInvites.token,
        email: merchantInvites.email,
        expiresAt: merchantInvites.expiresAt,
        usedAt: merchantInvites.usedAt,
        createdAt: merchantInvites.createdAt,
        createdBy: merchantInvites.createdBy,
        usedByUserId: merchantInvites.usedByUserId,
        createdByEmail: users.email,
      })
      .from(merchantInvites)
      .leftJoin(users, eq(merchantInvites.createdBy, users.id))
      .where(whereClause)
      .orderBy(desc(merchantInvites.createdAt))
      .limit(limit)
      .offset(offset);

    // Add computed status to each invite
    const invitesWithStatus = invites.map((invite) => {
      let computedStatus: "pending" | "used" | "expired";
      if (invite.usedAt) {
        computedStatus = "used";
      } else if (new Date(invite.expiresAt) < now) {
        computedStatus = "expired";
      } else {
        computedStatus = "pending";
      }
      return {
        ...invite,
        status: computedStatus,
      };
    });

    // Stats query
    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(merchantInvites)
      .where(and(isNull(merchantInvites.usedAt), gt(merchantInvites.expiresAt, now)));

    const [usedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(merchantInvites)
      .where(isNotNull(merchantInvites.usedAt));

    const [expiredCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(merchantInvites)
      .where(and(isNull(merchantInvites.usedAt), lt(merchantInvites.expiresAt, now)));

    return NextResponse.json({
      invites: invitesWithStatus,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      stats: {
        pending: Number(pendingCount.count),
        used: Number(usedCount.count),
        expired: Number(expiredCount.count),
        total: Number(pendingCount.count) + Number(usedCount.count) + Number(expiredCount.count),
      },
    });
  } catch (error) {
    console.error("Error fetching merchant invites:", error);
    return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, expiresInDays = DEFAULT_EXPIRY_DAYS, sendEmail = true } = body;

    // If email is provided, validate it's not already in use
    if (email) {
      const validationError = await validateEmailForMerchant(email);
      if (validationError) {
        return NextResponse.json({ error: validationError.message }, { status: 400 });
      }
    }

    // Validate expiry days
    const validExpiryDays = Math.min(30, Math.max(1, parseInt(expiresInDays) || DEFAULT_EXPIRY_DAYS));

    // Generate token
    const token = generateToken();
    const hashedToken = hashToken(token);
    const expiresAt = new Date(Date.now() + validExpiryDays * 24 * 60 * 60 * 1000);

    // Create invite record
    const [invite] = await db
      .insert(merchantInvites)
      .values({
        token: hashedToken,
        email: email?.toLowerCase().trim() || null,
        expiresAt,
        createdBy: session.user.id,
      })
      .returning();

    // Generate invite URL (using raw token, not hashed)
    const inviteUrl = `${APP_URL}/onboard/merchant?token=${token}`;

    // Send email if email provided and sendEmail is true
    if (email && sendEmail) {
      await sendMerchantInviteEmail({
        email: email.toLowerCase().trim(),
        inviteUrl,
        expiresInDays: validExpiryDays,
      });
    }

    return NextResponse.json({
      invite: {
        id: invite.id,
        email: invite.email,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      },
      inviteUrl,
      emailSent: email && sendEmail,
    });
  } catch (error) {
    console.error("Error creating merchant invite:", error);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}
