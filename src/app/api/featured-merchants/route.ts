import { NextResponse } from "next/server";
import { getFeaturedMerchants } from "@/lib/featured-merchants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const featured = await getFeaturedMerchants();

    return NextResponse.json(
      { merchants: featured },
      {
        headers: {
          "Cache-Control": "no-store",
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
