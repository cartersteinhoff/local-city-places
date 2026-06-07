"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { FeaturedMerchant } from "@/lib/featured-merchants-types";
import { cn } from "@/lib/utils";

const photoStripCopies = ["copy-1", "copy-2", "copy-3"];

interface MerchantPhotoStripProps {
  initialMerchants?: FeaturedMerchant[];
  className?: string;
}

export function MerchantPhotoStrip({
  initialMerchants,
  className,
}: MerchantPhotoStripProps) {
  const [merchants, setMerchants] = useState<FeaturedMerchant[]>(
    () => initialMerchants ?? [],
  );

  useEffect(() => {
    if (initialMerchants !== undefined) {
      setMerchants(initialMerchants);
      return;
    }

    let isMounted = true;

    async function fetchFeaturedMerchants() {
      try {
        const response = await fetch("/api/featured-merchants");
        if (!response.ok) return;

        const data = (await response.json()) as {
          merchants?: FeaturedMerchant[];
        };

        if (isMounted) {
          setMerchants(data.merchants || []);
        }
      } catch (error) {
        console.error("Error fetching featured merchants:", error);
      }
    }

    fetchFeaturedMerchants();

    return () => {
      isMounted = false;
    };
  }, [initialMerchants]);

  const imageMerchants = merchants
    .filter((merchant) => merchant.imageUrl || merchant.logoUrl)
    .slice(0, 14);

  if (imageMerchants.length === 0) {
    return <div className="mt-auto h-32 sm:h-44" aria-hidden="true" />;
  }

  const stripItems = photoStripCopies.flatMap((copyId) =>
    imageMerchants.map((merchant) => ({
      merchant,
      itemKey: `${copyId}-${merchant.id}`,
    })),
  );

  return (
    <section
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative left-1/2 z-0 mt-auto w-screen -translate-x-1/2 pt-6",
        className,
      )}
    >
      <div className="relative h-40 overflow-hidden sm:h-52 lg:h-60">
        <div
          className="absolute bottom-0 left-0 flex min-w-max animate-marquee-left gap-3 px-3 motion-reduce:animate-none"
          style={{ animationDuration: "125s" }}
        >
          {stripItems.map(({ merchant, itemKey }) => {
            const imageUrl = merchant.imageUrl || merchant.logoUrl;
            if (!imageUrl) return null;
            const location =
              merchant.city && merchant.state
                ? `${merchant.city}, ${merchant.state}`
                : merchant.city || merchant.state;

            return (
              <div
                key={itemKey}
                className="relative h-36 w-64 shrink-0 overflow-hidden rounded-t-lg bg-[#052843] shadow-[0_12px_34px_rgba(3,31,53,0.25)] ring-1 ring-white/25 sm:h-48 sm:w-80 lg:h-56 lg:w-[420px]"
              >
                <Image
                  src={imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 420px, (min-width: 640px) 320px, 256px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#021f36]/86 via-[#021f36]/24 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
                  <p className="truncate text-sm font-black leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] sm:text-base">
                    {merchant.businessName}
                  </p>
                  {location && (
                    <p className="mt-1 truncate text-xs font-semibold leading-tight text-white/80 sm:text-sm">
                      {location}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
