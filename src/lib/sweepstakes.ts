import { randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import {
  db,
  memberReferrals,
  sweepstakesCycles,
  sweepstakesEntries,
  sweepstakesReferralActivations,
  sweepstakesReferralCodes,
} from "@/db";

export const SWEEPSTAKES_TIME_ZONE = "America/Phoenix";
const PHOENIX_UTC_OFFSET_HOURS = 7;

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    dateKey: `${map.year}-${map.month}-${map.day}`,
  };
}

export function getArizonaDateParts(date: Date = new Date()) {
  return getDatePartsInTimeZone(date, SWEEPSTAKES_TIME_ZONE);
}

export function getSweepstakesCycleName(year: number, month: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: SWEEPSTAKES_TIME_ZONE,
  }).format(new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)));
}

export function getSweepstakesCycleBounds(year: number, month: number) {
  const startsAt = new Date(Date.UTC(year, month - 1, 1, PHOENIX_UTC_OFFSET_HOURS, 0, 0, 0));
  const endsAt = new Date(Date.UTC(year, month, 1, PHOENIX_UTC_OFFSET_HOURS - 1, 59, 59, 999));

  return { startsAt, endsAt };
}

export async function ensureCurrentSweepstakesCycle() {
  const { year, month } = getArizonaDateParts();
  return ensureSweepstakesCycle(year, month);
}

export async function ensureSweepstakesCycle(year: number, month: number) {
  const [existingCycle] = await db
    .select()
    .from(sweepstakesCycles)
    .where(and(eq(sweepstakesCycles.year, year), eq(sweepstakesCycles.month, month)))
    .limit(1);

  if (existingCycle) {
    return existingCycle;
  }

  const { startsAt, endsAt } = getSweepstakesCycleBounds(year, month);
  const [createdCycle] = await db
    .insert(sweepstakesCycles)
    .values({
      year,
      month,
      name: getSweepstakesCycleName(year, month),
      startsAt,
      endsAt,
    })
    .onConflictDoNothing()
    .returning();

  if (createdCycle) {
    return createdCycle;
  }

  const [cycleAfterConflict] = await db
    .select()
    .from(sweepstakesCycles)
    .where(and(eq(sweepstakesCycles.year, year), eq(sweepstakesCycles.month, month)))
    .limit(1);

  if (!cycleAfterConflict) {
    throw new Error("Failed to create or load the current sweepstakes cycle");
  }

  return cycleAfterConflict;
}

function generateReferralCodeValue() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export function normalizeReferralCode(code: string | null | undefined) {
  const normalized = code?.trim().toUpperCase();
  return normalized || null;
}

export function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export async function ensureSweepstakesReferralCode(memberId: string) {
  const [existingCode] = await db
    .select()
    .from(sweepstakesReferralCodes)
    .where(eq(sweepstakesReferralCodes.memberId, memberId))
    .limit(1);

  if (existingCode) {
    return existingCode;
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateReferralCodeValue();
    const [createdCode] = await db
      .insert(sweepstakesReferralCodes)
      .values({
        memberId,
        code,
      })
      .onConflictDoNothing()
      .returning();

    if (createdCode) {
      return createdCode;
    }

    const [codeAfterConflict] = await db
      .select()
      .from(sweepstakesReferralCodes)
      .where(eq(sweepstakesReferralCodes.memberId, memberId))
      .limit(1);

    if (codeAfterConflict) {
      return codeAfterConflict;
    }
  }

  throw new Error("Failed to create a unique referral code");
}

export async function maybeAttachReferralToMember(memberId: string, referralCode: string | null | undefined) {
  const normalizedCode = normalizeReferralCode(referralCode);
  if (!normalizedCode) {
    return null;
  }

  const [existingReferral] = await db
    .select()
    .from(memberReferrals)
    .where(eq(memberReferrals.referredMemberId, memberId))
    .limit(1);

  if (existingReferral) {
    return existingReferral;
  }

  const [existingConfirmedEntry] = await db
    .select({ id: sweepstakesEntries.id })
    .from(sweepstakesEntries)
    .where(
      and(
        eq(sweepstakesEntries.memberId, memberId),
        eq(sweepstakesEntries.status, "confirmed")
      )
    )
    .limit(1);

  if (existingConfirmedEntry) {
    return null;
  }

  const [codeOwner] = await db
    .select()
    .from(sweepstakesReferralCodes)
    .where(eq(sweepstakesReferralCodes.code, normalizedCode))
    .limit(1);

  if (!codeOwner || codeOwner.memberId === memberId) {
    return null;
  }

  const [createdReferral] = await db
    .insert(memberReferrals)
    .values({
      referrerMemberId: codeOwner.memberId,
      referredMemberId: memberId,
      referralCodeUsed: normalizedCode,
    })
    .onConflictDoNothing()
    .returning();

  if (createdReferral) {
    return createdReferral;
  }

  const [referralAfterConflict] = await db
    .select()
    .from(memberReferrals)
    .where(eq(memberReferrals.referredMemberId, memberId))
    .limit(1);

  return referralAfterConflict ?? null;
}

export async function confirmSweepstakesEntry(entryId: string, userId: string) {
  const [existingEntry] = await db
    .select()
    .from(sweepstakesEntries)
    .where(and(eq(sweepstakesEntries.id, entryId), eq(sweepstakesEntries.userId, userId)))
    .limit(1);

  if (!existingEntry || existingEntry.status === "void") {
    return null;
  }

  let entry = existingEntry;

  if (existingEntry.status !== "confirmed") {
    const [updatedEntry] = await db
      .update(sweepstakesEntries)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sweepstakesEntries.id, existingEntry.id))
      .returning();

    if (updatedEntry) {
      entry = updatedEntry;
    }
  }

  const [referral] = await db
    .select()
    .from(memberReferrals)
    .where(eq(memberReferrals.referredMemberId, entry.memberId))
    .limit(1);

  if (referral) {
    await db
      .insert(sweepstakesReferralActivations)
      .values({
        cycleId: entry.cycleId,
        referrerMemberId: referral.referrerMemberId,
        referredMemberId: entry.memberId,
        activatingEntryId: entry.id,
        activatedAt: entry.confirmedAt ?? new Date(),
      })
      .onConflictDoNothing();
  }

  return entry;
}

interface ConfirmDashboardEntryParams {
  userId: string;
  memberId: string;
  entryName: string;
  entryEmail: string;
}

export async function createOrConfirmDashboardSweepstakesEntry({
  userId,
  memberId,
  entryName,
  entryEmail,
}: ConfirmDashboardEntryParams) {
  const cycle = await ensureCurrentSweepstakesCycle();
  const { dateKey } = getArizonaDateParts();

  let [entry] = await db
    .select()
    .from(sweepstakesEntries)
    .where(
      and(
        eq(sweepstakesEntries.userId, userId),
        eq(sweepstakesEntries.entryLocalDate, dateKey)
      )
    )
    .limit(1);

  if (!entry) {
    const [createdEntry] = await db
      .insert(sweepstakesEntries)
      .values({
        cycleId: cycle.id,
        userId,
        memberId,
        entryName,
        entryEmail,
        entryLocalDate: dateKey,
        source: "dashboard",
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
            eq(sweepstakesEntries.userId, userId),
            eq(sweepstakesEntries.entryLocalDate, dateKey)
          )
        )
        .limit(1);
    }
  }

  if (!entry) {
    throw new Error("Failed to create or load the dashboard sweepstakes entry");
  }

  if (entry.status === "confirmed") {
    return { entry, alreadyEnteredToday: true, cycle };
  }

  const confirmedEntry = await confirmSweepstakesEntry(entry.id, userId);

  if (!confirmedEntry) {
    throw new Error("Failed to confirm the dashboard sweepstakes entry");
  }

  return { entry: confirmedEntry, alreadyEnteredToday: false, cycle };
}

export function buildSweepstakesReferralLink(code: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/favorite-merchant-sweepstakes?ref=${code}`;
}
