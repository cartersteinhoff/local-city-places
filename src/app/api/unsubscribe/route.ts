import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, emailPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/unsubscribe?userId=xxx or ?email=xxx
 * Fetches current email preferences for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json(
        { error: "Missing userId or email parameter" },
        { status: 400 }
      );
    }

    // Find the user
    let user;
    if (userId) {
      [user] = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
    } else if (email) {
      [user] = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get email preferences
    const [prefs] = await db
      .select()
      .from(emailPreferences)
      .where(eq(emailPreferences.userId, user.id))
      .limit(1);

    return NextResponse.json({
      email: user.email,
      marketingEmails: prefs?.marketingEmails ?? true,
      transactionalEmails: prefs?.transactionalEmails ?? true,
      unsubscribedAll: prefs?.unsubscribedAll ?? false,
    });
  } catch (error) {
    console.error("Get email preferences error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/unsubscribe
 * Updates email preferences for a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, marketingEmails, transactionalEmails, unsubscribedAll } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { error: "Missing userId or email" },
        { status: 400 }
      );
    }

    // Find the user
    let user;
    if (userId) {
      [user] = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
    } else if (email) {
      [user] = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if preferences exist
    const [existingPrefs] = await db
      .select()
      .from(emailPreferences)
      .where(eq(emailPreferences.userId, user.id))
      .limit(1);

    const prefsData = {
      marketingEmails: marketingEmails ?? true,
      transactionalEmails: transactionalEmails ?? true,
      unsubscribedAll: unsubscribedAll ?? false,
      updatedAt: new Date(),
    };

    if (existingPrefs) {
      // Update existing preferences
      await db
        .update(emailPreferences)
        .set(prefsData)
        .where(eq(emailPreferences.userId, user.id));
    } else {
      // Create new preferences
      await db.insert(emailPreferences).values({
        userId: user.id,
        ...prefsData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update email preferences error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
