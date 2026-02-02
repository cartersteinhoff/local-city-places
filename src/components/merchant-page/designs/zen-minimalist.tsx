"use client";

/**
 * DESIGN 7: "Zen Minimalist"
 *
 * Japanese-inspired minimalism.
 * Serene, balanced, intentional whitespace.
 * Subtle textures, muted earth tones.
 * Contact prominent, vertical video in scroll container.
 */

import { MapPin, Phone, Globe, Share2, Star } from "lucide-react";
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

export function ZenMinimalistDesign({
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
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Subtle paper texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="relative border-b border-stone-200/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xs tracking-[0.3em] uppercase text-stone-400" style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>
            Local City Places
          </span>
          <button
            onClick={handleShare}
            className="text-xs tracking-[0.2em] uppercase text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-2"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </header>

      {/* Contact Bar - Subtle but present */}
      <div className="relative border-b border-stone-200/50 bg-stone-50/50">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {phone && (
              <a href={`tel:${phone}`} className="group flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center group-hover:border-stone-500 transition-colors">
                  <Phone className="w-4 h-4 text-stone-500" />
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400">Phone</p>
                  <p className="text-sm text-stone-700">{formatPhoneNumber(phone)}</p>
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
                <div className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center group-hover:border-stone-500 transition-colors">
                  <Globe className="w-4 h-4 text-stone-500" />
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400">Website</p>
                  <p className="text-sm text-stone-700 truncate max-w-[140px]">{website.replace(/^https?:\/\//, "")}</p>
                </div>
              </a>
            )}
            {location && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-stone-500" />
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400">Location</p>
                  <p className="text-sm text-stone-700">{location}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="max-w-5xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left - Business Info */}
            <div className="text-center lg:text-left">
              {/* Logo */}
              <div className="inline-block mb-10">
                <div className="w-24 h-24 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-stone-400" style={{ fontFamily: "'Zen Kaku Gothic New', serif" }}>
                      {initials}
                    </span>
                  )}
                </div>
              </div>

              {/* Category */}
              {categoryName && (
                <div className="mb-6">
                  <span className="text-[11px] tracking-[0.25em] uppercase text-stone-400">
                    {categoryName}
                  </span>
                </div>
              )}

              {/* Business Name */}
              <h1
                className="text-4xl sm:text-5xl font-light text-stone-800 mb-6 leading-tight tracking-tight"
                style={{ fontFamily: "'Cormorant Garamond', 'Noto Serif JP', serif" }}
              >
                {businessName}
              </h1>

              {/* Decorative line */}
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                <div className="w-12 h-px bg-stone-300" />
                <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                <div className="w-12 h-px bg-stone-300" />
              </div>

              {/* Description */}
              {description && (
                <p
                  className="text-base text-stone-500 leading-relaxed max-w-md mx-auto lg:mx-0 mb-10"
                  style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif" }}
                >
                  {description}
                </p>
              )}

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-stone-800 text-white hover:bg-stone-700 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-sm tracking-wide">Call Now</span>
                  </a>
                )}
                {website && (
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-stone-300 hover:border-stone-500 transition-colors"
                  >
                    <Globe className="w-4 h-4 text-stone-600" />
                    <span className="text-sm tracking-wide text-stone-700">Website</span>
                  </a>
                )}
              </div>
            </div>

            {/* Right - Vertical Video in minimal frame */}
            {videoId && (
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Simple line frame */}
                  <div className="absolute -inset-4 border border-stone-200" />

                  <div
                    className="relative w-[260px] sm:w-[280px] bg-stone-100 overflow-hidden"
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
                <div className="w-48 h-48 border border-stone-200 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-stone-300" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-stone-200/50">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <h2
                className="text-2xl font-light text-stone-700 mb-2"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Reviews
              </h2>
              <div className="w-8 h-px bg-stone-300 mx-auto" />
            </div>

            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full border border-stone-200 flex items-center justify-center mx-auto mb-6">
                <Star className="w-6 h-6 text-stone-300" />
              </div>
              <p className="text-stone-500 text-sm mb-1">No reviews yet</p>
              <p className="text-stone-400 text-xs">Be the first to share your experience</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-stone-200/50 px-6 py-8">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs tracking-[0.2em] uppercase text-stone-400">
              © Local City Places
            </p>
          </div>
        </footer>
      </div>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-[#FAF9F6] to-transparent" />
        <div className="bg-[#FAF9F6]/95 backdrop-blur-sm border-t border-stone-200 p-4">
          <div className="flex gap-3">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-stone-800 text-white text-sm"
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
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-stone-300 text-sm"
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
