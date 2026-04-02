import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db, members, users } from "@/db";
import { createMagicLinkToken } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";
import {
  maybeAttachReferralToMember,
  normalizeReferralCode,
} from "@/lib/sweepstakes";
import { stripPhoneNumber } from "@/lib/utils";
import { sweepstakesEntrySchema } from "@/lib/validations/sweepstakes";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = sweepstakesEntrySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error.flatten() },
        { status: 400 },
      );
    }

    const { firstName, lastName, email, phone, referredBy } = result.data;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone ? stripPhoneNumber(phone) : "";
    const referralCodeUsed = normalizeReferralCode(referredBy);
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (user) {
      return NextResponse.json(
        {
          code: "login_required",
          error:
            "This email already has an account. Please log in from your member dashboard to submit a favorite merchant nomination.",
          loginUrl: "/favorite-merchant-sweepstakes",
        },
        { status: 409 },
      );
    }

    const [createdUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        role: "member",
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(normalizedPhone && { phone: normalizedPhone }),
      })
      .onConflictDoNothing()
      .returning();

    if (createdUser) {
      user = createdUser;
    } else {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);
    }

    if (!user) {
      throw new Error("Failed to create a new sweepstakes user");
    }

    let [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, user.id))
      .limit(1);

    if (!member) {
      [member] = await db
        .insert(members)
        .values({
          userId: user.id,
        })
        .returning();
    }

    await maybeAttachReferralToMember(member.id, referralCodeUsed);

    const callbackUrl = "/member?sweepstakes=account-created";
    const token = await createMagicLinkToken(normalizedEmail, callbackUrl);
    const emailSent = await sendMagicLinkEmail(normalizedEmail, token);

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send confirmation email" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Check your email to finish account setup. Once you're in, submit a favorite merchant nomination to lock in your sweepstakes entry.",
    });
  } catch (error) {
    console.error("Favorite merchant member signup error:", error);
    return NextResponse.json(
      { error: "Failed to create member account" },
      { status: 500 },
    );
  }
}
