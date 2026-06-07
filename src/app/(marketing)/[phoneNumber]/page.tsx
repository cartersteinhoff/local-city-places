import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { merchants } from "@/db/schema";
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
    .where(
      and(eq(merchants.phone, phoneNumber), eq(merchants.isPublicPage, true)),
    )
    .limit(1);

  if (!merchant?.city || !merchant.state || !merchant.slug) {
    redirect(`/merchantpage?phone=${phoneNumber}&status=not-found`);
  }

  // Redirect to full URL
  const fullUrl = getMerchantPageUrl(
    merchant.city,
    merchant.state,
    merchant.slug,
  );
  redirect(fullUrl);
}
