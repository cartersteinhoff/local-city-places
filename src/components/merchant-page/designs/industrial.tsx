"use client";

/**
 * DESIGN 15: "Industrial"
 *
 * Urban warehouse/loft aesthetic.
 * Concrete, steel, exposed elements.
 * Raw and authentic feel.
 */

import { MapPin, Phone, Globe, Share2, Star, Warehouse } from "lucide-react";
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

export function IndustrialDesign({
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
    <div className="min-h-screen bg-[#1a1a1a] text-[#e5e5e5]">
      {/* Concrete texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="relative border-b border-[#333]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Warehouse className="w-5 h-5 text-[#D97706]" />
            <span className="text-sm font-mono uppercase tracking-wider text-[#666]">Local City Places</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-[#666] hover:text-[#D97706] transition-colors"
          >
            <Share2 className="w-4 h-4" />
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </header>

      {/* Contact Bar - Steel beam style */}
      <div className="relative bg-[#D97706]">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
        <div className="max-w-6xl mx-auto px-6 py-4 relative">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-black">
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Phone className="w-5 h-5" />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider opacity-60">Tel</p>
                  <p className="text-sm font-bold font-mono">{formatPhoneNumber(phone)}</p>
                </div>
              </a>
            )}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Globe className="w-5 h-5" />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider opacity-60">Web</p>
                  <p className="text-sm font-bold font-mono truncate max-w-[150px]">{website.replace(/^https?:\/\//, "")}</p>
                </div>
              </a>
            )}
            {location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5" />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider opacity-60">Loc</p>
                  <p className="text-sm font-bold font-mono">{location}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Rivet details */}
        <div className="absolute top-2 left-4 w-2 h-2 rounded-full bg-black/20" />
        <div className="absolute top-2 right-4 w-2 h-2 rounded-full bg-black/20" />
        <div className="absolute bottom-2 left-4 w-2 h-2 rounded-full bg-black/20" />
        <div className="absolute bottom-2 right-4 w-2 h-2 rounded-full bg-black/20" />
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="max-w-6xl mx-auto px-6 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Business Info */}
            <div>
              {/* Logo - Industrial frame */}
              <div className="inline-block mb-8">
                <div className="relative">
                  {/* Corner brackets */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-[#D97706]" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-[#D97706]" />
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-[#D97706]" />
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-[#D97706]" />

                  <div className="w-24 h-24 bg-[#252525] flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-[#D97706] font-mono">{initials}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Category */}
              {categoryName && (
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 text-xs font-mono uppercase tracking-wider text-[#D97706] border border-[#D97706]">
                    {categoryName}
                  </span>
                </div>
              )}

              {/* Business Name */}
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#e5e5e5] mb-6 leading-tight uppercase tracking-tight"
                style={{ fontFamily: "'Oswald', 'Bebas Neue', sans-serif" }}
              >
                {businessName}
              </h1>

              {/* Description */}
              {description && (
                <p className="text-lg text-[#888] leading-relaxed max-w-lg mb-8 font-mono">
                  {description}
                </p>
              )}

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#D97706] text-black font-bold uppercase tracking-wider hover:bg-[#B45309] transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    Call Now
                  </a>
                )}
                {website && (
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-[#444] text-[#e5e5e5] font-bold uppercase tracking-wider hover:border-[#D97706] hover:text-[#D97706] transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    Website
                  </a>
                )}
              </div>
            </div>

            {/* Right - Vertical Video with industrial frame */}
            {videoId && (
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Industrial frame */}
                  <div className="absolute -inset-3 border-4 border-[#333]" />
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-4 bg-[#333]" />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-4 bg-[#333]" />

                  {/* Corner bolts */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#D97706] rounded-full border-2 border-[#333]" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#D97706] rounded-full border-2 border-[#333]" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-[#D97706] rounded-full border-2 border-[#333]" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#D97706] rounded-full border-2 border-[#333]" />

                  <div
                    className="relative w-[260px] sm:w-[300px] bg-[#0a0a0a] overflow-hidden"
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
            )}

            {/* If no video */}
            {!videoId && (
              <div className="hidden lg:flex justify-end">
                <div className="w-48 h-48 border-4 border-[#333] flex items-center justify-center">
                  <Warehouse className="w-16 h-16 text-[#333]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-[#333]">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-black uppercase tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>
                Reviews
              </h2>
              <div className="flex-1 h-px bg-[#333]" />
            </div>

            <div className="border border-[#333] p-8 text-center">
              <Star className="w-10 h-10 text-[#333] mx-auto mb-4" />
              <p className="text-[#666] font-mono uppercase tracking-wider text-sm mb-1">No Reviews Yet</p>
              <p className="text-[#444] font-mono text-xs">Be the first to leave feedback</p>
            </div>
          </div>
        </div>

        {/* Partner Section */}
        <div className="bg-[#252525] border-y border-[#333]">
          <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-center gap-4">
            <Warehouse className="w-6 h-6 text-[#D97706]" />
            <div className="text-center">
              <p className="font-bold uppercase tracking-wider text-[#D97706]">Local City Partner</p>
              <p className="text-[#666] text-sm font-mono">Earn rewards when you visit</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-6">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-xs font-mono uppercase tracking-wider text-[#444]">
              © Local City Places · Built Different
            </p>
          </div>
        </footer>
      </div>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-[#1a1a1a] border-t border-[#333] p-4">
        <div className="flex gap-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#D97706] text-black font-bold uppercase tracking-wider"
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
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-[#444] text-[#e5e5e5] font-bold uppercase tracking-wider"
            >
              <Globe className="w-4 h-4" />
              Web
            </a>
          )}
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  );
}
