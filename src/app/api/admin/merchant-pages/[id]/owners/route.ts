import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db, merchantOwners, merchants, users } from "@/db";
import { getSession } from "@/lib/auth";

function formatOwner(row: typeof users.$inferSelect) {
  const name = [row.firstName, row.lastName].filter(Boolean).join(" ");

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    name: name || null,
  };
}

async function getOwners(merchantId: string, legacyUserId?: string | null) {
  const ownerRows = await db
    .select({
      user: users,
    })
    .from(merchantOwners)
    .innerJoin(users, eq(merchantOwners.userId, users.id))
    .where(eq(merchantOwners.merchantId, merchantId))
    .orderBy(users.email);

  const owners = ownerRows.map((row) => formatOwner(row.user));
  const ownerIds = new Set(owners.map((owner) => owner.id));

  if (legacyUserId && !ownerIds.has(legacyUserId)) {
    const [legacyUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, legacyUserId))
      .limit(1);

    if (legacyUser) {
      owners.unshift(formatOwner(legacyUser));
    }
  }

  return owners;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const [merchant] = await db
      .select({ userId: merchants.userId })
      .from(merchants)
      .where(eq(merchants.id, id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      owners: await getOwners(id, merchant.userId),
    });
  } catch (error) {
    console.error("Error fetching merchant owners:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchant owners" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const requestedOwnerIds: string[] = Array.isArray(body.ownerUserIds)
      ? body.ownerUserIds.filter(
          (userId: unknown): userId is string =>
            typeof userId === "string" && userId.length > 0,
        )
      : [];
    const ownerUserIds: string[] = Array.from(new Set(requestedOwnerIds));

    if (ownerUserIds.length === 0) {
      return NextResponse.json(
        { error: "At least one owner is required" },
        { status: 400 },
      );
    }

    const [merchant] = await db
      .select({ id: merchants.id })
      .from(merchants)
      .where(eq(merchants.id, id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
    }

    const selectedUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, ownerUserIds));

    if (selectedUsers.length !== ownerUserIds.length) {
      return NextResponse.json(
        { error: "One or more selected owners were not found" },
        { status: 400 },
      );
    }

    const invalidUsers = selectedUsers.filter(
      (user) => user.role !== "merchant" && user.role !== "admin",
    );

    if (invalidUsers.length > 0) {
      return NextResponse.json(
        { error: "Owners must be merchant or admin users" },
        { status: 400 },
      );
    }

    await db.transaction(async (tx) => {
      await tx.delete(merchantOwners).where(eq(merchantOwners.merchantId, id));

      await tx
        .delete(merchantOwners)
        .where(
          and(
            ne(merchantOwners.merchantId, id),
            inArray(merchantOwners.userId, ownerUserIds),
          ),
        );

      await tx
        .update(merchants)
        .set({
          userId: sql`(
            select mo.user_id
            from merchant_owners mo
            where mo.merchant_id = ${merchants.id}
            order by mo.created_at asc
            limit 1
          )`,
          updatedAt: new Date(),
        })
        .where(
          and(ne(merchants.id, id), inArray(merchants.userId, ownerUserIds)),
        );

      await tx.insert(merchantOwners).values(
        ownerUserIds.map((userId) => ({
          merchantId: id,
          userId,
          createdBy: session.user.id,
        })),
      );

      await tx
        .update(merchants)
        .set({ userId: ownerUserIds[0], updatedAt: new Date() })
        .where(eq(merchants.id, id));
    });

    return NextResponse.json({
      success: true,
      owners: await getOwners(id, ownerUserIds[0]),
    });
  } catch (error) {
    console.error("Error updating merchant owners:", error);
    return NextResponse.json(
      { error: "Failed to update merchant owners" },
      { status: 500 },
    );
  }
}
