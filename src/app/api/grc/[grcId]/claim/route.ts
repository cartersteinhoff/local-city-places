import { NextRequest, NextResponse } from "next/server";
import { createJWT, SESSION_COOKIE_NAME } from "@/lib/auth";
import { db, grcs, merchants, users } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ grcId: string }> }
) {
  try {
    const { grcId } = await params;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(grcId)) {
      return NextResponse.redirect(new URL(`/claim/${grcId}?error=invalid`, appUrl));
    }

    // Fetch GRC
    const [grc] = await db
      .select({
        id: grcs.id,
        status: grcs.status,
        memberId: grcs.memberId,
        recipientEmail: grcs.recipientEmail,
      })
      .from(grcs)
      .where(eq(grcs.id, grcId))
      .limit(1);

    if (!grc) {
      return NextResponse.redirect(new URL(`/claim/${grcId}?error=not_found`, appUrl));
    }

    if (grc.status !== "pending" || grc.memberId) {
      return NextResponse.redirect(new URL(`/claim/${grcId}?error=unavailable`, appUrl));
    }

    if (!grc.recipientEmail) {
      // No email on record — fall back to manual claim page
      return NextResponse.redirect(new URL(`/claim/${grcId}`, appUrl));
    }

    // Find or create user for this email
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, grc.recipientEmail.toLowerCase()))
      .limit(1);

    if (!user) {
      // Create a member account for this email
      [user] = await db
        .insert(users)
        .values({
          email: grc.recipientEmail.toLowerCase(),
          role: "member",
        })
        .returning();
    }

    // Create JWT and set session cookie
    const jwtToken = await createJWT(user.id, user.role);

    const response = NextResponse.redirect(
      new URL(`/member/register?grc=${grcId}`, appUrl)
    );

    response.cookies.set(SESSION_COOKIE_NAME, jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("GRC claim error:", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL(`/claim/${(await params).grcId}?error=server`, appUrl));
  }
}
