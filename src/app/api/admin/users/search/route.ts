import { and, eq, ilike, isNotNull, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { merchants, users } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search users with merchant info joined
    const results = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        merchantBusinessName: merchants.businessName,
      })
      .from(users)
      .leftJoin(merchants, eq(users.id, merchants.userId))
      .where(
        and(
          isNotNull(users.email),
          or(
            ilike(users.email, `%${query}%`),
            ilike(users.firstName, `%${query}%`),
            ilike(users.lastName, `%${query}%`),
            ilike(merchants.businessName, `%${query}%`),
          ),
        ),
      )
      .limit(10);

    // Format results with name
    const formattedResults = results.map((r) => ({
      id: r.id,
      email: r.email,
      role: r.role,
      name:
        r.firstName && r.lastName
          ? `${r.firstName} ${r.lastName}`
          : r.merchantBusinessName || null,
    }));

    return NextResponse.json({ users: formattedResults });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
