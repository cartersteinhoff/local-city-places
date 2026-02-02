"use client";

/**
 * DESIGN 9: "Magazine Editorial"
 *
 * High-end publication style.
 * Sophisticated typography, asymmetric layout.
 * Bold headlines, refined details.
 * Contact prominent, vertical video as feature.
 */

import { MapPin, Phone, Globe, Share2, Star, ArrowUpRight } from "lucide-react";
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

export function MagazineEditorialDesign({
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-black">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span
              className="text-2xl font-black tracking-tighter"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              LCP
            </span>
            <span className="text-[10px] tracking-[0.3em] uppercase text-black/50">Magazine</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-xs font-medium hover:opacity-70 transition-opacity"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </header>

      {/* Contact Strip */}
      <div className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 sm:gap-10">
              {phone && (
                <a href={`tel:${phone}`} className="group flex items-center gap-3 hover:opacity-70 transition-opacity">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">{formatPhoneNumber(phone)}</span>
                </a>
              )}
              {website && (
                <a
                  href={website.startsWith("http") ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 hover:opacity-70 transition-opacity"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium truncate max-w-[150px]">{website.replace(/^https?:\/\//, "")}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-50" />
                </a>
              )}
              {location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">{location}</span>
                </div>
              )}
            </div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-white/50">
              Featured Business
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="max-w-7xl mx-auto">
          {/* Hero Grid */}
          <div className="grid lg:grid-cols-12 min-h-[70vh]">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-7 px-6 py-12 lg:py-20 lg:pr-12 border-r border-black/10">
              {/* Category as large cap */}
              {categoryName && (
                <div className="mb-8">
                  <span
                    className="text-[100px] sm:text-[140px] lg:text-[180px] font-black leading-none text-black/5 uppercase tracking-tighter block"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {categoryName.slice(0, 3)}
                  </span>
                  <span className="text-xs tracking-[0.3em] uppercase text-red-600 font-medium -mt-8 block relative z-10">
                    {categoryName}
                  </span>
                </div>
              )}

              {/* Business Name */}
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-black mb-8 leading-[0.9] tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {businessName}
              </h1>

              {/* Description */}
              {description && (
                <p className="text-xl text-black/60 leading-relaxed max-w-xl mb-10" style={{ fontFamily: "'Libre Baskerville', serif" }}>
                  {description}
                </p>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap gap-4">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Now</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
                {website && (
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-3 px-8 py-4 border-2 border-black hover:bg-black hover:text-white transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Visit Website</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
              </div>

              {/* Article-style layout element */}
              <div className="mt-16 pt-8 border-t border-black/10">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>—</p>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-black/40 mt-1">Est. 2024</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>★</p>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-black/40 mt-1">Featured</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>✓</p>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-black/40 mt-1">Verified</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="lg:col-span-5 bg-black/5 relative flex items-center justify-center p-8 lg:p-12">
              {/* Logo */}
              <div className="absolute top-6 right-6 w-16 h-16 bg-white border border-black/10 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>{initials}</span>
                )}
              </div>

              {/* Vertical Video */}
              {videoId && (
                <div className="relative">
                  {/* Magazine-style caption */}
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
                    <span className="text-[10px] tracking-[0.3em] uppercase text-black/40 whitespace-nowrap">
                      Watch the Story
                    </span>
                  </div>

                  <div
                    className="relative w-[240px] sm:w-[280px] bg-black overflow-hidden shadow-2xl"
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

                  {/* Issue number style */}
                  <div className="absolute -bottom-4 -right-4 bg-red-600 text-white px-3 py-1">
                    <span className="text-xs font-bold">VOL. 1</span>
                  </div>
                </div>
              )}

              {/* If no video */}
              {!videoId && (
                <div className="text-center">
                  <p
                    className="text-[200px] font-black text-black/10 leading-none"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {initials}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section - Magazine style */}
        <div className="border-t border-black">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4">
                <h2
                  className="text-4xl font-black mb-4"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Reader<br />Reviews
                </h2>
                <p className="text-black/50 text-sm">
                  What our community says about this business.
                </p>
              </div>
              <div className="lg:col-span-8">
                <div className="border border-black/10 p-12 text-center">
                  <Star className="w-8 h-8 text-black/20 mx-auto mb-4" />
                  <p className="text-black/40 text-sm mb-1">No reviews yet</p>
                  <p className="text-black/30 text-xs">Be the first to contribute</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Partner Banner */}
        <div className="bg-red-600 text-white">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <div>
              <p className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Local City Places Partner</p>
              <p className="text-white/70 text-sm">Earn rewards with every visit</p>
            </div>
            <span className="hidden sm:block text-xs tracking-[0.2em] uppercase border border-white/30 px-4 py-2">
              Learn More
            </span>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-black px-6 py-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-xs text-black/40">© Local City Places Magazine</p>
            <p className="text-xs text-black/40 tracking-wider">ISSUE 001</p>
          </div>
        </footer>
      </div>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-white border-t border-black p-4">
        <div className="flex gap-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white font-semibold"
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
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-black font-semibold"
            >
              <Globe className="w-4 h-4" />
              Website
            </a>
          )}
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  );
}
