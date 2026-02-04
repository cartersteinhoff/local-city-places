import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { merchants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getMerchantPageUrl } from "@/lib/utils";

// POST /api/admin/merchant-pages/[id]/revalidate
// Manually trigger page rebuild for instant updates
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Get merchant to build the URL
    const [merchant] = await db
      .select({
        city: merchants.city,
        state: merchants.state,
        slug: merchants.slug,
      })
      .from(merchants)
      .where(eq(merchants.id, id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    if (!merchant.city || !merchant.state || !merchant.slug) {
      return NextResponse.json(
        { error: "Merchant page URL not complete (missing city, state, or slug)" },
        { status: 400 }
      );
    }

    const pageUrl = getMerchantPageUrl(merchant.city, merchant.state, merchant.slug);

    // Trigger revalidation
    revalidatePath(pageUrl);

    return NextResponse.json({
      success: true,
      message: "Page rebuild triggered",
      url: pageUrl,
    });
  } catch (error) {
    console.error("Error revalidating merchant page:", error);
    return NextResponse.json(
      { error: "Failed to trigger rebuild" },
      { status: 500 }
    );
  }
}
