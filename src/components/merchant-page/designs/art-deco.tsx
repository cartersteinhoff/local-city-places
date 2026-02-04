"use client";

/**
 * DESIGN 6: "Art Deco Glam"
 *
 * 1920s inspired elegance with geometric patterns.
 * Deep emerald/navy with gold accents.
 * Contact info prominent at top.
 * Vertical video in ornate frame.
 */

import { Poiret_One, Raleway } from "next/font/google";
import { MapPin, Phone, Globe, Share2, Gem, Navigation, Clock, Instagram, Facebook, Image, Sparkles } from "lucide-react";
import { formatPhoneNumber, formatHoursDisplay } from "@/lib/utils";

const poiretOne = Poiret_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const raleway = Raleway({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  display: "swap",
});
import { extractVimeoId, getVimeoEmbedUrl } from "@/lib/vimeo";
import { useState } from "react";
import { GoogleMapEmbed, getGoogleMapsDirectionsUrl, formatFullAddress } from "../google-map-embed";

interface MerchantPageProps {
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
  // Extended business info
  hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  } | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  photos?: string[] | null;
  services?: { name: string; description?: string; price?: string }[] | null;
  aboutStory?: string | null;
}

export function ArtDecoDesign({
  businessName,
  streetAddress,
  city,
  state,
  zipCode,
  logoUrl,
  categoryName,
  phone,
  website,
  description,
  vimeoUrl,
  googlePlaceId,
  hours,
  instagramUrl,
  facebookUrl,
  tiktokUrl,
  photos,
  services,
  aboutStory,
}: MerchantPageProps) {
  const [copied, setCopied] = useState(false);
  const location = [city, state].filter(Boolean).join(", ");
  const fullAddress = formatFullAddress(streetAddress, city, state, zipCode);
  const videoId = vimeoUrl ? extractVimeoId(vimeoUrl) : null;
  const directionsUrl = getGoogleMapsDirectionsUrl(businessName, streetAddress, city, state, zipCode, googlePlaceId);

  const initials = businessName
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: businessName, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1F22] text-[#F5F1E6]">
      {/* Art deco pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Gold lines */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

      {/* Header */}
      <header className="relative border-b border-[#D4AF37]/30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#D4AF37] flex items-center justify-center rotate-45">
              <Gem className="w-5 h-5 text-[#D4AF37] -rotate-45" />
            </div>
            <span className="text-xs tracking-[0.3em] uppercase text-[#D4AF37]/70 hidden sm:block">Local City Places</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#D4AF37]/70 hover:text-[#D4AF37] transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </header>

      {/* Section Navigation */}
      <nav className="bg-[#0D1F22]/95 border-b border-[#D4AF37]/20 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-1 sm:gap-2 py-2 overflow-x-auto scrollbar-hide">
            {aboutStory && (
              <a href="#story" className={`px-3 py-2 text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all whitespace-nowrap cursor-pointer ${raleway.className}`}>
                Story
              </a>
            )}
            {hours && Object.values(hours).some(Boolean) && (
              <a href="#hours" className={`px-3 py-2 text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all whitespace-nowrap cursor-pointer ${raleway.className}`}>
                Hours
              </a>
            )}
            {services && services.length > 0 && (
              <a href="#services" className={`px-3 py-2 text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all whitespace-nowrap cursor-pointer ${raleway.className}`}>
                Services
              </a>
            )}
            {photos && photos.length > 0 && (
              <a href="#gallery" className={`px-3 py-2 text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all whitespace-nowrap cursor-pointer ${raleway.className}`}>
                Gallery
              </a>
            )}
{(googlePlaceId || city) && (
              <a href="#location" className={`px-3 py-2 text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all whitespace-nowrap cursor-pointer ${raleway.className}`}>
                Location
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Contact Strip - Gold Bar */}
      <div className="bg-gradient-to-r from-[#D4AF37] via-[#E5C97B] to-[#D4AF37] text-[#0D1F22]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Phone className="w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-70">Telephone</p>
                  <p className={`font-semibold ${raleway.className}`}>{formatPhoneNumber(phone)}</p>
                </div>
              </a>
            )}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Globe className="w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-70">Website</p>
                  <p className={`font-semibold ${raleway.className}`}>
                    {website.replace(/^https?:\/\//, "")}
                  </p>
                </div>
              </a>
            )}
            {(fullAddress || location) && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <MapPin className="w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-70">Location</p>
                  <p className={`font-semibold whitespace-nowrap ${raleway.className}`}>
                    {[streetAddress, city, state, zipCode].filter(Boolean).join(", ") || location}
                  </p>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Business Info */}
            <div className="text-center lg:text-left">
              {/* Logo with art deco frame */}
              {logoUrl && (
                <div className="inline-block mb-8">
                  <div className="relative">
                    {/* Outer glow */}
                    <div className="absolute inset-0 bg-[#D4AF37]/20 blur-xl" />

                    {/* Diamond corner accents */}
                    <div className="absolute -top-3 -left-3 w-4 h-4 bg-[#D4AF37] rotate-45" />
                    <div className="absolute -top-3 -right-3 w-4 h-4 bg-[#D4AF37] rotate-45" />
                    <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-[#D4AF37] rotate-45" />
                    <div className="absolute -bottom-3 -right-3 w-4 h-4 bg-[#D4AF37] rotate-45" />

                    {/* Ornate frame lines */}
                    <div className="absolute -top-1 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                    <div className="absolute -bottom-1 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                    <div className="absolute -left-1 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-[#D4AF37] to-transparent" />
                    <div className="absolute -right-1 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-[#D4AF37] to-transparent" />

                    <div className="relative w-32 h-32 bg-[#0D1F22] border-2 border-[#D4AF37] flex items-center justify-center overflow-hidden">
                      <img src={logoUrl} alt={businessName} className="w-full h-full object-contain p-2" />
                    </div>
                  </div>
                </div>
              )}

              {/* Category */}
              {categoryName && (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-3 text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]">
                    <span className="w-8 h-px bg-[#D4AF37]/50" />
                    {categoryName}
                    <span className="w-8 h-px bg-[#D4AF37]/50" />
                  </span>
                </div>
              )}

              {/* Business Name with Art Deco styling */}
              <div className="relative mb-8">
                {/* Decorative line above */}
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                  <div className="w-2 h-2 bg-[#D4AF37] rotate-45" />
                  <div className="w-16 h-px bg-gradient-to-r from-[#D4AF37] to-transparent" />
                </div>

                <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-light leading-tight bg-gradient-to-r from-[#F5F1E6] via-[#D4AF37] to-[#F5F1E6] bg-clip-text text-transparent ${poiretOne.className}`}>
                  {businessName}
                </h1>

                {/* Decorative line below */}
                <div className="flex items-center justify-center lg:justify-start gap-3 mt-4">
                  <div className="w-24 h-px bg-gradient-to-r from-[#D4AF37] to-transparent" />
                  <div className="w-2 h-2 bg-[#D4AF37] rotate-45" />
                  <div className="w-12 h-px bg-gradient-to-l from-[#D4AF37] to-transparent" />
                </div>
              </div>

              {/* Description */}
              {description && (
                <p className={`text-lg text-[#F5F1E6]/70 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-10 ${raleway.className}`}>
                  {description}
                </p>
              )}

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#D4AF37] via-[#E5C97B] to-[#D4AF37] text-[#0D1F22] font-medium cursor-pointer"
                  >
                    <Phone className="w-5 h-5" />
                    <span className={poiretOne.className}>Call Now</span>
                  </a>
                )}
                {website && (
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 px-8 py-4 border border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
                  >
                    <Globe className="w-5 h-5 text-[#D4AF37]" />
                    <span className={poiretOne.className}>Visit Website</span>
                  </a>
                )}
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 px-8 py-4 border border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
                >
                  <Navigation className="w-5 h-5 text-[#D4AF37]" />
                  <span className={poiretOne.className}>Directions</span>
                </a>
              </div>
            </div>

            {/* Right - Vertical Video with Art Deco Frame */}
            {videoId && (
              <div className="flex justify-center">
                <div className="relative">
                  {/* Outer decorative frame */}
                  <div className="absolute -inset-4 border border-[#D4AF37]/30" />
                  <div className="absolute -inset-6 border border-[#D4AF37]/20" />

                  {/* Corner ornaments */}
                  <div className="absolute -top-8 -left-8 w-12 h-12 flex items-center justify-center">
                    <div className="w-4 h-4 bg-[#D4AF37] rotate-45" />
                  </div>
                  <div className="absolute -top-8 -right-8 w-12 h-12 flex items-center justify-center">
                    <div className="w-4 h-4 bg-[#D4AF37] rotate-45" />
                  </div>
                  <div className="absolute -bottom-8 -left-8 w-12 h-12 flex items-center justify-center">
                    <div className="w-4 h-4 bg-[#D4AF37] rotate-45" />
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-12 h-12 flex items-center justify-center">
                    <div className="w-4 h-4 bg-[#D4AF37] rotate-45" />
                  </div>

                  {/* Video container */}
                  <div
                    className="relative w-[260px] sm:w-[300px] border-2 border-[#D4AF37] bg-black overflow-hidden"
                    style={{ aspectRatio: '9/16' }}
                  >
                    <iframe
                      src={`${getVimeoEmbedUrl(videoId)}?background=0&autoplay=0&title=0&byline=0&portrait=0`}
                      className="absolute inset-0 w-full h-full"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title="Featured video"
                    />
                  </div>

                  {/* Label */}
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center">
                    <p className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]/70">Merchant Tracks</p>
                  </div>
                </div>
              </div>
            )}

{/* No placeholder when no video - keep it clean */}
          </div>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
          <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
          <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
        </div>

        {/* Map Section - only show if we have location data */}
        {(googlePlaceId || fullAddress) && (
          <div id="location" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h2 className={`text-2xl ${poiretOne.className}`}>
                  Our Location
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
              </div>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#D4AF37] hover:text-[#E5C97B] transition-colors cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
              </a>
            </div>
            {fullAddress && (
              <p className={`text-[#F5F1E6]/70 mb-6 ${raleway.className}`}>{fullAddress}</p>
            )}
            <div className="relative">
              {/* Art deco frame for map */}
              <div className="absolute -inset-2 border border-[#D4AF37]/30" />
              <GoogleMapEmbed
                businessName={businessName}
                streetAddress={streetAddress}
                city={city}
                state={state}
                zipCode={zipCode}
                googlePlaceId={googlePlaceId}
                height="300px"
                mapStyle="cool"
              />
            </div>
          </div>
        )}

        {/* About/Story Section */}
        {aboutStory && (
          <>
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
              <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
              <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
            </div>
            <div id="story" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
              <div className="flex items-center gap-4 mb-8">
                <h2 className={`text-2xl ${poiretOne.className}`}>Our Story</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
              </div>
              <div className="border border-[#D4AF37]/20 p-8">
                <p className={`text-[#F5F1E6]/80 leading-relaxed whitespace-pre-line ${raleway.className}`}>
                  {aboutStory}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Hours Section */}
        {hours && Object.values(hours).some(Boolean) && (
          <>
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
              <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
              <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
            </div>
            <div id="hours" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
              <div className="flex items-center gap-4 mb-8">
                <Clock className="w-6 h-6 text-[#D4AF37]" />
                <h2 className={`text-2xl ${poiretOne.className}`}>Hours of Operation</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4 border border-[#D4AF37]/20 p-8">
                {[
                  { day: "Monday", value: hours.monday },
                  { day: "Tuesday", value: hours.tuesday },
                  { day: "Wednesday", value: hours.wednesday },
                  { day: "Thursday", value: hours.thursday },
                  { day: "Friday", value: hours.friday },
                  { day: "Saturday", value: hours.saturday },
                  { day: "Sunday", value: hours.sunday },
                ].map(({ day, value }) => (
                  <div key={day} className="flex justify-between items-center py-2 border-b border-[#D4AF37]/10 last:border-0">
                    <span className={`text-[#D4AF37] ${raleway.className}`}>{day}</span>
                    <span className={`text-[#F5F1E6]/70 ${raleway.className}`}>{formatHoursDisplay(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Services Section */}
        {services && services.length > 0 && (
          <>
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
              <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
              <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
            </div>
            <div id="services" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
              <div className="flex items-center gap-4 mb-8">
                <Sparkles className="w-6 h-6 text-[#D4AF37]" />
                <h2 className={`text-2xl ${poiretOne.className}`}>Our Services</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service, idx) => (
                  <div key={idx} className="border border-[#D4AF37]/20 p-6 hover:border-[#D4AF37]/40 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`text-lg text-[#D4AF37] ${poiretOne.className}`}>{service.name}</h3>
                      {service.price && (
                        <span className={`text-[#E5C97B] ${raleway.className}`}>{service.price}</span>
                      )}
                    </div>
                    {service.description && (
                      <p className={`text-sm text-[#F5F1E6]/60 ${raleway.className}`}>{service.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Photo Gallery Section */}
        {photos && photos.length > 0 && (
          <>
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
              <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
              <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
            </div>
            <div id="gallery" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
              <div className="flex items-center gap-4 mb-8">
                <Image className="w-6 h-6 text-[#D4AF37]" />
                <h2 className={`text-2xl ${poiretOne.className}`}>Gallery</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square border-2 border-[#D4AF37]/30 overflow-hidden group">
                    <img
                      src={photo}
                      alt={`${businessName} photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Art deco corner accents */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37]" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37]" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]" />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

{/* Reviews Section - will show when reviews data is available */}

        {/* Social Links */}
        {(instagramUrl || facebookUrl || tiktokUrl) && (
          <div className="border-t border-[#D4AF37]/20">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="flex items-center justify-center gap-6">
                <span className={`text-sm text-[#F5F1E6]/50 ${raleway.className}`}>Follow Us</span>
                <div className="flex items-center gap-4">
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 border border-[#D4AF37]/30 flex items-center justify-center hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all cursor-pointer"
                    >
                      <Instagram className="w-5 h-5 text-[#D4AF37]" />
                    </a>
                  )}
                  {facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 border border-[#D4AF37]/30 flex items-center justify-center hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all cursor-pointer"
                    >
                      <Facebook className="w-5 h-5 text-[#D4AF37]" />
                    </a>
                  )}
                  {tiktokUrl && (
                    <a
                      href={tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 border border-[#D4AF37]/30 flex items-center justify-center hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all cursor-pointer"
                    >
                      <svg className="w-5 h-5 text-[#D4AF37]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Partner Section */}
        <div className="border-t border-[#D4AF37]/20">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center gap-4">
              <Gem className="w-6 h-6 text-[#D4AF37]" />
              <div className="text-center">
                <p className={`text-[#D4AF37] font-medium ${poiretOne.className}`}>
                  Exclusive Partner Establishment
                </p>
                <p className="text-[#F5F1E6]/50 text-sm">Earn rewards with every visit</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#D4AF37]/20 px-4 py-6">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-xs tracking-[0.2em] uppercase text-[#F5F1E6]/30">
              © Local City Places · Curated Excellence
            </p>
          </div>
        </footer>
      </div>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-[#0D1F22] to-transparent" />
        <div className="bg-[#0D1F22]/95 backdrop-blur-lg border-t border-[#D4AF37]/30 p-4">
          <div className="flex gap-3">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#D4AF37] to-[#E5C97B] text-[#0D1F22] font-medium"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
            )}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#D4AF37]/50"
              >
                <Globe className="w-4 h-4" />
                Website
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  );
}
