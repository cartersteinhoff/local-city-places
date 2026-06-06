import { NextResponse } from "next/server";
import {
  FEATURED_MERCHANT_CACHE_SECONDS,
  getFeaturedMerchants,
} from "@/lib/featured-merchants";

export async function GET() {
  try {
    const featured = await getFeaturedMerchants();

    return NextResponse.json(
      { merchants: featured },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${FEATURED_MERCHANT_CACHE_SECONDS}, stale-while-revalidate=86400`,
        },
      },
    );
  } catch (error) {
    console.error("Error fetching featured merchants:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured merchants" },
      { status: 500 },
    );
  }
}

export const revalidate = 3600;
