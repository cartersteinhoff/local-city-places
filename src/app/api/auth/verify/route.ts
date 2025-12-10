import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLinkToken, getRedirectPath } from "@/lib/auth";
import { db, members, merchants } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/?error=missing_token", request.url));
  }

  try {
    const result = await verifyMagicLinkToken(token);

    if (!result.success) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(result.error || "invalid_token")}`, request.url)
      );
    }

    // Check if user has a profile
    let hasProfile = false;

    if (result.role === "member" && result.userId) {
      const [member] = await db
        .select()
        .from(members)
        .where(eq(members.userId, result.userId))
        .limit(1);
      hasProfile = !!member;
    } else if (result.role === "merchant" && result.userId) {
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, result.userId))
        .limit(1);
      hasProfile = !!merchant;
    } else if (result.role === "admin") {
      hasProfile = true; // Admins don't need a profile
    }

    const redirectPath = getRedirectPath(result.role!, hasProfile);
    return NextResponse.redirect(new URL(redirectPath, request.url));
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(new URL("/?error=verification_failed", request.url));
  }
}
