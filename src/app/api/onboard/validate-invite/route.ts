import { NextRequest, NextResponse } from "next/server";
import { hashToken } from "@/lib/auth";
import { db, merchantInvites } from "@/db";
import { eq, and, gt, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const hashedToken = hashToken(token);

    // Find the invite
    const [invite] = await db
      .select()
      .from(merchantInvites)
      .where(
        and(
          eq(merchantInvites.token, hashedToken),
          isNull(merchantInvites.usedAt),
          gt(merchantInvites.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!invite) {
      // Check if the token exists but is used or expired
      const [existingInvite] = await db
        .select()
        .from(merchantInvites)
        .where(eq(merchantInvites.token, hashedToken))
        .limit(1);

      if (existingInvite) {
        if (existingInvite.usedAt) {
          return NextResponse.json({
            valid: false,
            error: "This invitation has already been used",
          });
        }
        if (new Date(existingInvite.expiresAt) < new Date()) {
          return NextResponse.json({
            valid: false,
            error: "This invitation has expired",
          });
        }
      }

      return NextResponse.json({
        valid: false,
        error: "Invalid invitation link",
      });
    }

    return NextResponse.json({
      valid: true,
      email: invite.email || null,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error("Error validating invite:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate invitation" },
      { status: 500 }
    );
  }
}
