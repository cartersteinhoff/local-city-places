import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db, users, magicLinkTokens, members, merchants } from "@/db";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";

export const SESSION_COOKIE_NAME = "session_token";
const MAGIC_LINK_EXPIRY_MINUTES = 4320; // 3 days
const JWT_EXPIRY_DAYS = 30;

// JWT secret - must be set in environment
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Generate a secure random token
export function generateToken(length = 32): string {
  return randomBytes(length).toString("hex");
}

// Hash a token for storage
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Validate callback URL (must be relative path, prevent open redirects)
export function isValidCallbackUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  // Must start with / but not // (protocol-relative URL)
  // Skip homepage "/" - use role-based redirect instead
  if (url === "/" || url === "/?") return false;
  return url.startsWith("/") && !url.startsWith("//");
}

// Create a JWT token
async function createJWT(userId: string, role: string): Promise<string> {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${JWT_EXPIRY_DAYS}d`)
    .sign(JWT_SECRET);
}

// Verify a JWT token
async function verifyJWT(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

// Create a magic link token
export async function createMagicLinkToken(email: string, callbackUrl?: string): Promise<string> {
  const token = generateToken();
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(magicLinkTokens).values({
    email: email.toLowerCase(),
    token: hashedToken,
    callbackUrl: isValidCallbackUrl(callbackUrl) ? callbackUrl : null,
    expiresAt,
  });

  return token;
}

// Verify a magic link token and create JWT
export async function verifyMagicLinkToken(token: string): Promise<{
  success: boolean;
  userId?: string;
  role?: string;
  jwtToken?: string;
  callbackUrl?: string | null;
  error?: string;
}> {
  const hashedToken = hashToken(token);

  // Find the token
  const [magicLink] = await db
    .select()
    .from(magicLinkTokens)
    .where(
      and(
        eq(magicLinkTokens.token, hashedToken),
        gt(magicLinkTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!magicLink) {
    return { success: false, error: "Invalid or expired link" };
  }

  if (magicLink.usedAt) {
    return { success: false, error: "Link has already been used" };
  }

  // Mark token as used
  await db
    .update(magicLinkTokens)
    .set({ usedAt: new Date() })
    .where(eq(magicLinkTokens.id, magicLink.id));

  // Find user - only existing users can log in (admins create accounts)
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, magicLink.email))
    .limit(1);

  if (!user) {
    return { success: false, error: "No account found. Please contact an admin." };
  }

  // Create JWT token
  const jwtToken = await createJWT(user.id, user.role);

  return {
    success: true,
    userId: user.id,
    role: user.role,
    jwtToken,
    callbackUrl: magicLink.callbackUrl,
  };
}

// Get current session from JWT
export async function getSession(): Promise<{
  user: typeof users.$inferSelect;
  member?: typeof members.$inferSelect;
  merchant?: typeof merchants.$inferSelect;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  // Verify JWT
  const payload = await verifyJWT(token);
  if (!payload) {
    return null;
  }

  // Get user from DB (for fresh data)
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user) {
    return null;
  }

  // Get member and merchant profiles if they exist
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.userId, user.id))
    .limit(1);

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.userId, user.id))
    .limit(1);

  return { user, member, merchant };
}

// Require authentication - redirect if not logged in
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }
  return session;
}

// Require specific role
export async function requireRole(role: "member" | "merchant" | "admin") {
  const session = await requireAuth();
  if (session.user.role !== role) {
    redirect("/");
  }
  return session;
}

// Logout - just clear the cookie (no DB operation needed with JWT)
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Get redirect path based on user role
export function getRedirectPath(role: string, hasProfile: boolean): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "merchant":
      return "/merchant";
    case "member":
      return hasProfile ? "/member" : "/member/register";
    default:
      return "/";
  }
}
