"use client";

import type { CSSProperties } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn, getMerchantPageUrl } from "@/lib/utils";

interface FeaturedMerchant {
  id: string;
  businessName: string;
  city: string | null;
  state: string | null;
  slug: string | null;
  logoUrl: string | null;
  photos: string[] | null;
  categoryName: string | null;
}

type MarqueeVariant = "hero" | "standard" | "support";

interface MarqueeItem {
  merchant: FeaturedMerchant;
  key: string;
  sequence: number;
  isDuplicate: boolean;
}

function rotateMerchants(merchants: FeaturedMerchant[], offset: number) {
  if (merchants.length === 0) return merchants;

  const normalizedOffset =
    ((offset % merchants.length) + merchants.length) % merchants.length;
  return [
    ...merchants.slice(normalizedOffset),
    ...merchants.slice(0, normalizedOffset),
  ];
}

function buildLoopItems(
  merchants: FeaturedMerchant[],
  copies = 4,
): MarqueeItem[] {
  return Array.from({ length: copies }, (_, copyIndex) =>
    merchants.map((merchant, merchantIndex) => ({
      merchant,
      key: `${merchant.id}-${copyIndex}-${merchantIndex}`,
      sequence: copyIndex * merchants.length + merchantIndex,
      isDuplicate: copyIndex > 0,
    })),
  ).flat();
}

function MerchantCard({
  merchant,
  variant,
  sequence,
  isDuplicate,
}: {
  merchant: FeaturedMerchant;
  variant: MarqueeVariant;
  sequence: number;
  isDuplicate: boolean;
}) {
  const href =
    merchant.city && merchant.state && merchant.slug
      ? getMerchantPageUrl(merchant.city, merchant.state, merchant.slug)
      : null;

  const photo = merchant.photos?.[0];
  const location =
    merchant.city && merchant.state
      ? `${merchant.city}, ${merchant.state}`
      : merchant.city || merchant.state;

  const wavePattern =
    variant === "hero"
      ? [0, -30, 16, -18, 28, -12, 14, -24]
      : variant === "support"
        ? [0, -14, 10, -8, 14, -6, 8, -10]
        : [0, -20, 12, -14, 18, -9, 10, -16];

  const imageDriftPattern = [12, -10, 14, -8, 10, -12, 8, -14];
  const waveHeight = wavePattern[sequence % wavePattern.length];
  const imageDrift = imageDriftPattern[sequence % imageDriftPattern.length];
  const baseScale =
    variant === "hero" ? "1" : variant === "support" ? "0.94" : "0.97";
  const scaleBump =
    variant === "hero" ? "0.05" : variant === "support" ? "0.025" : "0.035";

  const cardStyle = {
    "--wave-height": `${waveHeight}px`,
    "--wave-duration": `${20 + (sequence % 5) * 2.2}s`,
    "--wave-delay": `${(sequence % 6) * 0.45}s`,
    "--card-scale": baseScale,
    "--card-scale-bump": scaleBump,
    "--image-drift": `${imageDrift}px`,
    "--image-duration": `${24 + (sequence % 4) * 2.4}s`,
  } as CSSProperties;

  const cardClassName = cn(
    "group relative block shrink-0 overflow-hidden rounded-[1.75rem] border border-white/15 bg-black/20 shadow-[0_28px_90px_-45px_rgba(0,0,0,0.95)] ring-1 ring-white/10 transition-[transform,box-shadow,opacity] duration-500 hover:-translate-y-1 hover:shadow-[0_35px_110px_-50px_rgba(0,0,0,1)]",
    variant === "hero" &&
      "w-[76vw] max-w-[340px] aspect-[4/5] sm:w-[58vw] md:w-[430px] md:max-w-none md:aspect-[16/10] lg:w-[500px]",
    variant === "standard" &&
      "w-[62vw] max-w-[290px] aspect-[4/5] sm:w-[48vw] md:w-[350px] md:max-w-none md:aspect-[16/10] lg:w-[400px]",
    variant === "support" &&
      "w-[48vw] max-w-[230px] aspect-[5/4] sm:w-[40vw] md:w-[280px] md:max-w-none md:aspect-[16/10] lg:w-[320px]",
    isDuplicate && "pointer-events-none",
  );

  const content = (
    <>
      {photo ? (
        <Image
          src={photo}
          alt={merchant.businessName}
          fill
          className="gallery-card-image object-cover transition-transform duration-700 group-hover:scale-[1.14] motion-reduce:animate-none"
          sizes="(min-width: 1280px) 500px, (min-width: 768px) 350px, 76vw"
        />
      ) : merchant.logoUrl ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_58%),linear-gradient(135deg,rgba(24,24,27,0.94),rgba(9,9,11,0.92))] p-6">
          <Image
            src={merchant.logoUrl}
            alt={merchant.businessName}
            width={200}
            height={100}
            className="max-h-[88px] object-contain opacity-95"
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-950">
          <span className="text-lg font-bold text-white/60">
            {merchant.businessName.charAt(0)}
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.25)_42%,rgba(0,0,0,0.86))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.12),_transparent_58%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 md:p-5">
        {merchant.categoryName ? (
          <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur-md">
            {merchant.categoryName}
          </span>
        ) : (
          <span />
        )}

        <span className="hidden rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/72 backdrop-blur-md md:inline-flex">
          Featured
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h3
              className={cn(
                "truncate font-semibold leading-tight text-white",
                variant === "hero"
                  ? "text-xl md:text-2xl"
                  : "text-base md:text-lg",
              )}
            >
              {merchant.businessName}
            </h3>

            {(location || merchant.categoryName) && (
              <p className="mt-2 flex min-h-[20px] items-center gap-1.5 text-xs text-white/78 md:text-sm">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{location || "Local market"}</span>
                {location && merchant.categoryName ? (
                  <span className="text-white/35">/</span>
                ) : null}
                {merchant.categoryName ? (
                  <span className="truncate">{merchant.categoryName}</span>
                ) : null}
              </p>
            )}
          </div>

          <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white/85 backdrop-blur-md transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 md:inline-flex">
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </div>
      </div>
    </>
  );

  return (
    <div
      className="gallery-card-shell shrink-0 motion-reduce:animate-none"
      style={cardStyle}
    >
      {href ? (
        <Link
          href={href}
          className={cardClassName}
          aria-hidden={isDuplicate}
          tabIndex={isDuplicate ? -1 : undefined}
        >
          {content}
        </Link>
      ) : (
        <div className={cardClassName} aria-hidden={isDuplicate}>
          {content}
        </div>
      )}
    </div>
  );
}

function MerchantCardSkeleton({ variant }: { variant: MarqueeVariant }) {
  return (
    <div
      className={cn(
        "shrink-0 rounded-[1.75rem] border border-white/10 bg-white/10 shadow-[0_28px_90px_-45px_rgba(0,0,0,0.95)] animate-pulse",
        variant === "hero" &&
          "w-[76vw] max-w-[340px] aspect-[4/5] sm:w-[58vw] md:w-[430px] md:max-w-none md:aspect-[16/10] lg:w-[500px]",
        variant === "standard" &&
          "w-[62vw] max-w-[290px] aspect-[4/5] sm:w-[48vw] md:w-[350px] md:max-w-none md:aspect-[16/10] lg:w-[400px]",
        variant === "support" &&
          "w-[48vw] max-w-[230px] aspect-[5/4] sm:w-[40vw] md:w-[280px] md:max-w-none md:aspect-[16/10] lg:w-[320px]",
      )}
    />
  );
}

function MarqueeRow({
  merchants,
  direction,
  speed,
  variant,
  laneClassName,
}: {
  merchants: FeaturedMerchant[];
  direction: "left" | "right";
  speed: number;
  variant: MarqueeVariant;
  laneClassName?: string;
}) {
  if (merchants.length === 0) return null;

  const items = buildLoopItems(merchants);

  return (
    <div className={cn("relative overflow-hidden py-4 md:py-5", laneClassName)}>
      <div
        className={cn(
          "gallery-lane-mask gallery-track flex w-max items-center gap-4 px-4 sm:gap-5 sm:px-6 md:gap-6 md:px-8 motion-reduce:animate-none",
          direction === "left"
            ? "animate-marquee-left"
            : "animate-marquee-right",
        )}
        style={{
          animationDuration: `${speed}s`,
        }}
      >
        {items.map(({ merchant, key, sequence, isDuplicate }) => (
          <MerchantCard
            key={key}
            merchant={merchant}
            sequence={sequence}
            variant={variant}
            isDuplicate={isDuplicate}
          />
        ))}
      </div>
    </div>
  );
}

function MarqueeRowSkeleton({
  variant,
  laneClassName,
}: {
  variant: MarqueeVariant;
  laneClassName?: string;
}) {
  const count = variant === "hero" ? 5 : 6;
  const skeletonKeys =
    variant === "hero"
      ? [
          "hero-a",
          "hero-b",
          "hero-c",
          "hero-d",
          "hero-e",
        ]
      : variant === "support"
        ? [
            "support-a",
            "support-b",
            "support-c",
            "support-d",
            "support-e",
            "support-f",
          ]
        : [
            "standard-a",
            "standard-b",
            "standard-c",
            "standard-d",
            "standard-e",
            "standard-f",
          ];

  return (
    <div className={cn("relative overflow-hidden py-4 md:py-5", laneClassName)}>
      <div className="gallery-lane-mask flex w-max items-center gap-4 px-4 sm:gap-5 sm:px-6 md:gap-6 md:px-8">
        {skeletonKeys.slice(0, count).map((key) => (
          <MerchantCardSkeleton key={key} variant={variant} />
        ))}
      </div>
    </div>
  );
}

function GalleryRows({ merchants }: { merchants: FeaturedMerchant[] }) {
  const leadOffset = Math.max(1, Math.floor(merchants.length / 3));
  const trailingOffset = Math.max(1, Math.floor((merchants.length * 2) / 3));

  const heroLane = rotateMerchants(merchants, leadOffset);
  const supportLane = rotateMerchants(merchants, trailingOffset);

  return (
    <>
      <div className="md:hidden">
        <MarqueeRow
          merchants={heroLane}
          direction="left"
          speed={56}
          variant="hero"
          laneClassName="gallery-lane-mobile-main"
        />
        <MarqueeRow
          merchants={supportLane}
          direction="right"
          speed={68}
          variant="support"
          laneClassName="-mt-3 opacity-75"
        />
      </div>

      <div className="hidden md:block">
        <MarqueeRow
          merchants={merchants}
          direction="left"
          speed={72}
          variant="support"
          laneClassName="gallery-lane-top opacity-80"
        />
        <MarqueeRow
          merchants={heroLane}
          direction="right"
          speed={88}
          variant="hero"
          laneClassName="gallery-lane-center -mt-6"
        />
        <MarqueeRow
          merchants={supportLane}
          direction="left"
          speed={78}
          variant="standard"
          laneClassName="gallery-lane-bottom -mt-5 opacity-90"
        />
      </div>
    </>
  );
}

function GallerySkeleton() {
  return (
    <>
      <div className="md:hidden">
        <MarqueeRowSkeleton
          variant="hero"
          laneClassName="gallery-lane-mobile-main"
        />
        <MarqueeRowSkeleton
          variant="support"
          laneClassName="-mt-3 opacity-75"
        />
      </div>

      <div className="hidden md:block">
        <MarqueeRowSkeleton
          variant="support"
          laneClassName="gallery-lane-top opacity-80"
        />
        <MarqueeRowSkeleton
          variant="hero"
          laneClassName="gallery-lane-center -mt-6"
        />
        <MarqueeRowSkeleton
          variant="standard"
          laneClassName="gallery-lane-bottom -mt-5 opacity-90"
        />
      </div>
    </>
  );
}

export function FeaturedMarquee() {
  const [merchants, setMerchants] = useState<FeaturedMerchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch("/api/featured-merchants");
        if (res.ok) {
          const data = await res.json();
          setMerchants(data.merchants);
        }
      } catch (err) {
        console.error("Error fetching featured merchants:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeatured();
  }, []);

  if (!isLoading && merchants.length === 0) return null;

  return (
    <section className="relative z-10 flex w-full items-center overflow-hidden py-6 md:py-10">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-52 -translate-y-1/2 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.18),_transparent_68%)] blur-3xl md:h-72" />
      <div className="relative min-h-[420px] w-full md:min-h-[660px]">
        {isLoading ? (
          <GallerySkeleton />
        ) : (
          <GalleryRows merchants={merchants} />
        )}
      </div>
    </section>
  );
}
