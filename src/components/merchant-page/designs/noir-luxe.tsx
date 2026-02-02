"use client";

/**
 * DESIGN 3: "Noir Luxe"
 *
 * Premium dark design with gold accents.
 * Elegant serif typography, subtle textures.
 * Sophisticated, high-end atmosphere.
 */

import { MapPin, Phone, Globe, Share2, Star, Crown } from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils";
import { extractVimeoId, getVimeoEmbedUrl } from "@/lib/vimeo";
import { useState } from "react";

interface MerchantPageProps {
  businessName: string;
  city?: string | null;
  state?: string | null;
  logoUrl?: string | null;
  categoryName?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  vimeoUrl?: string | null;
}

export function NoirLuxeDesign({
  businessName,
  city,
  state,
  logoUrl,
  categoryName,
  phone,
  website,
  description,
  vimeoUrl,
}: MerchantPageProps) {
  const [copied, setCopied] = useState(false);
  const location = [city, state].filter(Boolean).join(", ");
  const videoId = vimeoUrl ? extractVimeoId(vimeoUrl) : null;

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
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Subtle noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Gold accent lines */}
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A962] to-transparent opacity-50" />
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A962] to-transparent opacity-50" />

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <header className="px-6 py-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-[#C9A962]" />
              <span className="text-xs tracking-[0.25em] uppercase text-white/40">Local City Places</span>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-white/40 hover:text-[#C9A962] transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? "Copied" : "Share"}
            </button>
          </div>
        </header>

        {/* Contact Bar */}
        <div className="border-y border-[#C9A962]/20 bg-[#0A0A0A]/50">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-3 hover:text-[#C9A962] transition-colors group">
                  <Phone className="w-4 h-4 text-[#C9A962]" />
                  <div>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[#C9A962]/60">Telephone</p>
                    <p className="text-sm group-hover:text-[#C9A962]">{formatPhoneNumber(phone)}</p>
                  </div>
                </a>
              )}
              {phone && website && <div className="w-px h-8 bg-[#C9A962]/20 hidden sm:block" />}
              {website && (
                <a
                  href={website.startsWith("http") ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-[#C9A962] transition-colors group"
                >
                  <Globe className="w-4 h-4 text-[#C9A962]" />
                  <div>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[#C9A962]/60">Website</p>
                    <p className="text-sm group-hover:text-[#C9A962] truncate max-w-[150px]">{website.replace(/^https?:\/\//, "")}</p>
                  </div>
                </a>
              )}
              {(phone || website) && location && <div className="w-px h-8 bg-[#C9A962]/20 hidden sm:block" />}
              {location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#C9A962]" />
                  <div>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[#C9A962]/60">Location</p>
                    <p className="text-sm">{location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="px-6 py-12 lg:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left - Logo with ornate frame */}
              <div className="flex justify-center lg:justify-start">
                <div className="relative">
                  {/* Decorative corners */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-[#C9A962]/50" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-[#C9A962]/50" />
                  <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-[#C9A962]/50" />
                  <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-[#C9A962]/50" />

                  {/* Logo container */}
                  <div className="w-48 h-48 lg:w-64 lg:h-64 bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#C9A962]/20 flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                    ) : (
                      <span
                        className="text-5xl lg:text-7xl text-[#C9A962]/80"
                        style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
                      >
                        {initials}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right - Business info */}
              <div className="text-center lg:text-left">
                {/* Category */}
                {categoryName && (
                  <div className="mb-6">
                    <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-[#C9A962]">
                      <span className="w-8 h-px bg-[#C9A962]/50" />
                      {categoryName}
                      <span className="w-8 h-px bg-[#C9A962]/50" />
                    </span>
                  </div>
                )}

                {/* Business name */}
                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-light mb-4 leading-tight"
                  style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
                >
                  {businessName}
                </h1>

                {/* Location */}
                {location && (
                  <div className="flex items-center justify-center lg:justify-start gap-3 text-white/50 mb-8">
                    <MapPin className="w-4 h-4 text-[#C9A962]" />
                    <span className="text-sm tracking-wider">{location}</span>
                  </div>
                )}

                {/* Description */}
                {description && (
                  <p className="text-white/60 leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0 text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {description}
                  </p>
                )}

                {/* CTAs */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="group relative inline-flex items-center gap-3 px-8 py-4 overflow-hidden"
                    >
                      {/* Gold gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#C9A962] via-[#E5C97B] to-[#C9A962] transition-transform group-hover:scale-105" />
                      <div className="relative flex items-center gap-3 text-black">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm tracking-wider font-medium">{formatPhoneNumber(phone)}</span>
                      </div>
                    </a>
                  )}
                  {website && (
                    <a
                      href={website.startsWith("http") ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-8 py-4 border border-[#C9A962]/50 hover:border-[#C9A962] hover:bg-[#C9A962]/10 transition-all"
                    >
                      <Globe className="w-4 h-4 text-[#C9A962]" />
                      <span className="text-sm tracking-wider">Visit Website</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 py-8">
          <div className="w-24 h-px bg-gradient-to-r from-transparent to-[#C9A962]/30" />
          <div className="w-2 h-2 rotate-45 border border-[#C9A962]/50" />
          <div className="w-24 h-px bg-gradient-to-l from-transparent to-[#C9A962]/30" />
        </div>

        {/* Video Section */}
        {videoId && (
          <div className="px-6 py-8">
            <div className="max-w-5xl mx-auto">
              <div className="relative">
                {/* Outer frame */}
                <div className="absolute -inset-2 border border-[#C9A962]/20" />
                {/* Inner video */}
                <div className="relative aspect-video bg-black">
                  <iframe
                    src={`${getVimeoEmbedUrl(videoId)}?background=0&autoplay=0&title=0&byline=0&portrait=0`}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title="Featured video"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Reviews */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-4 mb-8">
                  <h2
                    className="text-2xl"
                    style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
                  >
                    Guest Reviews
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#C9A962]/30 to-transparent" />
                </div>

                <div className="border border-white/10 p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 border border-[#C9A962]/30 flex items-center justify-center">
                    <Star className="w-6 h-6 text-[#C9A962]/50" />
                  </div>
                  <p className="text-white/40 text-sm tracking-wider mb-2">No reviews yet</p>
                  <p className="text-white/25 text-xs">Be the first to share your experience</p>
                </div>
              </div>

              {/* Contact Sidebar */}
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <h3
                    className="text-xl"
                    style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
                  >
                    Contact
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#C9A962]/30 to-transparent" />
                </div>

                <div className="space-y-6">
                  {phone && (
                    <a href={`tel:${phone}`} className="block group">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-[#C9A962]/60 mb-1">Telephone</p>
                      <p className="text-lg group-hover:text-[#C9A962] transition-colors">{formatPhoneNumber(phone)}</p>
                    </a>
                  )}

                  {website && (
                    <a
                      href={website.startsWith("http") ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <p className="text-[10px] tracking-[0.2em] uppercase text-[#C9A962]/60 mb-1">Website</p>
                      <p className="text-lg group-hover:text-[#C9A962] transition-colors break-all">
                        {website.replace(/^https?:\/\//, "")}
                      </p>
                    </a>
                  )}

                  {location && (
                    <div>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-[#C9A962]/60 mb-1">Location</p>
                      <p className="text-lg">{location}</p>
                    </div>
                  )}
                </div>

                {/* Partner badge */}
                <div className="mt-12 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-[#C9A962]" />
                    <div>
                      <p className="text-sm text-[#C9A962]">Exclusive Partner</p>
                      <p className="text-xs text-white/40">Earn rewards when you visit</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-white/5">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-xs tracking-wider text-white/30">
              © Local City Places · Curated Local Excellence
            </p>
          </div>
        </footer>
      </div>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50">
        <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
        <div className="bg-[#0A0A0A]/95 backdrop-blur-lg border-t border-[#C9A962]/20 p-4">
          <div className="flex gap-3">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#C9A962] to-[#E5C97B] text-black font-medium text-sm tracking-wider"
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
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#C9A962]/50 text-sm tracking-wider"
              >
                <Globe className="w-4 h-4" />
                Website
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="h-24 lg:hidden" />
    </div>
  );
}
