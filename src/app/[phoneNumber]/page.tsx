import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { merchants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMerchantPageUrl } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    phoneNumber: string;
  }>;
}

export default async function PhoneRedirectPage({ params }: PageProps) {
  const { phoneNumber } = await params;

  // Only handle 10-digit phone numbers
  if (!/^\d{10}$/.test(phoneNumber)) {
    notFound();
  }

  // Look up merchant by phone
  const [merchant] = await db
    .select({
      city: merchants.city,
      state: merchants.state,
      slug: merchants.slug,
    })
    .from(merchants)
    .where(eq(merchants.phone, phoneNumber))
    .limit(1);

  if (!merchant || !merchant.city || !merchant.state || !merchant.slug) {
    notFound();
  }

  // Redirect to full URL
  const fullUrl = getMerchantPageUrl(merchant.city, merchant.state, merchant.slug);
  redirect(fullUrl);
}
