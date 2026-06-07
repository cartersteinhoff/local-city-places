"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import type { FeaturedMerchant } from "@/lib/featured-merchants-types";
import { getMerchantPageUrl } from "@/lib/utils";

const skeletonRows = ["row-1", "row-2", "row-3"];
const marqueeCopies = ["copy-1", "copy-2", "copy-3", "copy-4"];
const merchantsPerRow = 10;
const priorityImagesPerRow = 3;
const sectionStyle = {
  position: "relative",
  zIndex: 10,
  boxSizing: "border-box",
  minHeight: "clamp(765px, calc(844px - 12vw), 796px)",
  paddingTop: "2rem",
  paddingBottom: "2rem",
} satisfies CSSProperties;
const rowsContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
} satisfies CSSProperties;
const rowStyle = {
  position: "relative",
  height: "200px",
  overflow: "hidden",
} satisfies CSSProperties;
const trackStyle = {
  display: "flex",
  gap: "1rem",
  width: "max-content",
} satisfies CSSProperties;
const cardStyle = {
  position: "relative",
  display: "block",
  width: "300px",
  height: "200px",
  flexShrink: 0,
  overflow: "hidden",
  borderRadius: "0.5rem",
  backgroundColor: "#111827",
} satisfies CSSProperties;
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

function getRowMerchants(merchants: FeaturedMerchant[], rowIndex: number) {
  const start = rowIndex * merchantsPerRow;
  const rowMerchants = merchants.slice(start, start + merchantsPerRow);

  return rowMerchants.length > 0
    ? rowMerchants
    : merchants.slice(0, merchantsPerRow);
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

  const imageLoadProps = priority
    ? ({ priority: true } as const)
    : ({ loading: "eager" } as const);

  return (
    <Link
      href={href}
      className="group relative block w-[300px] h-[200px] shrink-0 rounded-lg overflow-hidden bg-zinc-900 shadow-lg"
      style={cardStyle}
    >
      {merchant.imageUrl ? (
        <Image
          src={merchant.imageUrl}
          alt={merchant.businessName}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          style={{ objectFit: "cover" }}
          sizes="300px"
          quality={60}
          {...imageLoadProps}
        />
      ) : merchant.logoUrl ? (
        <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center p-6">
          <Image
            src={merchant.logoUrl}
            alt={merchant.businessName}
            width={200}
            height={100}
            className="object-contain max-h-[80px]"
            style={{ maxHeight: "80px", objectFit: "contain" }}
            quality={60}
            {...imageLoadProps}
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
    <div className="relative overflow-hidden" style={rowStyle}>
      <div
        className={`flex gap-4 ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"}`}
        style={{
          ...trackStyle,
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
    <div
      className="mb-6 flex items-center justify-center px-4"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "1.5rem",
        paddingRight: "1rem",
        paddingLeft: "1rem",
      }}
    >
      <div className="max-w-full text-center">
        <h2
          aria-label="Explore PHX Metro Merchants"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-2xl font-black uppercase leading-tight text-white drop-shadow-[0_2px_0_rgba(6,56,96,0.3)] sm:gap-x-4 sm:text-3xl"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem clamp(0.75rem, 2vw, 1rem)",
            margin: 0,
            color: "white",
            fontSize: "clamp(1.5rem, 4vw, 1.875rem)",
            fontWeight: 900,
            lineHeight: 1.25,
            textTransform: "uppercase",
          }}
        >
          <span>Explore</span>
          <span
            className="relative mx-1 inline-flex -rotate-1 items-center px-3 py-1 text-orange-300 sm:px-4"
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              marginRight: "0.25rem",
              marginLeft: "0.25rem",
              padding: "0.25rem clamp(0.75rem, 2vw, 1rem)",
              color: "#fdba74",
              transform: "rotate(-1deg)",
            }}
          >
            <span
              className="absolute inset-0 translate-x-1 translate-y-1 rounded-[6px] bg-white/65"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "6px",
                background: "rgba(255,255,255,0.65)",
                transform: "translate(0.25rem, 0.25rem)",
              }}
            />
            <span
              className="absolute inset-0 rounded-[6px] bg-[linear-gradient(135deg,#063860_0%,#01233f_70%,#04131f_100%)] shadow-[0_7px_0_rgba(148,56,7,0.28)] ring-1 ring-white/25"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "6px",
                background:
                  "linear-gradient(135deg,#063860 0%,#01233f 70%,#04131f 100%)",
              }}
            />
            <span
              className="relative drop-shadow-[0_1px_0_rgba(0,0,0,0.55)]"
              style={{ position: "relative" }}
            >
              PHX Metro Merchants
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
      getRowMerchants(merchants, 0),
      shuffleMerchants(
        getRowMerchants(merchants, 1),
        "homepage-featured-row-2",
      ),
      shuffleMerchants(
        getRowMerchants(merchants, 2),
        "homepage-featured-row-3",
      ),
    ],
    [merchants],
  );

  if (!isLoading && merchants.length === 0) return null;

  if (isLoading) {
    return (
      <section className="relative z-10 py-8" style={sectionStyle}>
        {showHeading && <MarqueeHeading />}
        <div className="flex flex-col gap-4" style={rowsContainerStyle}>
          {skeletonRows.map((row) => (
            <div
              key={row}
              className="flex gap-4 overflow-hidden px-4"
              style={{
                ...trackStyle,
                height: "200px",
                overflow: "hidden",
                paddingRight: "1rem",
                paddingLeft: "1rem",
              }}
            >
              {skeletonCards.map((card) => (
                <div
                  key={`${row}-${card}`}
                  className="w-[300px] h-[200px] shrink-0 rounded-lg bg-white/10 animate-pulse"
                  style={cardStyle}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="relative z-10 py-8" style={sectionStyle}>
      {showHeading && <MarqueeHeading />}
      <div className="flex flex-col gap-4" style={rowsContainerStyle}>
        <MarqueeRow merchants={row1} direction="right" speed={120} />
        <MarqueeRow merchants={row2} direction="right" speed={140} />
        <MarqueeRow merchants={row3} direction="left" speed={130} />
      </div>
    </section>
  );
}
