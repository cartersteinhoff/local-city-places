"use client";

import { RadioTower } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

const cityColumns = [
  [
    "Ahwatukee",
    "Apache Junction",
    "Avondale",
    "Buckeye",
    "Casa Grande",
    "Chandler",
  ],
  [
    "El Mirage",
    "Florence",
    "Fountain Hills",
    "Gilbert",
    "Glendale",
    "Goodyear",
  ],
  ["Laveen", "Maricopa", "Mesa", "Peoria", "Phoenix", "Queen Creek"],
  [
    "San Tan Valley",
    "Scottsdale",
    "Sun City",
    "Sun City West",
    "Surprise",
    "Tempe",
  ],
];

const allCities = cityColumns.flat();

function FeaturedMediaArtwork({ className }: { className?: string }) {
  const [imageAvailable, setImageAvailable] = useState(true);

  return (
    <div
      className={cn(
        "relative mx-auto flex aspect-[1566/1004] w-full overflow-hidden rounded-[8px] border border-orange-200/20 bg-white shadow-2xl shadow-black/45",
        className,
      )}
    >
      {imageAvailable ? (
        <Image
          src="/images/troy-city-living-local-city-places-mogul-desert.webp"
          alt="Troy Warren, Editor in Chief of the cityLIVING Magazine Network and LOCAL City Places"
          width={1566}
          height={1004}
          className="h-full w-full object-cover"
          quality={82}
          sizes="(min-width: 1280px) 58vw, (min-width: 1024px) 64vw, 100vw"
          onError={() => setImageAvailable(false)}
        />
      ) : (
        <div className="relative flex min-h-[330px] w-full items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#ffe3cf_45%,#dff0ff_100%)] p-8 text-center">
          <div className="relative">
            <p className="text-sm font-black uppercase tracking-wide text-red-600 sm:text-lg">
              Editor in Chief
            </p>
            <p className="mt-2 text-5xl font-black leading-none text-slate-950 sm:text-7xl">
              cityLIVING
            </p>
            <p className="mt-2 text-2xl font-black uppercase tracking-wide text-slate-950 sm:text-4xl">
              Magazine Network
            </p>
            <p className="mt-5 text-xl font-black uppercase text-red-600 sm:text-3xl">
              LOCAL City Places
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CityPinMarker() {
  const id = useId().replace(/:/g, "");
  const gradientId = `city-pin-gradient-${id}`;
  const filterId = `city-pin-shadow-${id}`;

  return (
    <span
      aria-hidden="true"
      className="relative flex h-8 w-8 shrink-0 items-center justify-center"
    >
      <span className="absolute bottom-0 h-2 w-4 rounded-full bg-black/70 blur-[2px]" />
      <svg
        viewBox="0 0 32 40"
        className="relative h-7 w-6 overflow-visible"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="8"
            x2="25"
            y1="5"
            y2="31"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#ffb347" />
            <stop offset="0.45" stopColor="#ff7a1a" />
            <stop offset="1" stopColor="#ef4e00" />
          </linearGradient>
          <filter
            id={filterId}
            x="-35%"
            y="-20%"
            width="170%"
            height="160%"
            colorInterpolationFilters="sRGB"
          >
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="2.6"
              floodColor="#f97316"
              floodOpacity="0.3"
            />
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="3"
              floodColor="#000000"
              floodOpacity="0.45"
            />
          </filter>
        </defs>
        <path
          d="M16 2.25C8.66 2.25 2.75 8.2 2.75 15.58c0 9.55 13.25 22.17 13.25 22.17s13.25-12.62 13.25-22.17C29.25 8.2 23.34 2.25 16 2.25Z"
          fill={`url(#${gradientId})`}
          filter={`url(#${filterId})`}
        />
        <path
          d="M8.2 14.9C8.2 9.86 12.28 5.8 17.12 5.8c3.9 0 6.42 2.08 7.86 4.66C22.98 7.38 19.78 5 16 5 10.44 5 6.45 9.52 6.45 14.96c0 3.08 1.48 6.18 3.28 8.86-1.86-3.44-1.53-5.9-1.53-8.92Z"
          fill="#fff7df"
          opacity="0.28"
        />
        <circle
          cx="16"
          cy="15.3"
          r="5.6"
          fill="#111111"
          stroke="#fff1d6"
          strokeOpacity="0.9"
          strokeWidth="1.7"
        />
        <circle cx="13.9" cy="13.1" r="1.15" fill="#ffffff" opacity="0.72" />
      </svg>
    </span>
  );
}

// Tabler's MIT-licensed cactus glyph stays readable at section-title size.
function CactusTitleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-5 w-5 shrink-0 text-orange-500", className)}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M6 9v1a3 3 0 0 0 3 3h1" />
      <path d="M18 8v5a3 3 0 0 1-3 3h-1" />
      <path d="M10 21V5a2 2 0 1 1 4 0v16" />
      <path d="M7 21h10" />
    </svg>
  );
}

function CityColumn({
  cities,
  withDivider,
}: {
  cities: string[];
  withDivider: boolean;
}) {
  return (
    <ul
      className={cn(
        "space-y-4 px-2 sm:px-5",
        withDivider && "md:border-l md:border-white/25",
      )}
    >
      {cities.map((city) => (
        <CityListItem key={city} city={city} />
      ))}
    </ul>
  );
}

function CityListItem({ city }: { city: string }) {
  return (
    <li className="flex min-h-8 min-w-0 items-center gap-2 text-sm font-medium text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] sm:gap-3 sm:text-base lg:text-xl xl:text-2xl">
      <CityPinMarker />
      <span>{city}</span>
    </li>
  );
}

export function HomeLiveLocalMedia() {
  return (
    <section className="relative z-10 overflow-hidden bg-[#05090f] text-white">
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/images/new-year-250-background.jpg"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          quality={82}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,15,0.72)_0%,rgba(3,8,15,0.5)_36%,rgba(0,0,0,0.8)_100%)]" />

      <div className="relative border-t border-white/10 px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-[1400px] 2xl:max-w-[1760px]">
          <div className="mb-6 flex items-center justify-center gap-2 text-orange-500 sm:gap-3">
            <RadioTower className="h-4 w-4 sm:h-5 sm:w-5" />
            <h2 className="text-center text-[1.7rem] font-black uppercase leading-none text-white sm:text-3xl">
              Live Local Media
            </h2>
            <RadioTower className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>

          <FeaturedMediaArtwork className="max-w-[1100px]" />
        </div>
      </div>

      <div className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-center gap-3 drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)]">
            <CactusTitleIcon />
            <h2 className="text-center text-2xl font-black uppercase sm:text-3xl">
              Explore the <span className="text-orange-500">Phoenix Metro</span>
            </h2>
            <CactusTitleIcon />
          </div>

          <ul className="grid grid-cols-2 gap-x-4 gap-y-3 md:hidden">
            {allCities.map((city) => (
              <CityListItem key={city} city={city} />
            ))}
          </ul>

          <div className="hidden gap-6 sm:grid-cols-2 md:grid md:grid-cols-4 md:gap-0">
            {cityColumns.map((cities, index) => (
              <CityColumn
                key={cities[0]}
                cities={cities}
                withDivider={index > 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
