"use client";

/**
 * DESIGN 13: "Tech Minimal"
 *
 * Apple/tech company inspired.
 * Ultra clean, refined, sophisticated.
 * SF Pro-like typography, subtle animations.
 */

import { MapPin, Phone, Globe, Share2, Star, ChevronRight } from "lucide-react";
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

export function TechMinimalDesign({
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
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#fbfbfd]/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-[#1d1d1f]/60">Local City Places</span>
          <button
            onClick={handleShare}
            className="text-sm text-[#0066cc] hover:text-[#0055b3] transition-colors flex items-center gap-1"
          >
            {copied ? "Link Copied" : "Share"}
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Contact Strip */}
      <div className="bg-[#f5f5f7]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {phone && (
              <a href={`tel:${phone}`} className="group flex items-center gap-3 text-[#1d1d1f] hover:text-[#0066cc] transition-colors">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#86868b]">Call</p>
                  <p className="text-sm font-medium">{formatPhoneNumber(phone)}</p>
                </div>
              </a>
            )}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 text-[#1d1d1f] hover:text-[#0066cc] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#86868b]">Website</p>
                  <p className="text-sm font-medium truncate max-w-[150px]">{website.replace(/^https?:\/\//, "")}</p>
                </div>
              </a>
            )}
            {location && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#86868b]">Location</p>
                  <p className="text-sm font-medium">{location}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 py-16 lg:py-24 text-center">
        {/* Logo */}
        <div className="inline-block mb-8">
          <div className="w-24 h-24 rounded-[28px] bg-gradient-to-b from-[#1d1d1f] to-[#424245] shadow-xl flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-semibold text-white">{initials}</span>
            )}
          </div>
        </div>

        {/* Category */}
        {categoryName && (
          <p className="text-[#0066cc] text-sm font-medium mb-3">{categoryName}</p>
        )}

        {/* Business Name */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-[#1d1d1f] mb-6 leading-tight tracking-tight">
          {businessName}
        </h1>

        {/* Description */}
        {description && (
          <p className="text-xl text-[#86868b] leading-relaxed max-w-2xl mx-auto mb-10">
            {description}
          </p>
        )}

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-4">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#0066cc] text-white font-medium rounded-full hover:bg-[#0055b3] transition-colors"
            >
              Call Now
              <ChevronRight className="w-4 h-4" />
            </a>
          )}
          {website && (
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 text-[#0066cc] font-medium rounded-full border border-[#0066cc] hover:bg-[#0066cc]/5 transition-colors"
            >
              Visit Website
              <ChevronRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Video Section */}
      {videoId && (
        <div className="bg-[#1d1d1f] py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex justify-center">
              <div className="relative">
                <div
                  className="w-[280px] sm:w-[320px] rounded-[2rem] overflow-hidden bg-black shadow-2xl"
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
              </div>
            </div>
            <p className="text-center text-white/50 text-sm mt-6">Watch our story</p>
          </div>
        </div>
      )}

      {/* Features/Reviews */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-4">Customer Reviews</h2>
          <p className="text-[#86868b] mb-8">See what others are saying</p>

          <div className="bg-[#f5f5f7] rounded-3xl p-12">
            <Star className="w-10 h-10 text-[#86868b]/30 mx-auto mb-4" />
            <p className="text-[#1d1d1f] font-medium mb-1">No reviews yet</p>
            <p className="text-[#86868b] text-sm">Be the first to leave a review</p>
          </div>
        </div>
      </div>

      {/* Partner Banner */}
      <div className="bg-gradient-to-r from-[#1d1d1f] to-[#424245] text-white">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center">
          <p className="font-medium mb-1">Local City Places Partner</p>
          <p className="text-white/60 text-sm">Earn rewards every time you visit</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-black/5 px-6 py-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-[#86868b]">© Local City Places</p>
        </div>
      </footer>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-[#fbfbfd]/90 backdrop-blur-xl border-t border-black/5 p-4">
        <div className="flex gap-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0066cc] text-white font-medium rounded-full"
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
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#0066cc] text-[#0066cc] font-medium rounded-full"
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
