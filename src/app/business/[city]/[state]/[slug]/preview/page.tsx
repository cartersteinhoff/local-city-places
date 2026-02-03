"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArtDecoDesign } from "@/components/merchant-page/designs/art-deco";

interface MerchantData {
  businessName: string;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  website: string | null;
  vimeoUrl: string | null;
  categoryName: string | null;
  description: string | null;
  logoUrl: string | null;
  googlePlaceId: string | null;
  // Extended business info
  hours: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  } | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  photos: string[] | null;
  services: { name: string; description?: string; price?: string }[] | null;
  aboutStory: string | null;
}

export default function PreviewPage() {
  const params = useParams();
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMerchant() {
      try {
        const res = await fetch(`/api/merchants/public/${params.slug}`);
        if (res.ok) {
          const data = await res.json();
          setMerchant(data.merchant);
        }
      } catch (error) {
        console.error("Error fetching merchant:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMerchant();
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Merchant not found</p>
      </div>
    );
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
