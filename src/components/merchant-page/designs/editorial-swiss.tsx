"use client";

/**
 * DESIGN 1: "Editorial Swiss"
 *
 * Inspired by Swiss/International design principles.
 * Clean, minimal, dramatic typography with lots of whitespace.
 * Razor-sharp grid system, bold sans-serif, understated elegance.
 */

import { MapPin, Phone, Globe, Share2, ArrowUpRight, Star } from "lucide-react";
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

export function EditorialSwissDesign({
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
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Top bar */}
      <div className="border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xs tracking-[0.2em] uppercase text-black/40">Local City Places</span>
          <button
            onClick={handleShare}
            className="text-xs tracking-[0.15em] uppercase hover:text-black/60 transition-colors flex items-center gap-2"
          >
            <Share2 className="w-3 h-3" />
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </div>

      {/* Contact Bar */}
      <div className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
                <Phone className="w-4 h-4" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-60">Phone</p>
                  <p className="text-sm font-medium">{formatPhoneNumber(phone)}</p>
                </div>
              </a>
            )}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:opacity-70 transition-opacity"
              >
                <Globe className="w-4 h-4" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-60">Website</p>
                  <p className="text-sm font-medium truncate max-w-[150px]">{website.replace(/^https?:\/\//, "")}</p>
                </div>
              </a>
            )}
            {location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-60">Location</p>
                  <p className="text-sm font-medium">{location}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-8 py-16 lg:py-24">
          {/* Left column - Main info */}
          <div className="lg:col-span-7 space-y-8">
            {/* Category tag */}
            {categoryName && (
              <div className="inline-block">
                <span className="text-[10px] tracking-[0.3em] uppercase text-black/40 border-l-2 border-black pl-3">
                  {categoryName}
                </span>
              </div>
            )}

            {/* Business name - dramatic typography */}
            <h1
              className="text-5xl sm:text-6xl lg:text-8xl font-light tracking-tight leading-[0.9]"
              style={{ fontFamily: "'Bebas Neue', 'Anton', sans-serif" }}
            >
              {businessName}
            </h1>

            {/* Location */}
            {location && (
              <div className="flex items-center gap-3 text-black/50">
                <div className="w-8 h-px bg-black/20" />
                <MapPin className="w-4 h-4" />
                <span className="text-sm tracking-wide">{location}</span>
              </div>
            )}

            {/* Description */}
            {description && (
              <p className="text-lg text-black/60 leading-relaxed max-w-xl border-l-2 border-black/10 pl-6">
                {description}
              </p>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-4">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="group inline-flex items-center gap-3 bg-black text-white px-8 py-4 hover:bg-black/80 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm tracking-wide">{formatPhoneNumber(phone)}</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              )}
              {website && (
                <a
                  href={website.startsWith("http") ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 border-2 border-black px-8 py-4 hover:bg-black hover:text-white transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm tracking-wide">Visit Website</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              )}
            </div>
          </div>

          {/* Right column - Logo */}
          <div className="lg:col-span-5 flex items-start justify-end">
            <div className="w-48 h-48 lg:w-64 lg:h-64 bg-black/5 flex items-center justify-center">
              {logoUrl ? (
                <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
              ) : (
                <span
                  className="text-6xl lg:text-8xl font-light text-black/20"
                  style={{ fontFamily: "'Bebas Neue', 'Anton', sans-serif" }}
                >
                  {initials}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Section */}
      {videoId && (
        <div className="bg-black">
          <div className="max-w-7xl mx-auto">
            <div className="aspect-video">
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
      )}

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-12 gap-16">
          {/* Reviews Section */}
          <div className="lg:col-span-8">
            <div className="border-t-2 border-black pt-8">
              <div className="flex items-center gap-4 mb-8">
                <h2
                  className="text-3xl font-light tracking-tight"
                  style={{ fontFamily: "'Bebas Neue', 'Anton', sans-serif" }}
                >
                  Reviews
                </h2>
                <div className="flex-1 h-px bg-black/10" />
              </div>

              <div className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-black/10 mb-6">
                  <Star className="w-6 h-6 text-black/20" />
                </div>
                <p className="text-black/40 text-sm tracking-wide">No reviews yet</p>
                <p className="text-black/30 text-xs mt-2">Be the first to share your experience</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="border-t-2 border-black pt-8 space-y-8">
              <h3 className="text-xs tracking-[0.2em] uppercase text-black/40">Contact</h3>

              {phone && (
                <div>
                  <p className="text-xs text-black/40 mb-1">Phone</p>
                  <a href={`tel:${phone}`} className="text-lg hover:underline">
                    {formatPhoneNumber(phone)}
                  </a>
                </div>
              )}

              {website && (
                <div>
                  <p className="text-xs text-black/40 mb-1">Website</p>
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg hover:underline break-all"
                  >
                    {website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}

              {location && (
                <div>
                  <p className="text-xs text-black/40 mb-1">Location</p>
                  <p className="text-lg">{location}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-black/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-xs text-black/30 tracking-wide">
            © Local City Places · Earn rewards when you shop local
          </p>
        </div>
      </div>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-black/10 p-4 z-50">
        <div className="flex gap-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex-1 bg-black text-white py-3 text-center text-sm tracking-wide"
            >
              Call Now
            </a>
          )}
          {website && (
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 border border-black py-3 text-center text-sm tracking-wide"
            >
              Website
            </a>
          )}
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  );
}
