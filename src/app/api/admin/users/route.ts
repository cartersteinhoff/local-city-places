import { NextRequest, NextResponse } from "next/server";
import { db, users, members, merchants } from "@/db";
import { getSession } from "@/lib/auth";
import { eq, ilike, or, sql, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    // Build where conditions
    const conditions = [];
    if (role && role !== "all") {
      conditions.push(eq(users.role, role as "member" | "merchant" | "admin"));
    }
    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(members.firstName, `%${search}%`),
          ilike(members.lastName, `%${search}%`),
          ilike(merchants.businessName, `%${search}%`)
        )
      );
    }

    // Fetch users with their profiles
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        role: users.role,
        profilePhotoUrl: users.profilePhotoUrl,
        createdAt: users.createdAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberCity: members.city,
        merchantBusinessName: merchants.businessName,
        merchantCity: merchants.city,
        merchantVerified: merchants.verified,
      })
      .from(users)
      .leftJoin(members, eq(users.id, members.userId))
      .leftJoin(merchants, eq(users.id, merchants.userId))
      .where(conditions.length > 0 ? sql`${conditions.reduce((acc, cond, i) => i === 0 ? cond : sql`${acc} AND ${cond}`)}` : undefined)
      .orderBy(users.createdAt);

    // Get counts by role
    const [adminCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "admin"));

    const [merchantCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "merchant"));

    const [memberCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "member"));

    return NextResponse.json({
      users: userList,
      stats: {
        total: userList.length,
        admins: adminCount.count,
        merchants: merchantCount.count,
        members: memberCount.count,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
