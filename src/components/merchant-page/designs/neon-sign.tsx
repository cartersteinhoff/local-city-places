"use client";

/**
 * DESIGN 12: "Neon Sign"
 *
 * Storefront neon sign at night aesthetic.
 * Glowing text effects, dark background.
 * Urban nightlife vibe.
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

export function NeonSignDesign({
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
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Brick texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='42' height='24' viewBox='0 0 42 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h42v12H0V0zm1 1v10h19V1H1zm21 0v10h19V1H22zM0 12h42v12H0V12zm1 1v10h9V13H1zm11 0v10h19V13H12zm21 0v10h8V13h-8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" style={{ filter: 'drop-shadow(0 0 8px #facc15)' }} />
            <span className="text-sm font-medium text-white/50">Local City Places</span>
          </div>
          <button
            onClick={handleShare}
            className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </header>

      {/* Contact Bar - Neon style */}
      <div className="relative border-b border-white/10 bg-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {phone && (
              <a href={`tel:${phone}`} className="group flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg border-2 border-green-400 flex items-center justify-center"
                  style={{ boxShadow: '0 0 15px rgba(74, 222, 128, 0.5), inset 0 0 15px rgba(74, 222, 128, 0.1)' }}
                >
                  <Phone className="w-4 h-4 text-green-400" style={{ filter: 'drop-shadow(0 0 4px #4ade80)' }} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-green-400/70">Phone</p>
                  <p
                    className="text-sm font-medium text-green-400"
                    style={{ textShadow: '0 0 10px rgba(74, 222, 128, 0.8)' }}
                  >
                    {formatPhoneNumber(phone)}
                  </p>
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
                <div
                  className="w-10 h-10 rounded-lg border-2 border-blue-400 flex items-center justify-center"
                  style={{ boxShadow: '0 0 15px rgba(96, 165, 250, 0.5), inset 0 0 15px rgba(96, 165, 250, 0.1)' }}
                >
                  <Globe className="w-4 h-4 text-blue-400" style={{ filter: 'drop-shadow(0 0 4px #60a5fa)' }} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-blue-400/70">Website</p>
                  <p
                    className="text-sm font-medium text-blue-400 truncate max-w-[140px]"
                    style={{ textShadow: '0 0 10px rgba(96, 165, 250, 0.8)' }}
                  >
                    {website.replace(/^https?:\/\//, "")}
                  </p>
                </div>
              </a>
            )}
            {location && (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg border-2 border-yellow-400 flex items-center justify-center"
                  style={{ boxShadow: '0 0 15px rgba(250, 204, 21, 0.5), inset 0 0 15px rgba(250, 204, 21, 0.1)' }}
                >
                  <MapPin className="w-4 h-4 text-yellow-400" style={{ filter: 'drop-shadow(0 0 4px #facc15)' }} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-yellow-400/70">Location</p>
                  <p
                    className="text-sm font-medium text-yellow-400"
                    style={{ textShadow: '0 0 10px rgba(250, 204, 21, 0.8)' }}
                  >
                    {location}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="max-w-6xl mx-auto px-6 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Business Info */}
            <div className="text-center lg:text-left">
              {/* Logo */}
              <div className="inline-block mb-8">
                <div
                  className="w-28 h-28 rounded-xl border-2 border-red-500 flex items-center justify-center overflow-hidden bg-black/50"
                  style={{ boxShadow: '0 0 30px rgba(239, 68, 68, 0.4), inset 0 0 20px rgba(239, 68, 68, 0.1)' }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                  ) : (
                    <span
                      className="text-4xl font-black text-red-500"
                      style={{ textShadow: '0 0 20px rgba(239, 68, 68, 0.8)' }}
                    >
                      {initials}
                    </span>
                  )}
                </div>
              </div>

              {/* Category */}
              {categoryName && (
                <div className="mb-4">
                  <span
                    className="inline-block px-4 py-1 text-xs font-bold uppercase tracking-wider text-pink-400 border border-pink-400/50 rounded-full"
                    style={{ textShadow: '0 0 8px rgba(236, 72, 153, 0.8)', boxShadow: '0 0 10px rgba(236, 72, 153, 0.3)' }}
                  >
                    {categoryName}
                  </span>
                </div>
              )}

              {/* Business Name - Main neon sign */}
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight text-white"
                style={{
                  textShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.6), 0 0 30px rgba(255,255,255,0.4), 0 0 40px rgba(239, 68, 68, 0.6), 0 0 70px rgba(239, 68, 68, 0.4)',
                  fontFamily: "'Bebas Neue', 'Anton', sans-serif"
                }}
              >
                {businessName}
              </h1>

              {/* Description */}
              {description && (
                <p className="text-lg text-white/50 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
                  {description}
                </p>
              )}

              {/* CTAs - Neon buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-green-400 text-green-400 font-bold rounded-lg transition-all hover:bg-green-400/10"
                    style={{ boxShadow: '0 0 20px rgba(74, 222, 128, 0.4)', textShadow: '0 0 10px rgba(74, 222, 128, 0.8)' }}
                  >
                    <Phone className="w-5 h-5" />
                    CALL NOW
                  </a>
                )}
                {website && (
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-blue-400 text-blue-400 font-bold rounded-lg transition-all hover:bg-blue-400/10"
                    style={{ boxShadow: '0 0 20px rgba(96, 165, 250, 0.4)', textShadow: '0 0 10px rgba(96, 165, 250, 0.8)' }}
                  >
                    <Globe className="w-5 h-5" />
                    WEBSITE
                  </a>
                )}
              </div>
            </div>

            {/* Right - Vertical Video with neon frame */}
            {videoId && (
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Neon tube frame effect */}
                  <div
                    className="absolute -inset-2 rounded-2xl border-4 border-red-500"
                    style={{ boxShadow: '0 0 30px rgba(239, 68, 68, 0.6), inset 0 0 30px rgba(239, 68, 68, 0.2)' }}
                  />
                  <div
                    className="absolute -inset-4 rounded-3xl border-2 border-red-500/30"
                    style={{ boxShadow: '0 0 50px rgba(239, 68, 68, 0.3)' }}
                  />

                  <div
                    className="relative w-[260px] sm:w-[300px] bg-black rounded-xl overflow-hidden"
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

                  {/* "OPEN" sign style label */}
                  <div
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-6 py-1 border-2 border-green-400 bg-black/80 rounded"
                    style={{ boxShadow: '0 0 15px rgba(74, 222, 128, 0.5)' }}
                  >
                    <span
                      className="text-sm font-bold text-green-400 tracking-wider"
                      style={{ textShadow: '0 0 10px rgba(74, 222, 128, 0.8)' }}
                    >
                      NOW PLAYING
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* If no video */}
            {!videoId && (
              <div className="hidden lg:flex justify-end">
                <div
                  className="w-48 h-48 rounded-xl border-2 border-red-500/50 flex items-center justify-center"
                  style={{ boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)' }}
                >
                  <Sparkles
                    className="w-12 h-12 text-red-500/50"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <h2
              className="text-2xl font-bold mb-8 text-pink-400"
              style={{ textShadow: '0 0 15px rgba(236, 72, 153, 0.6)' }}
            >
              REVIEWS
            </h2>
            <div
              className="text-center py-12 border border-white/10 rounded-xl"
              style={{ boxShadow: 'inset 0 0 30px rgba(255,255,255,0.02)' }}
            >
              <Star
                className="w-12 h-12 text-yellow-400/30 mx-auto mb-4"
                style={{ filter: 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.3))' }}
              />
              <p className="text-white/40 font-medium mb-1">No reviews yet</p>
              <p className="text-white/20 text-sm">Be the first to leave a review</p>
            </div>
          </div>
        </div>

        {/* Partner Section */}
        <div
          className="border-t border-yellow-400/30 bg-yellow-400/5"
          style={{ boxShadow: 'inset 0 1px 0 rgba(250, 204, 21, 0.2)' }}
        >
          <div className="max-w-6xl mx-auto px-6 py-6 text-center">
            <p
              className="font-bold text-yellow-400"
              style={{ textShadow: '0 0 10px rgba(250, 204, 21, 0.6)' }}
            >
              ★ LOCAL CITY PARTNER ★
            </p>
            <p className="text-yellow-400/50 text-sm">Earn rewards when you visit</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 px-6 py-6">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-xs text-white/30">© Local City Places</p>
          </div>
        </footer>
      </div>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-[#0a0a0f]/95 backdrop-blur border-t border-white/10 p-4">
        <div className="flex gap-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-green-400 text-green-400 font-bold rounded-lg"
              style={{ boxShadow: '0 0 15px rgba(74, 222, 128, 0.3)', textShadow: '0 0 8px rgba(74, 222, 128, 0.8)' }}
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
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-blue-400 text-blue-400 font-bold rounded-lg"
              style={{ boxShadow: '0 0 15px rgba(96, 165, 250, 0.3)', textShadow: '0 0 8px rgba(96, 165, 250, 0.8)' }}
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
