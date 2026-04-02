import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db, members, sweepstakesEntries, users } from "@/db";
import { createMagicLinkToken } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";
import {
  ensureCurrentSweepstakesCycle,
  getArizonaDateParts,
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
    const entryName = `${firstName.trim()} ${lastName.trim()}`.trim();

    const cycle = await ensureCurrentSweepstakesCycle();
    const { dateKey } = getArizonaDateParts();

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
            "This email already has an account. Please log in and enter from your member dashboard.",
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

    let [entry] = await db
      .select()
      .from(sweepstakesEntries)
      .where(
        and(
          eq(sweepstakesEntries.userId, user.id),
          eq(sweepstakesEntries.entryLocalDate, dateKey),
        ),
      )
      .limit(1);

    if (!entry) {
      const [createdEntry] = await db
        .insert(sweepstakesEntries)
        .values({
          cycleId: cycle.id,
          userId: user.id,
          memberId: member.id,
          entryName,
          entryEmail: normalizedEmail,
          entryLocalDate: dateKey,
          source: "campaign_page",
          referralCodeUsed,
        })
        .onConflictDoNothing()
        .returning();

      if (createdEntry) {
        entry = createdEntry;
      } else {
        [entry] = await db
          .select()
          .from(sweepstakesEntries)
          .where(
            and(
              eq(sweepstakesEntries.userId, user.id),
              eq(sweepstakesEntries.entryLocalDate, dateKey),
            ),
          )
          .limit(1);
      }
    }

    if (!entry) {
      throw new Error("Failed to create or load the sweepstakes entry");
    }

    const callbackUrl = `/member?sweepstakes=entry-confirmed&sweepstakesEntryId=${entry.id}`;
    const token = await createMagicLinkToken(normalizedEmail, callbackUrl);
    const emailSent = await sendMagicLinkEmail(normalizedEmail, token);

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send confirmation email" },
        { status: 500 },
      );
    }

    const alreadyEnteredToday = entry.status === "confirmed";

    return NextResponse.json({
      success: true,
      alreadyEnteredToday,
      message: alreadyEnteredToday
        ? "Today's entry is already confirmed. Check your email for your sign-in link."
        : "Check your email to finish account setup and confirm today's entry.",
    });
  } catch (error) {
    console.error("Sweepstakes entry error:", error);
    return NextResponse.json(
      { error: "Failed to submit sweepstakes entry" },
      { status: 500 },
    );
  }
}
