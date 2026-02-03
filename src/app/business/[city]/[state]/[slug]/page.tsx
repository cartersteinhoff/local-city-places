import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/db";
import { merchants, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArtDecoDesign } from "@/components/merchant-page/designs/art-deco";

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
      streetAddress: merchants.streetAddress,
      city: merchants.city,
      state: merchants.state,
      zipCode: merchants.zipCode,
      phone: merchants.phone,
      website: merchants.website,
      vimeoUrl: merchants.vimeoUrl,
      slug: merchants.slug,
      categoryName: categories.name,
      description: merchants.description,
      logoUrl: merchants.logoUrl,
      googlePlaceId: merchants.googlePlaceId,
      hours: merchants.hours,
      instagramUrl: merchants.instagramUrl,
      facebookUrl: merchants.facebookUrl,
      tiktokUrl: merchants.tiktokUrl,
      photos: merchants.photos,
      services: merchants.services,
      aboutStory: merchants.aboutStory,
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
    <ArtDecoDesign
      businessName={merchant.businessName}
      streetAddress={merchant.streetAddress}
      city={merchant.city}
      state={merchant.state}
      zipCode={merchant.zipCode}
      logoUrl={merchant.logoUrl}
      categoryName={merchant.categoryName}
      phone={merchant.phone}
      website={merchant.website}
      description={merchant.description}
      vimeoUrl={merchant.vimeoUrl}
      googlePlaceId={merchant.googlePlaceId}
      hours={merchant.hours}
      instagramUrl={merchant.instagramUrl}
      facebookUrl={merchant.facebookUrl}
      tiktokUrl={merchant.tiktokUrl}
      photos={merchant.photos}
      services={merchant.services}
      aboutStory={merchant.aboutStory}
    />
  );
}
