import { count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db, members, merchants, users } from "@/db";
import { createMagicLinkToken, getSession } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const conditions = [];

    if (role && role !== "all") {
      conditions.push(eq(users.role, role as "member" | "merchant" | "admin"));
    }

    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(merchants.businessName, `%${search}%`),
        ),
      );
    }

    const whereClause =
      conditions.length > 0
        ? sql`${conditions.reduce((acc, cond, i) => (i === 0 ? cond : sql`${acc} AND ${cond}`))}`
        : undefined;

    const baseQuery = db
      .select({ id: users.id, merchantId: merchants.id })
      .from(users)
      .leftJoin(members, eq(users.id, members.userId))
      .leftJoin(merchants, eq(users.id, merchants.userId));

    const allMatchingUsers = whereClause
      ? await baseQuery.where(whereClause)
      : await baseQuery;

    const total = allMatchingUsers.length;
    const matchingUserIds = allMatchingUsers
      .slice(offset, offset + limit)
      .map((u) => u.id);

    // Fetch users with their profiles (paginated)
    let userList: {
      id: string;
      email: string;
      phone: string | null;
      role: "member" | "merchant" | "admin";
      profilePhotoUrl: string | null;
      createdAt: Date;
      firstName: string | null;
      lastName: string | null;
      memberCity: string | null;
      merchantBusinessName: string | null;
      merchantCity: string | null;
      merchantVerified: boolean | null;
      merchantId: string | null;
    }[] = [];
    if (matchingUserIds.length > 0) {
      userList = await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          role: users.role,
          profilePhotoUrl: users.profilePhotoUrl,
          createdAt: users.createdAt,
          firstName: users.firstName,
          lastName: users.lastName,
          memberCity: members.city,
          merchantBusinessName: merchants.businessName,
          merchantCity: merchants.city,
          merchantVerified: merchants.verified,
          merchantId: merchants.id,
        })
        .from(users)
        .leftJoin(members, eq(users.id, members.userId))
        .leftJoin(merchants, eq(users.id, merchants.userId))
        .where(
          sql`${users.id} IN (${sql.join(
            matchingUserIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        )
        .orderBy(desc(users.createdAt));
    }

    // Get counts by role (always unfiltered for stats)
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

    const [totalCount] = await db.select({ count: count() }).from(users);

    return NextResponse.json({
      users: userList,
      stats: {
        total: totalCount.count,
        admins: adminCount.count,
        merchants: merchantCount.count,
        members: memberCount.count,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// Create a new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      role = "member",
      sendInvite = true,
      firstName,
      lastName,
    } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate role
    if (!["member", "merchant", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 },
      );
    }

    // Create the user
    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        role: role as "member" | "merchant" | "admin",
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
      })
      .returning();

    // Send magic link invite if requested
    if (sendInvite) {
      const token = await createMagicLinkToken(normalizedEmail);
      await sendWelcomeEmail(normalizedEmail, token);
    }

    return NextResponse.json({
      success: true,
      user: newUser,
      message: sendInvite ? "User created and invite sent" : "User created",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
