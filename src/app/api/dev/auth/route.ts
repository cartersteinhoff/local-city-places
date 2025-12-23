import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * DEV-ONLY: Direct authentication endpoint for testing
 * This endpoint ONLY works in development mode
 *
 * Usage: POST /api/dev/auth with { email: "admin@example.com" }
 * Or: GET /api/dev/auth?email=admin@example.com
 */

export async function POST(request: NextRequest) {
  // Security: Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  if (!JWT_SECRET) {
    return NextResponse.json(
      { error: "JWT_SECRET not configured" },
      { status: 500 }
    );
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: `User not found: ${email}` },
        { status: 404 }
      );
    }

    // Generate JWT (same as auth flow)
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

    // Set cookie (must match SESSION_COOKIE_NAME in lib/auth.ts)
    const cookieStore = await cookies();
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: false, // Dev only, no HTTPS required
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      message: `Authenticated as ${user.role}: ${user.email}`,
    });
  } catch (error) {
    console.error("Dev auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Security: Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    // Return list of available users for convenience
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .limit(20);

    return NextResponse.json({
      message: "Dev auth endpoint. Provide ?email=user@example.com to authenticate",
      availableUsers: allUsers,
    });
  }

  // Create a fake request with the email
  const fakeRequest = new NextRequest(request.url, {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  return POST(fakeRequest);
}
