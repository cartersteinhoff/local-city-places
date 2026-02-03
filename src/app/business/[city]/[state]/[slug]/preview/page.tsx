"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { EditorialSwissDesign } from "@/components/merchant-page/designs/editorial-swiss";
import { VibrantPopDesign } from "@/components/merchant-page/designs/vibrant-pop";
import { NoirLuxeDesign } from "@/components/merchant-page/designs/noir-luxe";
import { CoastalBreezeDesign } from "@/components/merchant-page/designs/coastal-breeze";
import { NeoBrutalistDesign } from "@/components/merchant-page/designs/neo-brutalist";
import { ArtDecoDesign } from "@/components/merchant-page/designs/art-deco";
import { ZenMinimalistDesign } from "@/components/merchant-page/designs/zen-minimalist";
import { Retro80sDesign } from "@/components/merchant-page/designs/retro-80s";
import { MagazineEditorialDesign } from "@/components/merchant-page/designs/magazine-editorial";
import { GlassmorphismDesign } from "@/components/merchant-page/designs/glassmorphism";
import { NewspaperDesign } from "@/components/merchant-page/designs/newspaper";
import { NeonSignDesign } from "@/components/merchant-page/designs/neon-sign";
import { TechMinimalDesign } from "@/components/merchant-page/designs/tech-minimal";
import { TropicalDesign } from "@/components/merchant-page/designs/tropical";
import { IndustrialDesign } from "@/components/merchant-page/designs/industrial";
import { CleanModernDesign } from "@/components/merchant-page/designs/clean-modern";
import { WarmFriendlyDesign } from "@/components/merchant-page/designs/warm-friendly";
import { ProfessionalDarkDesign } from "@/components/merchant-page/designs/professional-dark";

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
}

const designs = [
  { id: "deco", name: "Art Deco", description: "1920s elegance, geometric" },
  { id: "clean", name: "Clean", description: "Simple, professional, universal" },
  { id: "warm", name: "Warm", description: "Friendly, approachable, soft colors" },
  { id: "dark", name: "Dark", description: "Sleek, corporate, trustworthy" },
  { id: "coastal", name: "Coastal", description: "Light, airy, beach vibes" },
  { id: "brutalist", name: "Brutalist", description: "Bold, chunky, raw energy" },
  { id: "zen", name: "Zen", description: "Japanese minimalism, serene" },
  { id: "retro", name: "80s Retro", description: "Synthwave, neon vibes" },
  { id: "magazine", name: "Magazine", description: "Editorial, publication style" },
  { id: "glass", name: "Glass", description: "Frosted glass, modern" },
  { id: "newspaper", name: "Newspaper", description: "Vintage print, classic" },
  { id: "neon", name: "Neon", description: "Glowing sign, urban night" },
  { id: "tech", name: "Tech", description: "Apple-style, ultra clean" },
  { id: "tropical", name: "Tropical", description: "Summer vibes, warm colors" },
  { id: "industrial", name: "Industrial", description: "Warehouse, steel & concrete" },
  { id: "swiss", name: "Swiss", description: "Clean, minimal, dramatic typography" },
  { id: "pop", name: "Pop", description: "Bold, colorful, playful energy" },
  { id: "luxe", name: "Luxe", description: "Premium dark with gold accents" },
] as const;

export default function PreviewPage() {
  const params = useParams();
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<string>("deco");
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
    <div className="min-h-screen bg-gray-900">
      {/* Style Selector - Fixed Right Sidebar */}
      <div className="fixed right-3 top-1/2 -translate-y-1/2 z-[100] bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-200 p-2 max-h-[80vh] overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Style</p>
        <div className="flex flex-col gap-0.5">
          {designs.map((design) => (
            <button
              key={design.id}
              onClick={() => setSelectedDesign(design.id)}
              className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all text-left cursor-pointer ${
                selectedDesign === design.id
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              title={design.description}
            >
              {design.name}
            </button>
          ))}
        </div>
      </div>

      {/* Design Preview */}
      <div>
        {selectedDesign === "clean" && (
          <CleanModernDesign
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
          />
        )}
        {selectedDesign === "warm" && (
          <WarmFriendlyDesign
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
          />
        )}
        {selectedDesign === "dark" && (
          <ProfessionalDarkDesign
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
          />
        )}
        {selectedDesign === "swiss" && (
          <EditorialSwissDesign
            businessName={merchant.businessName}
            city={merchant.city}
            state={merchant.state}
            logoUrl={merchant.logoUrl}
            categoryName={merchant.categoryName}
            phone={merchant.phone}
            website={merchant.website}
            description={merchant.description}
            vimeoUrl={merchant.vimeoUrl}
          />
        )}
        {selectedDesign === "pop" && (
          <VibrantPopDesign
            businessName={merchant.businessName}
            city={merchant.city}
            state={merchant.state}
            logoUrl={merchant.logoUrl}
            categoryName={merchant.categoryName}
            phone={merchant.phone}
            website={merchant.website}
            description={merchant.description}
            vimeoUrl={merchant.vimeoUrl}
          />
        )}
        {selectedDesign === "luxe" && (
          <NoirLuxeDesign
            businessName={merchant.businessName}
            city={merchant.city}
            state={merchant.state}
            logoUrl={merchant.logoUrl}
            categoryName={merchant.categoryName}
            phone={merchant.phone}
            website={merchant.website}
            description={merchant.description}
            vimeoUrl={merchant.vimeoUrl}
          />
        )}
        {selectedDesign === "coastal" && (
          <CoastalBreezeDesign
            businessName={merchant.businessName}
            city={merchant.city}
            state={merchant.state}
            logoUrl={merchant.logoUrl}
            categoryName={merchant.categoryName}
            phone={merchant.phone}
            website={merchant.website}
            description={merchant.description}
            vimeoUrl={merchant.vimeoUrl}
          />
        )}
        {selectedDesign === "brutalist" && (
          <NeoBrutalistDesign
            businessName={merchant.businessName}
            city={merchant.city}
            state={merchant.state}
            logoUrl={merchant.logoUrl}
            categoryName={merchant.categoryName}
            phone={merchant.phone}
            website={merchant.website}
            description={merchant.description}
            vimeoUrl={merchant.vimeoUrl}
          />
        )}
        {selectedDesign === "deco" && (
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
          />
        )}
        {selectedDesign === "zen" && (
          <ZenMinimalistDesign
            businessName={merchant.businessName}
            city={merchant.city}
            state={merchant.state}
            logoUrl={merchant.logoUrl}
            categoryName={merchant.categoryName}
            phone={merchant.phone}
            website={merchant.website}
            description={merchant.description}
            vimeoUrl={merchant.vimeoUrl}
          />
        )}
        {selectedDesign === "retro" && (
          <Retro80sDesign
            businessName={merchant.businessName}
            city={merchant.city}
            state={merchant.state}
            logoUrl={merchant.logoUrl}
            categoryName={merchant.categoryName}
            phone={merchant.phone}
            website={merchant.website}
            description={merchant.description}
            vimeoUrl={merchant.vimeoUrl}
          />
        )}
        {selectedDesign === "magazine" && (
          <MagazineEditorialDesign
            businessName={merchant.businessName}
            city={merchant.city}
            state={merchant.state}
            logoUrl={merchant.logoUrl}
            categoryName={merchant.categoryName}
            phone={merchant.phone}
            website={merchant.website}
            description={merchant.description}
            vimeoUrl={merchant.vimeoUrl}
          />
        )}
        {selectedDesign === "glass" && (
          <GlassmorphismDesign
            businessName={merchant.businessName}
            city={merchant.city}
            state={merchant.state}
            logoUrl={merchant.logoUrl}
            categoryName={merchant.categoryName}
            phone={merchant.phone}
            website={merchant.website}
            description={merchant.description}
            vimeoUrl={merchant.vimeoUrl}
          />
        )}
        {selectedDesign === "newspaper" && (
          <NewspaperDesign
            businessName={merchant.businessName}
            city={merchant.city}
            state={merchant.state}
            logoUrl={merchant.logoUrl}
            categoryName={merchant.categoryName}
            phone={merchant.phone}
            website={merchant.website}
            description={merchant.description}
            vimeoUrl={merchant.vimeoUrl}
          />
        )}
        {selectedDesign === "neon" && (
          <NeonSignDesign
            businessName={merchant.businessName}
            city={merchant.city}
            state={merchant.state}
            logoUrl={merchant.logoUrl}
            categoryName={merchant.categoryName}
            phone={merchant.phone}
            website={merchant.website}
            description={merchant.description}
            vimeoUrl={merchant.vimeoUrl}
          />
        )}
        {selectedDesign === "tech" && (
          <TechMinimalDesign
            businessName={merchant.businessName}
            city={merchant.city}
            state={merchant.state}
            logoUrl={merchant.logoUrl}
            categoryName={merchant.categoryName}
            phone={merchant.phone}
            website={merchant.website}
            description={merchant.description}
            vimeoUrl={merchant.vimeoUrl}
          />
        )}
        {selectedDesign === "tropical" && (
          <TropicalDesign
            businessName={merchant.businessName}
            city={merchant.city}
            state={merchant.state}
            logoUrl={merchant.logoUrl}
            categoryName={merchant.categoryName}
            phone={merchant.phone}
            website={merchant.website}
            description={merchant.description}
            vimeoUrl={merchant.vimeoUrl}
          />
        )}
        {selectedDesign === "industrial" && (
          <IndustrialDesign
            businessName={merchant.businessName}
            city={merchant.city}
            state={merchant.state}
            logoUrl={merchant.logoUrl}
            categoryName={merchant.categoryName}
            phone={merchant.phone}
            website={merchant.website}
            description={merchant.description}
            vimeoUrl={merchant.vimeoUrl}
          />
        )}
      </div>
    </div>
  );
}
