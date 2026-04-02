"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Gem, MapPin } from "lucide-react";

interface FeaturedMerchant {
  id: string;
  businessName: string;
  city: string | null;
  state: string | null;
  logoUrl: string | null;
  photos: string[] | null;
  categoryName: string | null;
}

const fallbackTiles = [
  {
    id: "local-story",
    title: "Local stories",
    subtitle: "Real merchants your members can champion",
  },
  {
    id: "daily-entry",
    title: "Daily momentum",
    subtitle: "A sharper reason to come back every day",
  },
  {
    id: "matching-prize",
    title: "Matching prizes",
    subtitle: "Referral energy built directly into the offer",
  },
];

export function MerchantSpotlightGrid() {
  const [merchants, setMerchants] = useState<FeaturedMerchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedMerchants() {
      try {
        const response = await fetch("/api/featured-merchants");
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (Array.isArray(data.merchants)) {
          setMerchants(data.merchants);
        }
      } catch (error) {
        console.error("Failed to load featured merchants for campaign page:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeaturedMerchants();
  }, []);

  const featuredTiles = useMemo(() => merchants.slice(0, 3), [merchants]);

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
        <div className="min-h-[360px] rounded-[2rem] border border-white/10 bg-white/8 animate-pulse" />
        <div className="grid gap-3">
          <div className="min-h-[172px] rounded-[1.75rem] border border-white/10 bg-white/8 animate-pulse" />
          <div className="min-h-[172px] rounded-[1.75rem] border border-white/10 bg-white/8 animate-pulse" />
        </div>
      </div>
    );
  }

  if (featuredTiles.length === 0) {
    return (
      <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
        {fallbackTiles.map((tile, index) => (
          <div
            key={tile.id}
            className={[
              "relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-[linear-gradient(160deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] p-6",
              index === 0 ? "sm:min-h-[360px]" : "sm:min-h-[172px]",
            ].join(" ")}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,194,102,0.32),transparent_48%)]" />
            <div className="relative flex h-full flex-col justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-[#ffd28a]">
                <Gem className="h-5 w-5" />
              </span>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">{tile.title}</h3>
                <p className="max-w-xs text-sm leading-6 text-white/72">{tile.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
      {featuredTiles.map((merchant, index) => {
        const imageUrl = merchant.photos?.[0] || merchant.logoUrl;
        const location = [merchant.city, merchant.state].filter(Boolean).join(", ");

        return (
          <div
            key={merchant.id}
            className={[
              "group relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#291913]",
              index === 0 ? "sm:min-h-[360px]" : "sm:min-h-[172px]",
            ].join(" ")}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={merchant.businessName}
                fill
                sizes={index === 0 ? "(min-width: 640px) 40vw, 100vw" : "(min-width: 640px) 24vw, 100vw"}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(145deg,#7a3c17,#24110b)]" />
            )}

            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(25,12,9,0.04),rgba(25,12,9,0.84))]" />

            <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
              <span className="w-fit rounded-full border border-white/14 bg-black/20 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.24em] text-white/72">
                Featured Merchant
              </span>

              <div className="space-y-2">
                <h3 className="max-w-sm text-balance text-2xl font-semibold text-white sm:text-[1.9rem]">
                  {merchant.businessName}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/72">
                  {location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {location}
                    </span>
                  )}
                  {merchant.categoryName && <span>{merchant.categoryName}</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
