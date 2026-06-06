"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FeaturedMerchant } from "@/lib/featured-merchants-types";
import { getMerchantPageUrl } from "@/lib/utils";

const skeletonRows = ["row-1", "row-2", "row-3"];
const marqueeCopies = ["copy-1", "copy-2", "copy-3", "copy-4"];
const priorityImagesPerRow = 3;
const skeletonCards = [
  "card-1",
  "card-2",
  "card-3",
  "card-4",
  "card-5",
  "card-6",
];

function getShuffleRank(merchant: FeaturedMerchant, seed: string) {
  const value = `${seed}:${merchant.id}`;
  let hash = 2166136261;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function shuffleMerchants(merchants: FeaturedMerchant[], seed: string) {
  return [...merchants].sort((a, b) => {
    const rankDifference = getShuffleRank(a, seed) - getShuffleRank(b, seed);
    if (rankDifference !== 0) return rankDifference;

    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

function MerchantCard({
  merchant,
  priority = false,
}: {
  merchant: FeaturedMerchant;
  priority?: boolean;
}) {
  const href =
    merchant.city && merchant.state && merchant.slug
      ? getMerchantPageUrl(merchant.city, merchant.state, merchant.slug)
      : "#";

  const priorityImageProps = priority
    ? ({ priority: true } as const)
    : ({ loading: "lazy" } as const);

  return (
    <Link
      href={href}
      className="group relative block w-[300px] h-[200px] shrink-0 rounded-lg overflow-hidden shadow-lg"
    >
      {merchant.imageUrl ? (
        <Image
          src={merchant.imageUrl}
          alt={merchant.businessName}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="300px"
          quality={60}
          {...priorityImageProps}
        />
      ) : merchant.logoUrl ? (
        <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center p-6">
          <Image
            src={merchant.logoUrl}
            alt={merchant.businessName}
            width={200}
            height={100}
            className="object-contain max-h-[80px]"
            quality={60}
            {...priorityImageProps}
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
          <span className="text-white/60 text-lg font-bold">
            {merchant.businessName.charAt(0)}
          </span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Text overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white font-semibold text-sm leading-tight truncate">
          {merchant.businessName}
        </h3>
        {(merchant.city || merchant.categoryName) && (
          <p className="text-white/70 text-xs mt-0.5 truncate">
            {[
              merchant.city && merchant.state
                ? `${merchant.city}, ${merchant.state}`
                : merchant.city,
              merchant.categoryName,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}

function MarqueeRow({
  merchants,
  direction,
  speed,
}: {
  merchants: FeaturedMerchant[];
  direction: "left" | "right";
  speed: number;
}) {
  const items = useMemo(
    () =>
      marqueeCopies.flatMap((copyId, copyIndex) =>
        merchants.map((merchant, merchantIndex) => ({
          merchant,
          itemKey: `${copyId}-${merchant.id}`,
          isPriority:
            merchantIndex < priorityImagesPerRow &&
            (direction === "right" ? copyIndex === 2 : copyIndex === 0),
        })),
      ),
    [direction, merchants],
  );

  if (merchants.length === 0) return null;

  return (
    <div className="relative overflow-hidden">
      <div
        className={`flex gap-4 ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"}`}
        style={{
          animationDuration: `${speed}s`,
        }}
      >
        {items.map(({ merchant, itemKey, isPriority }) => (
          <MerchantCard
            key={itemKey}
            merchant={merchant}
            priority={isPriority}
          />
        ))}
      </div>
    </div>
  );
}

function MarqueeHeading() {
  return (
    <div className="mb-6 flex items-center justify-center px-4">
      <div className="max-w-full text-center">
        <h2
          aria-label="Explore Local Merchants"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-2xl font-black uppercase leading-tight text-white drop-shadow-[0_2px_0_rgba(6,56,96,0.3)] sm:gap-x-4 sm:text-3xl"
        >
          <span>Explore</span>
          <span className="relative mx-1 inline-flex -rotate-1 items-center px-3 py-1 text-orange-300 sm:px-4">
            <span className="absolute inset-0 translate-x-1 translate-y-1 rounded-[6px] bg-white/65" />
            <span className="absolute inset-0 rounded-[6px] bg-[linear-gradient(135deg,#063860_0%,#01233f_70%,#04131f_100%)] shadow-[0_7px_0_rgba(148,56,7,0.28)] ring-1 ring-white/25" />
            <span className="relative drop-shadow-[0_1px_0_rgba(0,0,0,0.55)]">
              Local Merchants
            </span>
          </span>
        </h2>
      </div>
    </div>
  );
}

interface FeaturedMarqueeProps {
  initialMerchants?: FeaturedMerchant[];
  showHeading?: boolean;
}

export function FeaturedMarquee({
  initialMerchants,
  showHeading = true,
}: FeaturedMarqueeProps) {
  const [merchants, setMerchants] = useState<FeaturedMerchant[]>(
    () => initialMerchants ?? [],
  );
  const [isLoading, setIsLoading] = useState(initialMerchants === undefined);

  useEffect(() => {
    if (initialMerchants !== undefined) {
      setMerchants(initialMerchants);
      setIsLoading(false);
      return;
    }

    async function fetchFeatured() {
      try {
        const res = await fetch("/api/featured-merchants");
        if (res.ok) {
          const data = await res.json();
          setMerchants(Array.isArray(data.merchants) ? data.merchants : []);
        }
      } catch (err) {
        console.error("Error fetching featured merchants:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFeatured();
  }, [initialMerchants]);

  const [row1, row2, row3] = useMemo(
    () => [
      shuffleMerchants(merchants, "homepage-featured-row-1"),
      shuffleMerchants(merchants, "homepage-featured-row-2"),
      shuffleMerchants(merchants, "homepage-featured-row-3"),
    ],
    [merchants],
  );

  if (!isLoading && merchants.length === 0) return null;

  if (isLoading) {
    return (
      <section className="relative z-10 py-8">
        {showHeading && <MarqueeHeading />}
        <div className="space-y-4">
          {skeletonRows.map((row) => (
            <div key={row} className="flex gap-4 overflow-hidden px-4">
              {skeletonCards.map((card) => (
                <div
                  key={`${row}-${card}`}
                  className="w-[300px] h-[200px] shrink-0 rounded-lg bg-white/10 animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="relative z-10 py-8">
      {showHeading && <MarqueeHeading />}
      <div className="space-y-4">
        <MarqueeRow merchants={row1} direction="left" speed={40} />
        <MarqueeRow merchants={row2} direction="right" speed={50} />
        <MarqueeRow merchants={row3} direction="left" speed={45} />
      </div>
    </section>
  );
}
