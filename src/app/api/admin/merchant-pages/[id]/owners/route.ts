import { eq, inArray } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db, merchants, users } from "@/db";
import {
  getMerchantManagers,
  setMerchantManagers,
} from "@/lib/admin-merchant-managers";
import { getSession } from "@/lib/auth";

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
      owners: await getMerchantManagers(id, merchant.userId),
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
        { error: "At least one manager is required" },
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
        { error: "One or more selected managers were not found" },
        { status: 400 },
      );
    }

    const invalidUsers = selectedUsers.filter(
      (user) => user.role !== "merchant" && user.role !== "admin",
    );

    if (invalidUsers.length > 0) {
      return NextResponse.json(
        { error: "Managers must be merchant or admin users" },
        { status: 400 },
      );
    }

    await setMerchantManagers({
      merchantId: id,
      ownerUserIds,
      createdBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      owners: await getMerchantManagers(id, ownerUserIds[0]),
    });
  } catch (error) {
    console.error("Error updating merchant owners:", error);
    return NextResponse.json(
      { error: "Failed to update merchant owners" },
      { status: 500 },
    );
  }
}
