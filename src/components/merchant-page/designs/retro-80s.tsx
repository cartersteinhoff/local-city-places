"use client";

/**
 * DESIGN 8: "Retro 80s"
 *
 * Synthwave/vaporwave inspired.
 * Neon colors on dark, grid patterns.
 * Nostalgic 80s aesthetic with modern touches.
 * Contact prominent, vertical video with glow effects.
 */

import { MapPin, Phone, Globe, Share2, Star, Zap } from "lucide-react";
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

export function Retro80sDesign({
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
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-hidden">
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 0, 128, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 0, 128, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Gradient glow at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-purple-900/20 via-pink-900/10 to-transparent pointer-events-none" />

      {/* Sun/horizon effect */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-t from-orange-500 via-pink-500 to-transparent rounded-t-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-pink-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
              LOCAL CITY PLACES
            </span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm text-pink-400 hover:text-pink-300 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            {copied ? "COPIED!" : "SHARE"}
          </button>
        </div>
      </header>

      {/* Contact Bar - Neon style */}
      <div className="relative bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-purple-900/50 border-b border-pink-500/30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {phone && (
              <a href={`tel:${phone}`} className="group flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors shadow-lg shadow-cyan-500/20">
                  <Phone className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-cyan-400/70">Phone</p>
                  <p className="text-sm font-medium text-cyan-300">{formatPhoneNumber(phone)}</p>
                </div>
              </a>
            )}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 border border-pink-500/50 flex items-center justify-center group-hover:bg-pink-500/30 transition-colors shadow-lg shadow-pink-500/20">
                  <Globe className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-pink-400/70">Website</p>
                  <p className="text-sm font-medium text-pink-300 truncate max-w-[140px]">{website.replace(/^https?:\/\//, "")}</p>
                </div>
              </a>
            )}
            {location && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <MapPin className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-purple-400/70">Location</p>
                  <p className="text-sm font-medium text-purple-300">{location}</p>
                </div>
              </div>
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
              {/* Logo with neon glow */}
              <div className="inline-block mb-8">
                <div className="w-28 h-28 rounded-xl bg-gradient-to-br from-cyan-500/20 to-pink-500/20 border-2 border-pink-500/50 flex items-center justify-center overflow-hidden shadow-lg shadow-pink-500/30">
                  {logoUrl ? (
                    <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-pink-500">
                      {initials}
                    </span>
                  )}
                </div>
              </div>

              {/* Category */}
              {categoryName && (
                <div className="mb-4">
                  <span className="inline-block px-4 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/50 bg-cyan-500/10 rounded-full">
                    {categoryName}
                  </span>
                </div>
              )}

              {/* Business Name with gradient */}
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-500"
                style={{ fontFamily: "'Orbitron', 'Audiowide', sans-serif" }}
              >
                {businessName}
              </h1>

              {/* Description */}
              {description && (
                <p className="text-lg text-white/60 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
                  {description}
                </p>
              )}

              {/* CTAs with neon effect */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold rounded-lg overflow-hidden transition-all hover:shadow-lg hover:shadow-cyan-500/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Phone className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">CALL NOW</span>
                  </a>
                )}
                {website && (
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-pink-500 text-pink-400 font-bold rounded-lg hover:bg-pink-500/10 transition-all"
                  >
                    <Globe className="w-5 h-5" />
                    <span>WEBSITE</span>
                  </a>
                )}
              </div>
            </div>

            {/* Right - Vertical Video with neon frame */}
            {videoId && (
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Outer glow */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 rounded-2xl opacity-30 blur-xl" />

                  {/* Video container */}
                  <div className="relative">
                    {/* Neon border */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 rounded-xl" />

                    <div
                      className="relative w-[260px] sm:w-[300px] bg-[#0a0a1a] rounded-lg overflow-hidden"
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

                  {/* Scanlines effect */}
                  <div
                    className="absolute inset-0 pointer-events-none rounded-xl opacity-10"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* If no video */}
            {!videoId && (
              <div className="hidden lg:flex justify-end">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-xl opacity-20 blur-xl" />
                  <div className="absolute inset-0 border-2 border-pink-500/50 rounded-xl flex items-center justify-center">
                    <Zap className="w-12 h-12 text-pink-500/50" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-pink-500/20">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                REVIEWS
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-pink-500/50 to-transparent" />
            </div>

            <div className="text-center py-12 border border-pink-500/20 rounded-xl bg-pink-500/5">
              <div className="w-16 h-16 rounded-xl border-2 border-pink-500/30 flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-pink-500/40" />
              </div>
              <p className="text-white/50 font-medium mb-1">No reviews yet</p>
              <p className="text-white/30 text-sm">Be the first to share your experience</p>
            </div>
          </div>
        </div>

        {/* Partner Section */}
        <div className="bg-gradient-to-r from-cyan-500/10 via-pink-500/10 to-purple-500/10 border-y border-pink-500/20">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-center gap-4">
              <Zap className="w-6 h-6 text-cyan-400" />
              <div className="text-center">
                <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
                  LOCAL CITY PARTNER
                </p>
                <p className="text-white/50 text-sm">Earn rewards when you visit</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-4 py-6">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-xs text-white/30 tracking-wider">
              © LOCAL CITY PLACES · RIDE THE WAVE
            </p>
          </div>
        </footer>
      </div>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50">
        <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-[#0a0a1a] to-transparent" />
        <div className="bg-[#0a0a1a]/95 backdrop-blur-lg border-t border-pink-500/30 p-4">
          <div className="flex gap-3">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold rounded-lg"
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
                className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-pink-500 text-pink-400 font-bold rounded-lg"
              >
                <Globe className="w-4 h-4" />
                Web
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  );
}
