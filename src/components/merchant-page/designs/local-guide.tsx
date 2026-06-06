"use client";

/**
 * DESIGN: "Local Guide"
 *
 * Modern directory-style merchant page inspired by restaurant listing pages.
 * Strong food/venue imagery, blue action system, quick facts, gallery,
 * review summary, and sticky business information sidebar.
 */

import {
  Award,
  CalendarDays,
  Camera,
  ChevronLeft,
  Check,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Facebook,
  Globe,
  Heart,
  Image as ImageIcon,
  Instagram,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Sparkles,
  Star,
  Tag,
  Utensils,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { formatHoursDisplay, formatPhoneNumber } from "@/lib/utils";
import {
  formatFullAddress,
  GoogleMapEmbed,
  getGoogleMapsDirectionsUrl,
} from "../google-map-embed";

interface Hours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

interface Service {
  name: string;
  description?: string;
  price?: string;
}

interface MerchantReview {
  id: string;
  content: string;
  rating: number | null;
  reviewerFirstName: string | null;
  reviewerLastName: string | null;
  reviewerPhotoUrl: string | null;
  createdAt: Date | string;
  photos: string[];
}

interface FavoriteMerchantTestimonial {
  id: string;
  content: string;
  memberFirstName: string | null;
  memberLastName: string | null;
  memberPhotoUrl: string | null;
  createdAt: Date | string;
  photos: string[];
}

interface MerchantPageProps {
  merchantId?: string;
  businessName: string;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  logoUrl?: string | null;
  categoryName?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  vimeoUrl?: string | null;
  googlePlaceId?: string | null;
  hours?: Hours | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  photos?: string[] | null;
  services?: Service[] | null;
  aboutStory?: string | null;
  reviews?: MerchantReview[];
  favoriteMerchantTestimonials?: FavoriteMerchantTestimonial[];
  heroVariant?: "standard" | "photo-strip";
}

const dayRows: { key: keyof Hours; short: string; label: string }[] = [
  { key: "monday", short: "Mon", label: "Monday" },
  { key: "tuesday", short: "Tue", label: "Tuesday" },
  { key: "wednesday", short: "Wed", label: "Wednesday" },
  { key: "thursday", short: "Thu", label: "Thursday" },
  { key: "friday", short: "Fri", label: "Friday" },
  { key: "saturday", short: "Sat", label: "Saturday" },
  { key: "sunday", short: "Sun", label: "Sunday" },
];

function formatWebsiteLabel(website: string) {
  return website.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function formatReviewDate(date: Date | string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getReviewerName(review: MerchantReview) {
  const firstName = review.reviewerFirstName || "";
  const lastInitial = review.reviewerLastName?.charAt(0)
    ? `${review.reviewerLastName.charAt(0)}.`
    : "";
  return [firstName, lastInitial].filter(Boolean).join(" ") || "Local customer";
}

function getTestimonialName(testimonial: FavoriteMerchantTestimonial) {
  const firstName = testimonial.memberFirstName || "";
  const lastInitial = testimonial.memberLastName?.charAt(0)
    ? `${testimonial.memberLastName.charAt(0)}.`
    : "";
  return [firstName, lastInitial].filter(Boolean).join(" ") || "Local customer";
}

function initialsFor(value: string) {
  return value
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function Stars({
  rating,
  size = "w-4 h-4",
}: {
  rating: number;
  size?: string;
}) {
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= Math.round(rating)
              ? "fill-[#F7B500] text-[#F7B500]"
              : "fill-slate-200 text-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

function MapPlaceholder() {
  return (
    <div className="absolute inset-0 bg-[#EDF2F7]">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(#D6DEE8 1px, transparent 1px), linear-gradient(90deg, #D6DEE8 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      <div className="absolute left-[18%] top-0 h-full w-px bg-white/80" />
      <div className="absolute left-[54%] top-0 h-full w-px bg-white/80" />
      <div className="absolute left-0 top-[33%] h-px w-full bg-white/80" />
      <div className="absolute left-0 top-[68%] h-px w-full bg-white/80" />
      <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-xl ring-8 ring-[#2563EB]/15">
        <MapPin className="h-6 w-6 fill-white/20" />
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  href,
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
}) {
  const content = (
    <>
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </span>
      <span className="mt-1 block text-sm font-semibold leading-snug text-slate-900">
        {value}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className="block border-b border-slate-100 py-3 transition-colors hover:text-[#2563EB]"
      >
        {content}
      </a>
    );
  }

  return <div className="border-b border-slate-100 py-3">{content}</div>;
}

function RatingBlocks({ rating }: { rating: number }) {
  const filledStars = Math.round(rating);

  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`flex h-8 w-8 items-center justify-center rounded-[6px] ${
            star <= filledStars ? "bg-[#ff5a3d]" : "bg-white/35"
          }`}
        >
          <Star className="h-5 w-5 fill-white text-white" />
        </span>
      ))}
    </div>
  );
}

function PhotoStripHero({
  businessName,
  categoryName,
  cleanPhotos,
  location,
  displayRating,
  averageRating,
  reviewCount,
  hasHours,
  isOpenToday,
  todayHours,
  onOpenPhotos,
}: {
  businessName: string;
  categoryName?: string | null;
  cleanPhotos: string[];
  location: string;
  displayRating: string;
  averageRating: number;
  reviewCount: number;
  hasHours: boolean;
  isOpenToday: boolean;
  todayHours: string | null;
  onOpenPhotos: () => void;
}) {
  const photoStrip: { id: string; src: string }[] =
    cleanPhotos.length > 0
      ? Array.from({ length: 5 }, (_, index) => ({
          id: `photo-strip-slot-${index + 1}`,
          src: cleanPhotos[index % cleanPhotos.length],
        }))
      : [];
  const hasPhotos = photoStrip.length > 0;

  return (
    <section className="relative min-h-[430px] overflow-hidden bg-slate-950 text-white sm:min-h-[460px] lg:min-h-[455px]">
      {hasPhotos ? (
        <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-5 md:[grid-template-columns:1.15fr_0.9fr_1.35fr_0.85fr_0.85fr]">
          {photoStrip.map((photo, index) => (
            <div
              key={photo.id}
              className={`relative overflow-hidden bg-slate-800 ${
                index > 1 ? "hidden md:block" : ""
              }`}
            >
              <Image
                src={photo.src}
                alt={`${businessName} ${index + 1}`}
                fill
                sizes="(min-width: 768px) 20vw, 50vw"
                className="h-full w-full object-cover"
                priority={index < 3}
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>
          ))}
        </div>
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#172033_0%,#0f172a_52%,#020617_100%)]" />
      )}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.38)_58%,rgba(0,0,0,0.86)_100%)]" />
      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/40 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[430px] max-w-7xl items-end px-4 pb-10 pt-20 sm:min-h-[460px] sm:px-6 lg:min-h-[455px]">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-black leading-[0.98] tracking-normal text-white drop-shadow-2xl sm:text-5xl lg:text-6xl">
            {businessName}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-3 text-base font-bold text-white">
            {averageRating > 0 && <RatingBlocks rating={averageRating} />}
            <span className="drop-shadow-lg">
              {averageRating > 0
                ? `${displayRating} (${reviewCount} review${reviewCount === 1 ? "" : "s"})`
                : "New listing"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-extrabold text-white">
            <span className="inline-flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1d9bf0]">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
              Claimed
            </span>
            {categoryName && (
              <>
                <span className="text-white/70">•</span>
                <span>{categoryName}</span>
              </>
            )}
            {location && (
              <>
                <span className="text-white/70">•</span>
                <span>{location}</span>
              </>
            )}
          </div>

          {hasHours && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-extrabold">
              <span
                className={`${
                  isOpenToday ? "text-[#30d886]" : "text-white/85"
                }`}
              >
                {isOpenToday ? "Open" : "Hours listed"}
              </span>
              {todayHours && (
                <span className="text-white drop-shadow-lg">{todayHours}</span>
              )}
              <a
                href="#business-info"
                className="rounded-full border border-white/45 bg-white/10 px-4 py-2 text-xs font-black text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                See hours
              </a>
            </div>
          )}

          {cleanPhotos.length > 0 && (
            <button
              type="button"
              onClick={onOpenPhotos}
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/20 px-5 text-sm font-black text-white shadow-xl backdrop-blur transition-colors hover:bg-white/30 sm:hidden"
            >
              <ImageIcon className="h-4 w-4" />
              See all {cleanPhotos.length} photos
            </button>
          )}
        </div>
      </div>

      {cleanPhotos.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 z-20 hidden sm:block">
          <div className="mx-auto flex max-w-7xl justify-end px-4 sm:px-6">
            <button
              type="button"
              onClick={onOpenPhotos}
              className="pointer-events-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/20 px-5 text-sm font-black text-white shadow-xl backdrop-blur transition-colors hover:bg-white/30"
            >
              <ImageIcon className="h-4 w-4" />
              See all {cleanPhotos.length} photos
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export function LocalGuideDesign({
  businessName,
  streetAddress,
  city,
  state,
  zipCode,
  categoryName,
  phone,
  website,
  description,
  googlePlaceId,
  hours,
  instagramUrl,
  facebookUrl,
  tiktokUrl,
  photos,
  services,
  aboutStory,
  reviews,
  favoriteMerchantTestimonials,
  heroVariant = "standard",
}: MerchantPageProps) {
  const [copied, setCopied] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fullAddress = formatFullAddress(streetAddress, city, state, zipCode);
  const location = [city, state].filter(Boolean).join(", ");
  const directionsUrl = getGoogleMapsDirectionsUrl(
    businessName,
    streetAddress,
    city,
    state,
    zipCode,
    googlePlaceId,
  );
  const cleanPhotos = (photos || []).filter(Boolean);
  const heroPhoto = cleanPhotos[0] || null;
  const galleryPhotos = cleanPhotos.slice(0, 5);
  const serviceItems = (services || []).filter((service) =>
    service.name?.trim(),
  );
  const hoursRows = dayRows
    .map((day) => ({
      ...day,
      value: hours?.[day.key] ? formatHoursDisplay(hours[day.key]) : null,
    }))
    .filter((row) => row.value);
  const hasOpenHours = hoursRows.some(
    (row) => row.value && row.value.toLowerCase() !== "closed",
  );
  const todayKey =
    dayRows[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].key;
  const todayHours = hours?.[todayKey]
    ? formatHoursDisplay(hours[todayKey])
    : null;
  const isOpenToday = Boolean(
    todayHours && todayHours.toLowerCase() !== "closed",
  );
  const websiteHref = website
    ? website.startsWith("http")
      ? website
      : `https://${website}`
    : null;
  const reviewCards = useMemo(() => {
    const merchantReviews =
      reviews?.map((review) => ({
        id: review.id,
        name: getReviewerName(review),
        avatar: review.reviewerPhotoUrl,
        content: review.content,
        rating: review.rating || 5,
        createdAt: review.createdAt,
        photos: review.photos,
        label: "Customer review",
      })) || [];

    const nominations =
      favoriteMerchantTestimonials?.map((testimonial) => ({
        id: testimonial.id,
        name: getTestimonialName(testimonial),
        avatar: testimonial.memberPhotoUrl,
        content: testimonial.content,
        rating: 5,
        createdAt: testimonial.createdAt,
        photos: testimonial.photos,
        label: "Favorite merchant pick",
      })) || [];

    return [...merchantReviews, ...nominations];
  }, [reviews, favoriteMerchantTestimonials]);
  const reviewCount = reviewCards.length;
  const averageRating =
    reviewCount > 0
      ? reviewCards.reduce((sum, review) => sum + review.rating, 0) /
        reviewCount
      : 0;
  const displayRating = averageRating > 0 ? averageRating.toFixed(1) : "New";
  const hasHours = hoursRows.length > 0;
  const hasPhotos = galleryPhotos.length > 0;
  const hasServices = serviceItems.length > 0;
  const hasReviews = reviewCount > 0;
  const summaryCardCount = [
    fullAddress || location,
    hasHours,
    phone,
    categoryName,
    hasServices,
  ].filter(Boolean).length;
  const summaryGridClass =
    summaryCardCount >= 5
      ? "lg:grid-cols-5"
      : summaryCardCount === 4
        ? "lg:grid-cols-4"
        : "lg:grid-cols-3";
  const overviewFeatures = hasServices
    ? serviceItems.slice(0, 4).map((service) => service.name)
    : [];
  const actionButtonClass =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition-all";
  const contentContainerClass =
    heroVariant === "photo-strip" ? "max-w-7xl" : "max-w-[1540px]";

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: businessName, url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const openLightbox = (index = 0) => {
    if (cleanPhotos.length === 0) return;
    setLightboxIndex(Math.min(Math.max(index, 0), cleanPhotos.length - 1));
  };
  const closeLightbox = () => setLightboxIndex(null);
  const showPreviousPhoto = () => {
    setLightboxIndex((current) =>
      current === null
        ? current
        : (current - 1 + cleanPhotos.length) % cleanPhotos.length,
    );
  };
  const showNextPhoto = () => {
    setLightboxIndex((current) =>
      current === null ? current : (current + 1) % cleanPhotos.length,
    );
  };
  const lightboxPhoto =
    lightboxIndex !== null ? cleanPhotos[lightboxIndex] : null;

  useEffect(() => {
    if (lightboxIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxIndex(null);
      }
      if (event.key === "ArrowLeft" && cleanPhotos.length > 1) {
        setLightboxIndex(
          (current) =>
            current !== null
              ? (current - 1 + cleanPhotos.length) % cleanPhotos.length
              : current,
        );
      }
      if (event.key === "ArrowRight" && cleanPhotos.length > 1) {
        setLightboxIndex(
          (current) =>
            current !== null ? (current + 1) % cleanPhotos.length : current,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex, cleanPhotos.length]);

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900">
      {heroVariant === "photo-strip" ? (
        <PhotoStripHero
          businessName={businessName}
          categoryName={categoryName}
          cleanPhotos={cleanPhotos}
          location={location}
          displayRating={displayRating}
          averageRating={averageRating}
          reviewCount={reviewCount}
          hasHours={hasHours}
          isOpenToday={isOpenToday}
          todayHours={todayHours}
          onOpenPhotos={() => openLightbox(0)}
        />
      ) : (
        <section className="relative overflow-hidden bg-[#061B2D] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_18%,rgba(37,99,235,0.34),transparent_30%),linear-gradient(120deg,#061B2D_0%,#08253D_54%,#071827_100%)]" />
          <div
            className={`relative mx-auto grid max-w-[1600px] ${
              heroPhoto
                ? "min-h-[360px] lg:grid-cols-[0.95fr_0.85fr]"
                : "min-h-[320px]"
            }`}
          >
            <div className="relative z-10 flex max-w-4xl flex-col justify-center px-5 py-10 sm:px-8 lg:px-12">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-lg backdrop-blur">
                <Award className="h-4 w-4 fill-white/15" />
                Featured local place
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-normal sm:text-5xl">
                {businessName}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-white/90">
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-lg font-black">{displayRating}</span>
                  {averageRating > 0 && <Stars rating={averageRating} />}
                </span>
                {reviewCount > 0 && <span>({reviewCount} reviews)</span>}
                {categoryName && (
                  <>
                    <span className="text-white/40">/</span>
                    <span>{categoryName}</span>
                  </>
                )}
                {location && (
                  <>
                    <span className="text-white/40">/</span>
                    <span>{location}</span>
                  </>
                )}
              </div>

              {hasHours && (
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold">
                  <span
                    className={`inline-flex items-center gap-2 ${
                      hasOpenHours ? "text-[#22C55E]" : "text-white/75"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        hasOpenHours ? "bg-[#22C55E]" : "bg-white/40"
                      }`}
                    />
                    {hasOpenHours ? "Open today" : "Hours listed"}
                  </span>
                  {todayHours && (
                    <>
                      <span className="text-white/35">/</span>
                      <span className="text-white/80">{todayHours}</span>
                    </>
                  )}
                </div>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className={`${actionButtonClass} bg-[#2563EB] text-white shadow-xl shadow-[#2563EB]/30 hover:bg-[#1D4ED8]`}
                  >
                    <Phone className="h-4 w-4 fill-white/10" />
                    View Phone Number
                  </a>
                )}
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${actionButtonClass} border border-white/20 bg-white/10 text-white hover:bg-white/15`}
                >
                  <Navigation className="h-4 w-4" />
                  Directions
                </a>
                {websiteHref && (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${actionButtonClass} border border-white/20 bg-white/10 text-white hover:bg-white/15`}
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleShare}
                  className={`${actionButtonClass} border border-white/20 bg-white/10 text-white hover:bg-white/15`}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Heart className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Save"}
                </button>
              </div>
            </div>

            {heroPhoto && (
              <div
                className="relative min-h-[260px] overflow-hidden lg:min-h-full"
                style={{
                  clipPath: "polygon(10% 0, 100% 0, 100% 100%, 0 100%)",
                }}
              >
                <img
                  src={heroPhoto}
                  alt={businessName}
                  className="h-full min-h-[260px] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-black/5 via-transparent to-[#061B2D]/35" />
              </div>
            )}
          </div>
        </section>
      )}

      <div
        className={`relative z-20 mx-auto ${contentContainerClass} px-4 sm:px-6 ${
          heroVariant === "photo-strip" ? "mt-0" : "-mt-12"
        }`}
      >
        <div
          className={`grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 md:grid-cols-2 ${summaryGridClass}`}
        >
          {(fullAddress || location) && (
            <div className="flex gap-3 border-b border-slate-100 p-5 lg:border-b-0 lg:border-r">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#2563EB]" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
                  Address
                </p>
                <p className="mt-1 text-sm font-bold leading-snug">
                  {fullAddress || location}
                </p>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#2563EB]"
                >
                  View on map
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}

          {hasHours && (
            <div className="flex gap-3 border-b border-slate-100 p-5 lg:border-b-0 lg:border-r">
              <Clock className="mt-1 h-5 w-5 shrink-0 text-[#2563EB]" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
                  Hours
                </p>
                <p className="mt-1 text-sm font-bold">
                  {hasOpenHours ? "Open today" : "Hours listed"}
                </p>
                {todayHours && (
                  <p className="mt-1 text-xs text-slate-600">{todayHours}</p>
                )}
              </div>
            </div>
          )}

          {phone && (
            <div className="flex gap-3 border-b border-slate-100 p-5 lg:border-b-0 lg:border-r">
              <Phone className="mt-1 h-5 w-5 shrink-0 text-[#2563EB]" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
                  Phone
                </p>
                <p className="mt-1 text-sm font-bold">
                  {formatPhoneNumber(phone)}
                </p>
                <a
                  href={`tel:${phone}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#2563EB]"
                >
                  Call business
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}

          {categoryName && (
            <div className="flex gap-3 border-b border-slate-100 p-5 md:border-b-0 lg:border-r">
              <Tag className="mt-1 h-5 w-5 shrink-0 text-[#2563EB]" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
                  Category
                </p>
                <p className="mt-1 text-sm font-bold">{categoryName}</p>
                <p className="mt-1 text-xs text-slate-600">Community partner</p>
              </div>
            </div>
          )}

          {hasServices && (
            <div className="flex gap-3 p-5">
              <Utensils className="mt-1 h-5 w-5 shrink-0 text-[#2563EB]" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
                  Menu
                </p>
                <p className="mt-1 text-sm font-bold">
                  {serviceItems.length} items
                </p>
                <a
                  href="#services"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#2563EB]"
                >
                  View services
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <main
        className={`mx-auto grid ${contentContainerClass} grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]`}
      >
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-normal text-slate-950">
              Overview
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
              {description ||
                aboutStory ||
                `${businessName} is a local business${location ? ` in ${location}` : ""}. Check back for more details, photos, and community reviews.`}
            </p>
            {aboutStory && description && (
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
                {aboutStory}
              </p>
            )}

            {overviewFeatures.length > 0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {overviewFeatures.map((feature, index) => {
                  const icons = [Sparkles, Camera, Navigation, CalendarDays];
                  const Icon = icons[index % icons.length];
                  return (
                    <div
                      key={feature}
                      className="flex min-h-[64px] items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <Icon className="h-5 w-5 shrink-0 text-[#2563EB]" />
                      <span className="text-sm font-bold text-slate-700">
                        {feature}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {hasPhotos && (
            <section
              id="photos"
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-3 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black tracking-normal text-slate-950">
                  Photo Gallery
                </h2>
                <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {cleanPhotos.length} photos
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {galleryPhotos.map((photo, index) => (
                  <button
                    type="button"
                    key={photo}
                    onClick={() => openLightbox(index)}
                    className="group relative h-40 overflow-hidden rounded-md bg-slate-100 sm:h-48 lg:h-52"
                  >
                    <img
                      src={photo}
                      alt={`${businessName} gallery ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {index === 4 && cleanPhotos.length > 5 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/65 text-white">
                        <ImageIcon className="mb-2 h-6 w-6" />
                        <span className="text-sm font-black">
                          {cleanPhotos.length - 4}+ photos
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {hasServices && (
            <section
              id="services"
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black tracking-normal text-slate-950">
                  Services & Menu
                </h2>
                <Utensils className="h-5 w-5 text-[#2563EB]" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {serviceItems.map((service, index) => (
                  <div
                    key={`${service.name}-${index}`}
                    className="rounded-md border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-black text-slate-950">
                        {service.name}
                      </h3>
                      {service.price && (
                        <span className="shrink-0 rounded bg-white px-2 py-1 text-sm font-black text-[#2563EB]">
                          {service.price}
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {service.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {hasReviews && (
            <section
              id="reviews"
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-normal text-slate-950">
                    Reviews
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Community notes and favorite merchant nominations.
                  </p>
                </div>
                {reviewCount > 0 && (
                  <a
                    href="#reviews"
                    className="text-sm font-bold text-[#2563EB]"
                  >
                    View all {reviewCount} reviews
                  </a>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-[240px_1fr]">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
                  <div className="text-5xl font-black text-slate-950">
                    {averageRating > 0 ? averageRating.toFixed(1) : "--"}
                  </div>
                  <div className="mt-2">
                    <Stars rating={averageRating || 0} size="w-5 h-5" />
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    {reviewCount > 0
                      ? `${reviewCount} reviews`
                      : "No reviews yet"}
                  </p>
                  <div className="mt-5 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviewCards.filter(
                        (review) => Math.round(review.rating) === star,
                      ).length;
                      const width =
                        reviewCount > 0
                          ? `${(count / reviewCount) * 100}%`
                          : "0%";
                      return (
                        <div
                          key={star}
                          className="grid grid-cols-[24px_1fr_24px] items-center gap-2 text-xs text-slate-500"
                        >
                          <span>{star}</span>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-[#F7B500]"
                              style={{ width }}
                            />
                          </div>
                          <span className="text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  {reviewCards.length > 0 ? (
                    reviewCards.slice(0, 3).map((review) => (
                      <article
                        key={review.id}
                        className="rounded-md border border-slate-200 p-5"
                      >
                        <div className="flex items-start gap-3">
                          {review.avatar ? (
                            <img
                              src={review.avatar}
                              alt={review.name}
                              className="h-11 w-11 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0F172A] text-sm font-black text-white">
                              {initialsFor(review.name)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <h3 className="font-black text-slate-950">
                                {review.name}
                              </h3>
                              <span className="text-sm text-slate-400">/</span>
                              <span className="text-sm text-slate-500">
                                {review.label}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Stars rating={review.rating} />
                              <span className="text-xs font-semibold text-slate-500">
                                {formatReviewDate(review.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-700">
                          {review.content}
                        </p>
                        {review.photos.length > 0 && (
                          <div className="mt-4 flex gap-2 overflow-x-auto">
                            {review.photos.slice(0, 3).map((photo, index) => (
                              <img
                                key={photo}
                                src={photo}
                                alt={`${review.name} review ${index + 1}`}
                                className="h-20 w-24 shrink-0 rounded-md object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </article>
                    ))
                  ) : (
                    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-center">
                      <Star className="mb-3 h-9 w-9 text-slate-400" />
                      <p className="font-bold text-slate-700">No reviews yet</p>
                      <p className="mt-1 max-w-sm text-sm text-slate-500">
                        Customer reviews and favorite merchant nominations will
                        appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="relative h-52">
              <MapPlaceholder />
              {(googlePlaceId || fullAddress || location) && (
                <GoogleMapEmbed
                  businessName={businessName}
                  streetAddress={streetAddress}
                  city={city}
                  state={state}
                  zipCode={zipCode}
                  googlePlaceId={googlePlaceId}
                  className="absolute inset-0"
                  height="100%"
                  mapStyle="cool"
                />
              )}
            </div>
            <div className="space-y-3 p-4">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#2563EB] px-4 text-sm font-black text-white shadow-lg shadow-[#2563EB]/20 hover:bg-[#1D4ED8]"
                >
                  <Phone className="h-4 w-4 fill-white/10" />
                  View Phone Number
                </a>
              )}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-bold text-slate-700 hover:border-[#2563EB]/40 hover:text-[#2563EB]"
                >
                  <Navigation className="h-4 w-4" />
                  Directions
                </a>
                {websiteHref ? (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-bold text-slate-700 hover:border-[#2563EB]/40 hover:text-[#2563EB]"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-bold text-slate-700 hover:border-[#2563EB]/40 hover:text-[#2563EB]"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                )}
              </div>
              {hasHours && (
                <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-black">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        hasOpenHours ? "bg-[#22C55E]" : "bg-slate-300"
                      }`}
                    />
                    {hasOpenHours ? "Open today" : "Hours listed"}
                  </div>
                  {todayHours && (
                    <p className="mt-1 text-xs text-slate-500">{todayHours}</p>
                  )}
                </div>
              )}
              {fullAddress && (
                <div className="flex gap-3 pt-1 text-sm font-semibold text-slate-700">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />
                  <span>{fullAddress}</span>
                </div>
              )}
            </div>
          </section>

          <section
            id="business-info"
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-black text-slate-950">
              Business Information
            </h2>
            <div className="mt-2">
              <DetailRow label="Business Name" value={businessName} />
              <DetailRow
                label="Categories"
                value={categoryName || "Local business"}
              />
              {(fullAddress || location) && (
                <DetailRow
                  label="Address"
                  value={fullAddress || location}
                  href={directionsUrl}
                />
              )}
              {phone && (
                <DetailRow
                  label="Phone"
                  value={formatPhoneNumber(phone)}
                  href={`tel:${phone}`}
                />
              )}
              {websiteHref && (
                <DetailRow
                  label="Website"
                  value={
                    <span className="inline-flex min-w-0 items-center gap-1 text-[#2563EB]">
                      <span className="truncate">
                        {formatWebsiteLabel(website || "")}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </span>
                  }
                  href={websiteHref}
                />
              )}
              {hoursRows.length > 0 && (
                <div className="border-b border-slate-100 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Hours
                  </span>
                  <div className="mt-2 space-y-1.5">
                    {hoursRows.slice(0, 4).map((row) => (
                      <div
                        key={row.key}
                        className="grid grid-cols-[42px_1fr] gap-2 text-xs font-semibold text-slate-700"
                      >
                        <span className="text-slate-500">{row.short}</span>
                        <span>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {serviceItems.length > 0 && (
                <DetailRow
                  label="Features"
                  value={
                    <span className="flex flex-wrap gap-2">
                      {serviceItems.slice(0, 4).map((service) => (
                        <span
                          key={service.name}
                          className="rounded bg-[#EEF4FF] px-2 py-1 text-xs text-[#2563EB]"
                        >
                          {service.name}
                        </span>
                      ))}
                    </span>
                  }
                />
              )}
            </div>

            {(instagramUrl || facebookUrl || tiktokUrl) && (
              <div className="mt-4 flex items-center gap-3">
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-md bg-[#2563EB] text-white"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-md bg-[#DB2777] text-white"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white"
                    aria-label="TikTok"
                  >
                    <span className="text-sm font-black">Tt</span>
                  </a>
                )}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-lg bg-[#061B2D] p-5 text-white shadow-xl shadow-slate-900/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Love this place?</h2>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Add a review to share your experience with other local
                  customers.
                </p>
              </div>
              <Star className="h-12 w-12 text-[#0EA5E9]/40" />
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#2563EB] px-4 text-sm font-black text-white hover:bg-[#1D4ED8]"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied Page Link" : "Share This Page"}
            </button>
          </section>
        </aside>
      </main>

      {lightboxPhoto && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white"
          role="dialog"
          aria-modal="true"
          aria-label={`${businessName} photo gallery`}
          onClick={closeLightbox}
        >
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{businessName}</p>
              <p className="text-xs font-semibold text-white/60">
                {lightboxIndex + 1} of {cleanPhotos.length}
              </p>
            </div>
            <button
              type="button"
              onClick={closeLightbox}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close photo gallery"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
            {cleanPhotos.length > 1 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPreviousPhoto();
                }}
                className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-6"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <div
              className="relative h-[72vh] w-full max-w-6xl"
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src={lightboxPhoto}
                alt={`${businessName} ${lightboxIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {cleanPhotos.length > 1 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNextPhoto();
                }}
                className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {cleanPhotos.length > 1 && (
            <div
              className="border-t border-white/10 px-4 py-3 sm:px-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto pb-1">
                {cleanPhotos.map((photo, index) => (
                  <button
                    type="button"
                    key={photo}
                    onClick={() => setLightboxIndex(index)}
                    className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-md border transition-colors ${
                      index === lightboxIndex
                        ? "border-white"
                        : "border-white/20 opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`Show photo ${index + 1}`}
                  >
                    <Image
                      src={photo}
                      alt={`${businessName} thumbnail ${index + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md gap-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#2563EB] text-sm font-black text-white"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
          )}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-black text-slate-700"
          >
            <Navigation className="h-4 w-4" />
            Directions
          </a>
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  );
}
