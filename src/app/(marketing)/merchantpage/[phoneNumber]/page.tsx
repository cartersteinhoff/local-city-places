import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { merchants } from "@/db/schema";
import { getMerchantPageUrl } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    phoneNumber: string;
  }>;
}

export default async function MerchantPagePhoneRedirect({ params }: PageProps) {
  const { phoneNumber } = await params;

  if (!/^\d{10}$/.test(phoneNumber)) {
    redirect("/merchantpage?status=invalid");
  }

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
    redirect(`/merchantpage?phone=${phoneNumber}&status=not-found`);
  }

  redirect(getMerchantPageUrl(merchant.city, merchant.state, merchant.slug));
}
