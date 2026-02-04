import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const JWT_EXPIRY_DAYS = 30;

// DEV ONLY: Quick login without magic link
// Usage: GET /api/auth/dev-login?role=admin (or email=user@example.com)
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Dev login only available in development" },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const role = searchParams.get("role") || "admin";
  const email = searchParams.get("email");
  const redirect = searchParams.get("redirect") || "/admin";

  try {
    // Find user by email or role
    let user;
    if (email) {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
    } else {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.role, role))
        .limit(1);
    }

    if (!user) {
      return NextResponse.json(
        { error: `No user found with ${email ? `email: ${email}` : `role: ${role}`}` },
        { status: 404 }
      );
    }

    // Create JWT
    const token = await new SignJWT({ userId: user.id, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${JWT_EXPIRY_DAYS}d`)
      .sign(JWT_SECRET);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: false, // Dev only
      sameSite: "lax",
      maxAge: JWT_EXPIRY_DAYS * 24 * 60 * 60,
      path: "/",
    });

    // Redirect or return success
    if (searchParams.get("json") === "true") {
      return NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, role: user.role },
      });
    }

    return NextResponse.redirect(new URL(redirect, request.url));
  } catch (error) {
    console.error("Dev login error:", error);
    return NextResponse.json(
      { error: "Dev login failed" },
      { status: 500 }
    );
  }
}
