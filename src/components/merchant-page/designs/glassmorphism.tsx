"use client";

/**
 * DESIGN 10: "Glassmorphism"
 *
 * Modern frosted glass aesthetic.
 * Blur effects, transparency, soft gradients.
 * Clean and contemporary feel.
 */

import { MapPin, Phone, Globe, Share2, Star, Sparkles } from "lucide-react";
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

export function GlassmorphismDesign({
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
    <div className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header - Glass */}
      <header className="sticky top-0 z-50">
        <div className="mx-4 mt-4">
          <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white/80">Local City Places</span>
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                <Share2 className="w-4 h-4" />
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contact Bar - Glass */}
      <div className="mx-4 mt-4">
        <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {phone && (
              <a href={`tel:${phone}`} className="group flex items-center gap-3 text-white hover:text-white/80 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50">Phone</p>
                  <p className="text-sm font-medium">{formatPhoneNumber(phone)}</p>
                </div>
              </a>
            )}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 text-white hover:text-white/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50">Website</p>
                  <p className="text-sm font-medium truncate max-w-[140px]">{website.replace(/^https?:\/\//, "")}</p>
                </div>
              </a>
            )}
            {location && (
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50">Location</p>
                  <p className="text-sm font-medium">{location}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left - Business Info */}
            <div className="text-center lg:text-left">
              {/* Logo - Glass card */}
              <div className="inline-block mb-8">
                <div className="w-28 h-28 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center overflow-hidden shadow-2xl">
                  {logoUrl ? (
                    <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-white">{initials}</span>
                  )}
                </div>
              </div>

              {/* Category */}
              {categoryName && (
                <div className="mb-4">
                  <span className="inline-block px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white bg-white/10 backdrop-blur border border-white/20 rounded-full">
                    {categoryName}
                  </span>
                </div>
              )}

              {/* Business Name */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                {businessName}
              </h1>

              {/* Description */}
              {description && (
                <p className="text-lg text-white/70 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
                  {description}
                </p>
              )}

              {/* CTAs - Glass buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-purple-600 font-semibold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
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
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl text-white font-semibold rounded-2xl border border-white/30 hover:bg-white/20 transition-all"
                  >
                    <Globe className="w-5 h-5" />
                    Website
                  </a>
                )}
              </div>
            </div>

            {/* Right - Vertical Video in glass frame */}
            {videoId && (
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute -inset-4 bg-white/20 rounded-[2rem] blur-2xl" />

                  {/* Glass frame */}
                  <div className="relative bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/30 p-3 shadow-2xl">
                    <div
                      className="relative w-[260px] sm:w-[280px] rounded-[1.5rem] overflow-hidden bg-black"
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
              </div>
            )}

            {/* If no video */}
            {!videoId && (
              <div className="hidden lg:flex justify-end">
                <div className="w-48 h-48 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-white/40" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section - Glass card */}
        <div className="max-w-6xl mx-auto mt-12">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Reviews</h2>
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white/60 font-medium mb-1">No reviews yet</p>
              <p className="text-white/40 text-sm">Be the first to share your experience</p>
            </div>
          </div>
        </div>

        {/* Partner Banner */}
        <div className="max-w-6xl mx-auto mt-6">
          <div className="bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 p-5">
            <div className="flex items-center justify-center gap-4">
              <Sparkles className="w-6 h-6 text-white" />
              <div className="text-center">
                <p className="font-semibold text-white">Local City Places Partner</p>
                <p className="text-white/60 text-sm">Earn rewards when you visit</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="max-w-6xl mx-auto mt-8 text-center">
          <p className="text-sm text-white/40">© Local City Places</p>
        </footer>
      </div>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-3">
          <div className="flex gap-3">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-purple-600 font-semibold rounded-xl"
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
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 text-white font-semibold rounded-xl border border-white/20"
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
