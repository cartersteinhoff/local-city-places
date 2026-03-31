"use client";

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

type RowVariant = "lead" | "standard" | "compact";

function rotateMerchants(merchants: FeaturedMerchant[], offset: number) {
  if (merchants.length === 0) return merchants;

  const normalizedOffset =
    ((offset % merchants.length) + merchants.length) % merchants.length;

  return [
    ...merchants.slice(normalizedOffset),
    ...merchants.slice(0, normalizedOffset),
  ];
}

function buildLoop(merchants: FeaturedMerchant[], copies = 3) {
  return Array.from({ length: copies }, (_, copyIndex) =>
    merchants.map((merchant, merchantIndex) => ({
      merchant,
      key: `${merchant.id}-${copyIndex}-${merchantIndex}`,
      isDuplicate: copyIndex > 0,
    })),
  ).flat();
}

function MerchantCard({
  merchant,
  variant,
  isDuplicate,
}: {
  merchant: FeaturedMerchant;
  variant: RowVariant;
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
      : merchant.city || merchant.state || "";

  const cardClassName = cn(
    "group relative block shrink-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/20 shadow-[0_36px_90px_-54px_rgba(0,0,0,0.98)] ring-1 ring-white/8 transition-transform duration-500 hover:-translate-y-0.5",
    variant === "lead" &&
      "w-[78vw] max-w-[368px] aspect-[4/5] sm:w-[58vw] md:w-[520px] md:max-w-none md:aspect-[16/10] lg:w-[620px]",
    variant === "standard" &&
      "w-[58vw] max-w-[300px] aspect-[4/5] sm:w-[42vw] md:w-[360px] md:max-w-none md:aspect-[16/10] lg:w-[430px]",
    variant === "compact" &&
      "w-[46vw] max-w-[220px] aspect-[5/4] sm:w-[34vw] md:w-[280px] md:max-w-none md:aspect-[16/10] lg:w-[340px]",
    isDuplicate && "pointer-events-none",
  );

  const content = (
    <>
      {photo ? (
        <Image
          src={photo}
          alt={merchant.businessName}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          sizes="(min-width: 1280px) 520px, (min-width: 768px) 390px, 76vw"
        />
      ) : merchant.logoUrl ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(160deg,rgba(39,39,42,0.92),rgba(9,9,11,0.98))] p-7">
          <Image
            src={merchant.logoUrl}
            alt={merchant.businessName}
            width={220}
            height={100}
            className="max-h-[88px] object-contain opacity-95"
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(63,63,70,0.92),rgba(9,9,11,0.98))]" />
      )}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.01),rgba(0,0,0,0.12)_42%,rgba(0,0,0,0.74))]" />

      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
        <div className="max-w-[85%]">
          <h3
            className={cn(
              "truncate font-medium text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.72)]",
              variant === "lead" ? "text-lg md:text-[1.5rem]" : "text-sm md:text-base",
            )}
          >
            {merchant.businessName}
          </h3>
          {(location || merchant.categoryName) && (
            <p className="mt-1 truncate text-[11px] uppercase tracking-[0.2em] text-white/62 md:text-xs">
              {[location, merchant.categoryName].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </>
  );

  if (!href) {
    return (
      <div className={cardClassName} aria-hidden={isDuplicate}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cardClassName}
      aria-hidden={isDuplicate}
      tabIndex={isDuplicate ? -1 : undefined}
    >
      {content}
    </Link>
  );
}

function MerchantCardSkeleton({ variant }: { variant: RowVariant }) {
  return (
    <div
      className={cn(
        "shrink-0 rounded-[1.6rem] border border-white/10 bg-white/10 animate-pulse",
        variant === "lead" &&
          "w-[76vw] max-w-[360px] aspect-[4/5] sm:w-[56vw] md:w-[440px] md:max-w-none md:aspect-[16/10] lg:w-[520px]",
        variant === "standard" &&
          "w-[58vw] max-w-[290px] aspect-[4/5] sm:w-[42vw] md:w-[340px] md:max-w-none md:aspect-[16/10] lg:w-[390px]",
        variant === "compact" &&
          "w-[44vw] max-w-[220px] aspect-[5/4] sm:w-[34vw] md:w-[250px] md:max-w-none md:aspect-[16/10] lg:w-[300px]",
      )}
    />
  );
}

function GalleryRow({
  merchants,
  direction,
  speed,
  variant,
  className,
}: {
  merchants: FeaturedMerchant[];
  direction: "left" | "right";
  speed: number;
  variant: RowVariant;
  className?: string;
}) {
  if (merchants.length === 0) return null;

  const items = buildLoop(merchants);

  return (
    <div className={cn("relative overflow-hidden py-3 md:py-4", className)}>
      <div
        className={cn(
          "gallery-lane-mask gallery-track flex w-max items-center gap-6 px-5 sm:gap-8 sm:px-7 md:gap-10 md:px-10 lg:gap-14 lg:px-14 motion-reduce:animate-none",
          direction === "left"
            ? "animate-marquee-left"
            : "animate-marquee-right",
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        {items.map(({ merchant, key, isDuplicate }) => (
          <MerchantCard
            key={key}
            merchant={merchant}
            variant={variant}
            isDuplicate={isDuplicate}
          />
        ))}
      </div>
    </div>
  );
}

function GalleryRowSkeleton({
  variant,
  className,
}: {
  variant: RowVariant;
  className?: string;
}) {
  const keys =
    variant === "lead"
      ? ["lead-a", "lead-b", "lead-c", "lead-d"]
      : variant === "standard"
        ? ["standard-a", "standard-b", "standard-c", "standard-d", "standard-e"]
        : ["compact-a", "compact-b", "compact-c", "compact-d", "compact-e"];

  return (
    <div className={cn("relative overflow-hidden py-3 md:py-4", className)}>
      <div className="gallery-lane-mask flex w-max items-center gap-5 px-4 sm:gap-6 sm:px-6 md:gap-8 md:px-8 lg:gap-10 lg:px-10">
        {keys.map((key) => (
          <MerchantCardSkeleton key={key} variant={variant} />
        ))}
      </div>
    </div>
  );
}

function GalleryRows({ merchants }: { merchants: FeaturedMerchant[] }) {
  const secondRow = rotateMerchants(
    merchants,
    Math.max(1, Math.floor(merchants.length / 3)),
  );
  const thirdRow = rotateMerchants(
    merchants,
    Math.max(1, Math.floor((merchants.length * 2) / 3)),
  );

  return (
    <>
      <div className="md:hidden">
        <GalleryRow
          merchants={secondRow}
          direction="left"
          speed={240}
          variant="lead"
        />
      </div>

      <div className="hidden md:block">
        <GalleryRow
          merchants={merchants}
          direction="left"
          speed={430}
          variant="compact"
          className="translate-y-8 opacity-38"
        />
        <GalleryRow
          merchants={secondRow}
          direction="left"
          speed={500}
          variant="lead"
          className="-mt-5"
        />
        <GalleryRow
          merchants={thirdRow}
          direction="left"
          speed={455}
          variant="standard"
          className="-mt-5 -translate-y-8 opacity-54"
        />
      </div>
    </>
  );
}

function GallerySkeleton() {
  return (
    <>
      <div className="md:hidden">
        <GalleryRowSkeleton variant="lead" />
      </div>

      <div className="hidden md:block">
        <GalleryRowSkeleton variant="compact" className="opacity-42" />
        <GalleryRowSkeleton variant="lead" className="-mt-7" />
        <GalleryRowSkeleton variant="standard" className="-mt-7 opacity-58" />
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
    <section className="relative z-10 flex w-full items-center overflow-hidden pt-24 pb-12 md:min-h-[100svh] md:pt-28 md:pb-20">
      <div className="pointer-events-none absolute inset-x-0 top-[24%] h-44 bg-[radial-gradient(circle_at_center,_rgba(255,213,163,0.15),_transparent_65%)] blur-3xl md:h-56" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-64 -translate-y-1/2 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),_transparent_68%)] blur-3xl md:h-80" />
      <div className="pointer-events-none absolute inset-x-0 bottom-6 h-40 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.34))] blur-2xl md:bottom-10" />
      <div className="relative w-full">
        <div className="px-6 pb-4 text-center md:px-10 md:pb-6">
          <p className="text-[11px] uppercase tracking-[0.36em] text-white/62 md:text-xs">
            Explore Local Merchants
          </p>
        </div>
        <div className="relative min-h-[430px] w-full md:min-h-[700px]">
        {isLoading ? <GallerySkeleton /> : <GalleryRows merchants={merchants} />}
        </div>
      </div>
    </section>
  );
}
