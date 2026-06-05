import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { merchants } from "@/db/schema";
import { getMerchantPageUrl, stripPhoneNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const phone = stripPhoneNumber(
    request.nextUrl.searchParams.get("phone") || "",
  );

  if (phone.length !== 10) {
    return NextResponse.json(
      { error: "Enter a 10 digit business phone number." },
      { status: 400 },
    );
  }

  const [merchant] = await db
    .select({
      city: merchants.city,
      state: merchants.state,
      slug: merchants.slug,
    })
    .from(merchants)
    .where(and(eq(merchants.phone, phone), eq(merchants.isPublicPage, true)))
    .limit(1);

  if (!merchant || !merchant.city || !merchant.state || !merchant.slug) {
    return NextResponse.json({
      found: false,
      error: "No merchant page was found for that phone number.",
    });
  }

  return NextResponse.json({
    found: true,
    shortUrl: `/${phone}`,
    pageUrl: getMerchantPageUrl(merchant.city, merchant.state, merchant.slug),
  });
}
