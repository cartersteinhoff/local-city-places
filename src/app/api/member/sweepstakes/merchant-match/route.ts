import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db, merchants } from "@/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "member") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("placeId")?.trim();
    const name = searchParams.get("name")?.trim();
    const city = searchParams.get("city")?.trim();
    const state = searchParams.get("state")?.trim()?.toUpperCase();

    if (!placeId && !name) {
      return NextResponse.json({ error: "placeId or name is required" }, { status: 400 });
    }

    let merchant =
      placeId
        ? (
            await db
              .select({
                id: merchants.id,
                businessName: merchants.businessName,
                city: merchants.city,
                state: merchants.state,
                googlePlaceId: merchants.googlePlaceId,
              })
              .from(merchants)
              .where(eq(merchants.googlePlaceId, placeId))
              .limit(1)
          )[0]
        : undefined;

    if (!merchant && name) {
      merchant = (
        await db
          .select({
            id: merchants.id,
            businessName: merchants.businessName,
            city: merchants.city,
            state: merchants.state,
            googlePlaceId: merchants.googlePlaceId,
          })
          .from(merchants)
          .where(
            and(
              ilike(merchants.businessName, name),
              city ? ilike(merchants.city, city) : undefined,
              state ? eq(merchants.state, state) : undefined
            )
          )
          .limit(1)
      )[0];
    }

    return NextResponse.json({
      merchant: merchant ?? null,
      matched: !!merchant,
    });
  } catch (error) {
    console.error("Favorite merchant match error:", error);
    return NextResponse.json(
      { error: "Failed to match merchant" },
      { status: 500 }
    );
  }
}
