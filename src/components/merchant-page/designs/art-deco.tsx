"use client";

/**
 * DESIGN 6: "Art Deco Glam"
 *
 * 1920s inspired elegance with geometric patterns.
 * Deep emerald/navy with gold accents.
 * Contact info prominent at top.
 * Vertical video in ornate frame.
 */

import { MapPin, Phone, Globe, Share2, Star, Gem, Navigation } from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils";
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
            className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#D4AF37]/70 hover:text-[#D4AF37] transition-colors"
          >
            <Share2 className="w-4 h-4" />
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </header>

      {/* Contact Strip - Gold Bar */}
      <div className="bg-gradient-to-r from-[#D4AF37] via-[#E5C97B] to-[#D4AF37] text-[#0D1F22]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Phone className="w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-70">Telephone</p>
                  <p className="font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>{formatPhoneNumber(phone)}</p>
                </div>
              </a>
            )}
            {phone && website && <div className="w-px h-10 bg-[#0D1F22]/20 hidden sm:block" />}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Globe className="w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-70">Website</p>
                  <p className="font-semibold truncate max-w-[180px]" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {website.replace(/^https?:\/\//, "")}
                  </p>
                </div>
              </a>
            )}
            {(phone || website) && location && <div className="w-px h-10 bg-[#0D1F22]/20 hidden sm:block" />}
            {(fullAddress || location) && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <MapPin className="w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-70">Location</p>
                  {streetAddress && <p className="font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>{streetAddress}</p>}
                  <p className="font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>{[city, state, zipCode].filter(Boolean).join(", ") || location}</p>
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
              <div className="inline-block mb-8">
                <div className="relative">
                  {/* Corner decorations */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-[#D4AF37]" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-[#D4AF37]" />
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-[#D4AF37]" />
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-[#D4AF37]" />

                  <div className="w-28 h-28 bg-[#0D1F22] border border-[#D4AF37]/50 flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                    ) : (
                      <span
                        className="text-4xl text-[#D4AF37]"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {initials}
                      </span>
                    )}
                  </div>
                </div>
              </div>

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

              {/* Business Name */}
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-light mb-6 leading-tight"
                style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
              >
                {businessName}
              </h1>

              {/* Description */}
              {description && (
                <p
                  className="text-lg text-[#F5F1E6]/70 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-10"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
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
                    <span style={{ fontFamily: "'Playfair Display', serif" }}>Call Now</span>
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
                    <span style={{ fontFamily: "'Playfair Display', serif" }}>Visit Website</span>
                  </a>
                )}
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 px-8 py-4 border border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
                >
                  <Navigation className="w-5 h-5 text-[#D4AF37]" />
                  <span style={{ fontFamily: "'Playfair Display', serif" }}>Directions</span>
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
                    <p className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]/70">Featured Presentation</p>
                  </div>
                </div>
              </div>
            )}

            {/* If no video */}
            {!videoId && (
              <div className="hidden lg:flex justify-center">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 border border-[#D4AF37]/30" />
                  <div className="absolute inset-2 border border-[#D4AF37]/20" />
                  <div className="absolute inset-4 flex items-center justify-center">
                    <Gem className="w-16 h-16 text-[#D4AF37]/30" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
          <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
          <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
        </div>

        {/* Map Section */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h2
                className="text-2xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Our Location
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
            </div>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#D4AF37] hover:text-[#E5C97B] transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Get Directions
            </a>
          </div>
          {fullAddress && (
            <p className="text-[#F5F1E6]/70 mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{fullAddress}</p>
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
            />
          </div>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
          <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
          <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
        </div>

        {/* Reviews Section */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            <h2
              className="text-2xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Guest Reviews
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
          </div>

          <div className="border border-[#D4AF37]/20 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6 border border-[#D4AF37]/30 flex items-center justify-center rotate-45">
              <Star className="w-6 h-6 text-[#D4AF37]/40 -rotate-45" />
            </div>
            <p className="text-[#F5F1E6]/50 text-sm tracking-wider mb-2">No reviews yet</p>
            <p className="text-[#F5F1E6]/30 text-xs">Be the first to share your experience</p>
          </div>
        </div>

        {/* Partner Section */}
        <div className="border-t border-[#D4AF37]/20">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center gap-4">
              <Gem className="w-6 h-6 text-[#D4AF37]" />
              <div className="text-center">
                <p className="text-[#D4AF37] font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
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
