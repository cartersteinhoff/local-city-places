import { NextResponse } from "next/server";
import { db, merchantOwners, merchants } from "@/db";
import { getSession } from "@/lib/auth";
import {
  merchantOwnerJoin,
  merchantOwnerWhere,
} from "@/lib/merchant-ownership";
import { revalidateMerchantPublicPaths } from "@/lib/merchant-public-revalidation";
import { getMerchantPageUrl, getMerchantShortUrl } from "@/lib/utils";

async function getOwnedMerchant(userId: string) {
  const [row] = await db
    .select({ merchant: merchants })
    .from(merchants)
    .leftJoin(merchantOwners, merchantOwnerJoin(userId))
    .where(merchantOwnerWhere(userId))
    .limit(1);

  return row?.merchant ?? null;
}

export async function POST() {
  try {
    const session = await getSession();
    if (
      !session ||
      (session.user.role !== "merchant" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const merchant = await getOwnedMerchant(session.user.id);
    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant page not found" },
        { status: 404 },
      );
    }

    revalidateMerchantPublicPaths(merchant);

    const fullUrl =
      merchant.isPublicPage && merchant.city && merchant.state && merchant.slug
        ? getMerchantPageUrl(merchant.city, merchant.state, merchant.slug)
        : null;
    const shortUrl =
      merchant.isPublicPage && merchant.phone
        ? getMerchantShortUrl(merchant.phone)
        : null;

    return NextResponse.json({
      success: true,
      urls: {
        full: fullUrl,
        short: shortUrl,
      },
    });
  } catch (error) {
    console.error("Error refreshing merchant page:", error);
    return NextResponse.json(
      { error: "Failed to refresh merchant page" },
      { status: 500 },
    );
  }
}
