import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, or, isNotNull, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lists = searchParams.getAll("lists");

    if (!lists || lists.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    // Build conditions for each list
    const conditions = [];

    if (lists.includes("members")) {
      conditions.push(eq(users.role, "member"));
    }
    if (lists.includes("merchants")) {
      conditions.push(eq(users.role, "merchant"));
    }
    if (lists.includes("admins")) {
      conditions.push(eq(users.role, "admin"));
    }

    if (conditions.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    const [result] = await db
      .select({ count: sql<number>`count(distinct ${users.id})` })
      .from(users)
      .where(and(isNotNull(users.email), or(...conditions)));

    return NextResponse.json({ count: Number(result?.count) || 0 });
  } catch (error) {
    console.error("Recipient count error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
