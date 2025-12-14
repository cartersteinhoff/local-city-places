import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLinkToken, getRedirectPath, isValidCallbackUrl, SESSION_COOKIE_NAME } from "@/lib/auth";
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

    // Determine redirect path with smart fallback
    // Priority: 1) Force onboarding for new users, 2) Use callbackUrl, 3) Role-based default
    let redirectPath: string;
    if (result.role === "member" && !hasProfile) {
      // New members must complete registration first
      // Preserve query params from callbackUrl (e.g., grc=xxx for claiming)
      if (result.callbackUrl && isValidCallbackUrl(result.callbackUrl)) {
        const callbackUrlObj = new URL(result.callbackUrl, request.url);
        redirectPath = `/member/register${callbackUrlObj.search}`;
      } else {
        redirectPath = "/member/register";
      }
    } else if (isValidCallbackUrl(result.callbackUrl)) {
      // Use the stored callback URL
      redirectPath = result.callbackUrl!;
    } else {
      // Fallback to role-based default
      redirectPath = getRedirectPath(result.role!, hasProfile);
    }

    const response = NextResponse.redirect(new URL(redirectPath, request.url));

    // Set the JWT cookie on the redirect response
    if (result.jwtToken) {
      response.cookies.set(SESSION_COOKIE_NAME, result.jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(new URL("/?error=verification_failed", request.url));
  }
}
