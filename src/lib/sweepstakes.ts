import { randomBytes, randomInt, randomUUID } from "crypto";
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { sendSweepstakesPrizeEmail } from "@/lib/email";
import {
  db,
  memberReferrals,
  members,
  sweepstakesCycles,
  sweepstakesEntries,
  sweepstakesReferralActivations,
  sweepstakesReferralCodes,
  sweepstakesWinners,
  users,
} from "@/db";

export const SWEEPSTAKES_TIME_ZONE = "America/Phoenix";
const PHOENIX_UTC_OFFSET_HOURS = 7;

export interface SweepstakesLeaderboardRow {
  memberId: string;
  displayName: string;
  email: string;
  regularEntries: number;
  referralEntries: number;
  totalEntries: number;
  rank: number;
}

export interface SweepstakesWinnerRow {
  id: string;
  prizeTier: "grand_prize" | "tier1_match" | "tier2_match";
  memberId: string;
  displayName: string;
  email: string;
  selectionMethod: "draw" | "manual_override";
  regularEntries: number;
  referralEntries: number;
  totalEntries: number;
  emailSentAt: string | null;
  createdAt: string;
}

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

export function getArizonaCycleYearMonthOffset(offset: number, date: Date = new Date()) {
  const { year, month } = getArizonaDateParts(date);
  const offsetDate = new Date(Date.UTC(year, month - 1 + offset, 1, 12, 0, 0));
  return {
    year: offsetDate.getUTCFullYear(),
    month: offsetDate.getUTCMonth() + 1,
  };
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

export async function getAvailableSweepstakesCycles() {
  return db
    .select()
    .from(sweepstakesCycles)
    .orderBy(desc(sweepstakesCycles.year), desc(sweepstakesCycles.month));
}

export async function getDefaultAdminSweepstakesCycle() {
  const [previousClosedCycle] = await db
    .select()
    .from(sweepstakesCycles)
    .where(lt(sweepstakesCycles.endsAt, new Date()))
    .orderBy(desc(sweepstakesCycles.year), desc(sweepstakesCycles.month))
    .limit(1);

  if (previousClosedCycle) {
    return previousClosedCycle;
  }

  return ensureCurrentSweepstakesCycle();
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

function formatLeaderboardDisplayName(firstName: string | null, lastName: string | null, email: string) {
  const trimmedFirstName = firstName?.trim();
  const trimmedLastName = lastName?.trim();

  if (trimmedFirstName) {
    return trimmedLastName
      ? `${trimmedFirstName} ${trimmedLastName.charAt(0).toUpperCase()}.`
      : trimmedFirstName;
  }

  return email.split("@")[0];
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

export async function getSweepstakesLeaderboard(cycleId: string) {
  const [regularCounts, referralCounts] = await Promise.all([
    db
      .select({
        memberId: sweepstakesEntries.memberId,
        count: sql<number>`count(*)::int`,
      })
      .from(sweepstakesEntries)
      .where(
        and(
          eq(sweepstakesEntries.cycleId, cycleId),
          eq(sweepstakesEntries.status, "confirmed")
        )
      )
      .groupBy(sweepstakesEntries.memberId),
    db
      .select({
        memberId: sweepstakesReferralActivations.referrerMemberId,
        count: sql<number>`count(*)::int`,
      })
      .from(sweepstakesReferralActivations)
      .where(eq(sweepstakesReferralActivations.cycleId, cycleId))
      .groupBy(sweepstakesReferralActivations.referrerMemberId),
  ]);

  const leaderboardMap = new Map<
    string,
    { regularEntries: number; referralEntries: number }
  >();

  for (const row of regularCounts) {
    leaderboardMap.set(row.memberId, {
      regularEntries: row.count,
      referralEntries: leaderboardMap.get(row.memberId)?.referralEntries || 0,
    });
  }

  for (const row of referralCounts) {
    leaderboardMap.set(row.memberId, {
      regularEntries: leaderboardMap.get(row.memberId)?.regularEntries || 0,
      referralEntries: row.count,
    });
  }

  const memberIds = Array.from(leaderboardMap.keys());
  if (memberIds.length === 0) {
    return [] as SweepstakesLeaderboardRow[];
  }

  const identities = await db
    .select({
      memberId: members.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(inArray(members.id, memberIds));

  const identityMap = new Map(identities.map((row) => [row.memberId, row]));

  return memberIds
    .map((memberId) => {
      const identity = identityMap.get(memberId);
      if (!identity) {
        return null;
      }

      const counts = leaderboardMap.get(memberId)!;
      const totalEntries = counts.regularEntries + counts.referralEntries;

      return {
        memberId,
        displayName: formatLeaderboardDisplayName(
          identity.firstName,
          identity.lastName,
          identity.email
        ),
        email: identity.email,
        regularEntries: counts.regularEntries,
        referralEntries: counts.referralEntries,
        totalEntries,
        rank: 0,
      };
    })
    .filter((row): row is SweepstakesLeaderboardRow => !!row)
    .sort((a, b) => {
      if (b.totalEntries !== a.totalEntries) return b.totalEntries - a.totalEntries;
      if (b.regularEntries !== a.regularEntries) return b.regularEntries - a.regularEntries;
      if (b.referralEntries !== a.referralEntries) return b.referralEntries - a.referralEntries;
      return a.displayName.localeCompare(b.displayName);
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
}

export async function getActiveSweepstakesWinners(cycleId: string) {
  const rows = await db
    .select({
      id: sweepstakesWinners.id,
      prizeTier: sweepstakesWinners.prizeTier,
      memberId: sweepstakesWinners.winnerMemberId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      selectionMethod: sweepstakesWinners.selectionMethod,
      regularEntries: sweepstakesWinners.regularEntryCount,
      referralEntries: sweepstakesWinners.referralEntryCount,
      totalEntries: sweepstakesWinners.totalEntries,
      emailSentAt: sweepstakesWinners.emailSentAt,
      createdAt: sweepstakesWinners.createdAt,
    })
    .from(sweepstakesWinners)
    .innerJoin(members, eq(sweepstakesWinners.winnerMemberId, members.id))
    .innerJoin(users, eq(members.userId, users.id))
    .where(
      and(
        eq(sweepstakesWinners.cycleId, cycleId),
        eq(sweepstakesWinners.status, "active")
      )
    )
    .orderBy(sweepstakesWinners.createdAt);

  return rows
    .map((row) => ({
      id: row.id,
      prizeTier: row.prizeTier,
      memberId: row.memberId,
      displayName: formatLeaderboardDisplayName(row.firstName, row.lastName, row.email),
      email: row.email,
      selectionMethod: row.selectionMethod,
      regularEntries: row.regularEntries,
      referralEntries: row.referralEntries,
      totalEntries: row.totalEntries,
      emailSentAt: row.emailSentAt?.toISOString() || null,
      createdAt: row.createdAt.toISOString(),
    }))
    .sort((a, b) => {
      const sortOrder = {
        grand_prize: 0,
        tier1_match: 1,
        tier2_match: 2,
      } as const;
      return sortOrder[a.prizeTier] - sortOrder[b.prizeTier];
    });
}

function pickWeightedGrandWinner(leaderboard: SweepstakesLeaderboardRow[]) {
  const eligibleRows = leaderboard.filter((row) => row.totalEntries > 0);
  const totalTickets = eligibleRows.reduce((sum, row) => sum + row.totalEntries, 0);

  if (totalTickets <= 0) {
    return null;
  }

  let cursor = randomInt(totalTickets);
  for (const row of eligibleRows) {
    if (cursor < row.totalEntries) {
      return row;
    }
    cursor -= row.totalEntries;
  }

  return eligibleRows[eligibleRows.length - 1] || null;
}

async function getMemberIdentity(memberId: string) {
  const [identity] = await db
    .select({
      memberId: members.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(members.id, memberId))
    .limit(1);

  return identity;
}

async function getReferralChain(grandWinnerMemberId: string) {
  const [tier1] = await db
    .select()
    .from(memberReferrals)
    .where(eq(memberReferrals.referredMemberId, grandWinnerMemberId))
    .limit(1);

  const tier1MemberId = tier1?.referrerMemberId || null;

  let tier2MemberId: string | null = null;
  if (tier1MemberId) {
    const [tier2] = await db
      .select()
      .from(memberReferrals)
      .where(eq(memberReferrals.referredMemberId, tier1MemberId))
      .limit(1);

    tier2MemberId = tier2?.referrerMemberId || null;
  }

  return { tier1MemberId, tier2MemberId };
}

interface DrawSweepstakesWinnersParams {
  cycleId: string;
  selectedByUserId: string;
  forcedGrandWinnerMemberId?: string;
  notes?: string | null;
}

export async function drawSweepstakesWinners({
  cycleId,
  selectedByUserId,
  forcedGrandWinnerMemberId,
  notes,
}: DrawSweepstakesWinnersParams) {
  const [cycle] = await db
    .select()
    .from(sweepstakesCycles)
    .where(eq(sweepstakesCycles.id, cycleId))
    .limit(1);

  if (!cycle) {
    throw new Error("Sweepstakes cycle not found");
  }

  if (cycle.endsAt > new Date()) {
    throw new Error("This sweepstakes cycle is still open and cannot be drawn yet");
  }

  const leaderboard = await getSweepstakesLeaderboard(cycleId);
  const eligibleLeaderboard = leaderboard.filter((row) => row.totalEntries > 0);

  if (eligibleLeaderboard.length === 0) {
    throw new Error("No eligible entries were found for this sweepstakes cycle");
  }

  const grandWinner = forcedGrandWinnerMemberId
    ? eligibleLeaderboard.find((row) => row.memberId === forcedGrandWinnerMemberId) || null
    : pickWeightedGrandWinner(eligibleLeaderboard);

  if (!grandWinner) {
    throw new Error("Unable to determine a grand-prize winner for this cycle");
  }

  const { tier1MemberId, tier2MemberId } = await getReferralChain(grandWinner.memberId);
  const selectionGroupId = randomUUID();
  const selectionMethod = forcedGrandWinnerMemberId ? "manual_override" : "draw";
  const now = new Date();

  const tier1Identity = tier1MemberId ? await getMemberIdentity(tier1MemberId) : null;
  const tier2Identity = tier2MemberId ? await getMemberIdentity(tier2MemberId) : null;

  const tier1Leaderboard =
    (tier1MemberId && leaderboard.find((row) => row.memberId === tier1MemberId)) || null;
  const tier2Leaderboard =
    (tier2MemberId && leaderboard.find((row) => row.memberId === tier2MemberId)) || null;

  await db
    .update(sweepstakesWinners)
    .set({
      status: "superseded",
      updatedAt: now,
    })
    .where(
      and(
        eq(sweepstakesWinners.cycleId, cycleId),
        eq(sweepstakesWinners.status, "active")
      )
    );

  const insertedWinners = await db
    .insert(sweepstakesWinners)
    .values(
      [
        {
          cycleId,
          selectionGroupId,
          prizeTier: "grand_prize" as const,
          winnerMemberId: grandWinner.memberId,
          grandWinnerMemberId: grandWinner.memberId,
          selectedByUserId,
          selectionMethod,
          regularEntryCount: grandWinner.regularEntries,
          referralEntryCount: grandWinner.referralEntries,
          totalEntries: grandWinner.totalEntries,
          notes: notes?.trim() || null,
        },
        tier1MemberId
          ? {
              cycleId,
              selectionGroupId,
              prizeTier: "tier1_match" as const,
              winnerMemberId: tier1MemberId,
              grandWinnerMemberId: grandWinner.memberId,
              selectedByUserId,
              selectionMethod,
              regularEntryCount: tier1Leaderboard?.regularEntries || 0,
              referralEntryCount: tier1Leaderboard?.referralEntries || 0,
              totalEntries: tier1Leaderboard?.totalEntries || 0,
              notes: notes?.trim() || null,
            }
          : null,
        tier2MemberId
          ? {
              cycleId,
              selectionGroupId,
              prizeTier: "tier2_match" as const,
              winnerMemberId: tier2MemberId,
              grandWinnerMemberId: grandWinner.memberId,
              selectedByUserId,
              selectionMethod,
              regularEntryCount: tier2Leaderboard?.regularEntries || 0,
              referralEntryCount: tier2Leaderboard?.referralEntries || 0,
              totalEntries: tier2Leaderboard?.totalEntries || 0,
              notes: notes?.trim() || null,
            }
          : null,
      ].filter(Boolean) as Array<typeof sweepstakesWinners.$inferInsert>
    )
    .returning({
      id: sweepstakesWinners.id,
      prizeTier: sweepstakesWinners.prizeTier,
      winnerMemberId: sweepstakesWinners.winnerMemberId,
    });

  const emailPayloads = [
    {
      rowId: insertedWinners.find((row) => row.prizeTier === "grand_prize")?.id,
      tier: "grand_prize" as const,
      email: grandWinner.email,
      name: grandWinner.displayName,
    },
    tier1Identity
      ? {
          rowId: insertedWinners.find((row) => row.prizeTier === "tier1_match")?.id,
          tier: "tier1_match" as const,
          email: tier1Identity.email,
          name: formatLeaderboardDisplayName(
            tier1Identity.firstName,
            tier1Identity.lastName,
            tier1Identity.email
          ),
        }
      : null,
    tier2Identity
      ? {
          rowId: insertedWinners.find((row) => row.prizeTier === "tier2_match")?.id,
          tier: "tier2_match" as const,
          email: tier2Identity.email,
          name: formatLeaderboardDisplayName(
            tier2Identity.firstName,
            tier2Identity.lastName,
            tier2Identity.email
          ),
        }
      : null,
  ].filter(Boolean) as Array<{
    rowId?: string;
    tier: "grand_prize" | "tier1_match" | "tier2_match";
    email: string;
    name: string;
  }>;

  for (const payload of emailPayloads) {
    if (!payload.rowId) {
      continue;
    }

    const sent = await sendSweepstakesPrizeEmail({
      recipientEmail: payload.email,
      recipientName: payload.name,
      cycleName: cycle.name,
      prizeLabel: cycle.grandPrizeLabel,
      winnerTier: payload.tier,
    });

    if (sent) {
      await db
        .update(sweepstakesWinners)
        .set({
          emailSentAt: new Date(),
          emailSentTo: payload.email,
          updatedAt: new Date(),
        })
        .where(eq(sweepstakesWinners.id, payload.rowId));
    }
  }

  await db
    .update(sweepstakesCycles)
    .set({
      status: "drawn",
      updatedAt: new Date(),
    })
    .where(eq(sweepstakesCycles.id, cycleId));

  return {
    cycle,
    winners: await getActiveSweepstakesWinners(cycleId),
    leaderboard,
  };
}

export function buildSweepstakesReferralLink(code: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/favorite-merchant-sweepstakes?ref=${code}`;
}
