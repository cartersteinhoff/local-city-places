"use client";

/**
 * DESIGN 14: "Tropical"
 *
 * Bright summer/vacation vibes.
 * Warm colors, palm patterns, relaxed feel.
 * Fun and inviting atmosphere.
 */

import { MapPin, Phone, Globe, Share2, Star, Sun } from "lucide-react";
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

export function TropicalDesign({
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
    <div className="min-h-screen bg-gradient-to-b from-[#87CEEB] via-[#98D8C8] to-[#F7DC6F] overflow-hidden">
      {/* Palm leaf pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23006400' fill-opacity='1'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2l-6 6V4zm0 4l8-8h2L40 10V8zm0 4L52 0h2L40 14v-2zm0 4L56 0h2L40 18v-2zm0 4L60 0h2L40 22v-2zm0 4L64 0h2L40 26v-2zm0 4L68 0h2L40 30v-2zm0 4L72 0h2L40 34v-2zm0 4L76 0h2L40 38v-2zm0 4L80 0v2L42 40h-2zm4 0L80 4v2L46 40h-2zm4 0L80 8v2L50 40h-2zm4 0l28-28v2L54 40h-2zm4 0l24-24v2L58 40h-2zm4 0l20-20v2L62 40h-2zm4 0l16-16v2L66 40h-2zm4 0l12-12v2L70 40h-2zm4 0l8-8v2l-6 6h-2zm4 0l4-4v2l-2 2h-2z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="relative">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-6 h-6 text-[#FF6B35]" />
            <span className="text-sm font-bold text-[#2D5016]">Local City Places</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur rounded-full text-sm font-medium text-[#2D5016] hover:bg-white/70 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </header>

      {/* Contact Bar */}
      <div className="relative mx-4">
        <div className="max-w-5xl mx-auto bg-[#FF6B35] rounded-2xl shadow-lg">
          <div className="px-6 py-4">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-white">
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-70">Call Us</p>
                    <p className="text-sm font-bold">{formatPhoneNumber(phone)}</p>
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
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-70">Website</p>
                    <p className="text-sm font-bold truncate max-w-[140px]">{website.replace(/^https?:\/\//, "")}</p>
                  </div>
                </a>
              )}
              {location && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-70">Find Us</p>
                    <p className="text-sm font-bold">{location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="max-w-5xl mx-auto px-6 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Business Info */}
            <div className="text-center lg:text-left">
              {/* Logo */}
              <div className="inline-block mb-6">
                <div className="w-28 h-28 rounded-3xl bg-white shadow-xl border-4 border-[#F7DC6F] flex items-center justify-center overflow-hidden transform -rotate-3 hover:rotate-0 transition-transform">
                  {logoUrl ? (
                    <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-[#FF6B35]">{initials}</span>
                  )}
                </div>
              </div>

              {/* Category */}
              {categoryName && (
                <div className="mb-4">
                  <span className="inline-block px-4 py-2 bg-[#2D5016] text-white text-sm font-bold rounded-full uppercase tracking-wider">
                    {categoryName}
                  </span>
                </div>
              )}

              {/* Business Name */}
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#2D5016] mb-6 leading-tight"
                style={{ fontFamily: "'Poppins', 'Nunito', sans-serif" }}
              >
                {businessName}
              </h1>

              {/* Description */}
              {description && (
                <p className="text-lg text-[#2D5016]/70 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
                  {description}
                </p>
              )}

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#FF6B35] text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
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
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-[#2D5016] font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    <Globe className="w-5 h-5" />
                    Visit Website
                  </a>
                )}
              </div>
            </div>

            {/* Right - Vertical Video */}
            {videoId && (
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Decorative elements */}
                  <div className="absolute -top-4 -left-4 w-16 h-16 bg-[#F7DC6F] rounded-full" />
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-[#FF6B35] rounded-full" />

                  <div
                    className="relative w-[260px] sm:w-[300px] rounded-3xl overflow-hidden bg-white shadow-2xl border-4 border-white"
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
                <div className="w-48 h-48 rounded-3xl bg-white/50 backdrop-blur flex items-center justify-center">
                  <Sun className="w-16 h-16 text-[#F7DC6F]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="max-w-5xl mx-auto px-6 pb-12">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-[#2D5016] mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-[#F7DC6F]" />
              Reviews
            </h2>
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[#F7DC6F]/20 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-[#F7DC6F]" />
              </div>
              <p className="text-[#2D5016] font-medium mb-1">No reviews yet</p>
              <p className="text-[#2D5016]/50 text-sm">Be the first to share your experience!</p>
            </div>
          </div>
        </div>

        {/* Partner Banner */}
        <div className="max-w-5xl mx-auto px-6 pb-12">
          <div className="bg-[#2D5016] rounded-2xl p-6 text-white text-center">
            <Sun className="w-8 h-8 text-[#F7DC6F] mx-auto mb-2" />
            <p className="font-bold">Local City Places Partner</p>
            <p className="text-white/70 text-sm">Earn rewards every time you visit!</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-6 text-center">
          <p className="text-sm text-[#2D5016]/50">© Local City Places · Discover Paradise</p>
        </footer>
      </div>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-white/90 backdrop-blur-xl p-4">
        <div className="flex gap-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#FF6B35] text-white font-bold rounded-full"
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
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2D5016] text-white font-bold rounded-full"
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
