import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  db,
  favoriteMerchantTestimonials,
  members,
  sweepstakesEntries,
} from "@/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const [entryStats] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sweepstakesEntries)
      .where(eq(sweepstakesEntries.memberId, member.id));

    const [nominationStats] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(favoriteMerchantTestimonials)
      .where(eq(favoriteMerchantTestimonials.memberId, member.id));

    return NextResponse.json({
      member: {
        id: member.id,
        city: member.city,
        state: member.state,
        homeCity: member.homeCity,
      },
      stats: {
        sweepstakesEntries: Number(entryStats?.count) || 0,
        favoriteMerchantNominations: Number(nominationStats?.count) || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching member dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
