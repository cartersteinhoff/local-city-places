import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/db";
import { merchants, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { MerchantHero } from "@/components/merchant-page/merchant-hero";
import { MerchantContent } from "@/components/merchant-page/merchant-content";
import { MobileActionBar } from "@/components/merchant-page/mobile-action-bar";

interface PageProps {
  params: Promise<{
    city: string;
    state: string;
    slug: string;
  }>;
}

async function getMerchant(slug: string) {
  const [merchant] = await db
    .select({
      id: merchants.id,
      businessName: merchants.businessName,
      city: merchants.city,
      state: merchants.state,
      phone: merchants.phone,
      website: merchants.website,
      vimeoUrl: merchants.vimeoUrl,
      slug: merchants.slug,
      categoryName: categories.name,
      description: merchants.description,
      logoUrl: merchants.logoUrl,
    })
    .from(merchants)
    .leftJoin(categories, eq(merchants.categoryId, categories.id))
    .where(eq(merchants.slug, slug))
    .limit(1);

  return merchant;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const merchant = await getMerchant(slug);

  if (!merchant) {
    return {
      title: "Business Not Found",
    };
  }

  const location = [merchant.city, merchant.state].filter(Boolean).join(", ");
  const title = location
    ? `${merchant.businessName} | ${location}`
    : merchant.businessName;

  return {
    title,
    description: merchant.description || `Visit ${merchant.businessName} in ${location}`,
    openGraph: {
      title,
      description: merchant.description || `Visit ${merchant.businessName} in ${location}`,
      type: "website",
    },
  };
}

export default async function MerchantPage({ params }: PageProps) {
  const { slug } = await params;
  const merchant = await getMerchant(slug);

  if (!merchant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero section */}
      <MerchantHero
        businessName={merchant.businessName}
        city={merchant.city}
        state={merchant.state}
        logoUrl={merchant.logoUrl}
        categoryName={merchant.categoryName}
        phone={merchant.phone}
        website={merchant.website}
        vimeoUrl={merchant.vimeoUrl}
      />

      {/* Main content */}
      <MerchantContent
        businessName={merchant.businessName}
        phone={merchant.phone}
        website={merchant.website}
        description={merchant.description}
        categoryName={merchant.categoryName}
      />

      {/* Mobile sticky action bar */}
      <MobileActionBar
        businessName={merchant.businessName}
        phone={merchant.phone}
        website={merchant.website}
      />

      {/* Bottom padding for mobile action bar */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
