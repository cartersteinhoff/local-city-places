import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, users, sessions, magicLinkTokens, members, merchants } from "@/db";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";

const SESSION_COOKIE_NAME = "session_token";
const SESSION_EXPIRY_DAYS = 7;
const MAGIC_LINK_EXPIRY_MINUTES = 15;

// Generate a secure random token
export function generateToken(length = 32): string {
  return randomBytes(length).toString("hex");
}

// Hash a token for storage
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Create a magic link token
export async function createMagicLinkToken(email: string): Promise<string> {
  const token = generateToken();
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(magicLinkTokens).values({
    email: email.toLowerCase(),
    token: hashedToken,
    expiresAt,
  });

  return token;
}

// Verify a magic link token and create session
export async function verifyMagicLinkToken(token: string): Promise<{
  success: boolean;
  userId?: string;
  role?: string;
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

  // Find or create user
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, magicLink.email))
    .limit(1);

  if (!user) {
    // Create new user (default role is member)
    const [newUser] = await db
      .insert(users)
      .values({ email: magicLink.email })
      .returning();
    user = newUser;
  }

  // Create session
  const sessionToken = generateToken();
  const hashedSessionToken = hashToken(sessionToken);
  const sessionExpiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    userId: user.id,
    token: hashedSessionToken,
    expiresAt: sessionExpiresAt,
  });

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: sessionExpiresAt,
    path: "/",
  });

  return { success: true, userId: user.id, role: user.role };
}

// Get current session
export async function getSession(): Promise<{
  user: typeof users.$inferSelect;
  member?: typeof members.$inferSelect;
  merchant?: typeof merchants.$inferSelect;
} | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const hashedToken = hashToken(sessionToken);

  // Find valid session
  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.token, hashedToken),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!session) {
    return null;
  }

  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    return null;
  }

  // Get member and merchant profiles if they exist (admins may have both)
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

// Logout
export async function logout() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    const hashedToken = hashToken(sessionToken);
    await db.delete(sessions).where(eq(sessions.token, hashedToken));
  }

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
