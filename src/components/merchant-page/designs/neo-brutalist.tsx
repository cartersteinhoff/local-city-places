"use client";

/**
 * DESIGN 5: "Neo Brutalist"
 *
 * Bold, chunky, unapologetic design.
 * Thick borders, bright accents, raw energy.
 * Contact info prominent at top.
 * Vertical video as hero feature.
 */

import { MapPin, Phone, Globe, Share2, Star, Zap, ArrowRight } from "lucide-react";
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

export function NeoBrutalistDesign({
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
    <div className="min-h-screen bg-[#FFFEF0]">
      {/* Grid pattern background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(#000 1px, transparent 1px),
            linear-gradient(90deg, #000 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          opacity: 0.03,
        }}
      />

      {/* Header */}
      <header className="border-b-4 border-black bg-[#FFFEF0] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FF5F1F] border-2 border-black flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="font-black text-sm tracking-tight hidden sm:block">LOCAL CITY PLACES</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-black text-[#FFFEF0] font-bold text-sm border-2 border-black hover:bg-[#FF5F1F] hover:text-black transition-colors"
          >
            <Share2 className="w-4 h-4" />
            {copied ? "COPIED!" : "SHARE"}
          </button>
        </div>
      </header>

      {/* Contact Bar - Prominent */}
      <div className="bg-[#FF5F1F] border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-2 px-4 py-2 bg-black text-[#FFFEF0] font-bold border-2 border-black hover:bg-[#FFFEF0] hover:text-black transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span>{formatPhoneNumber(phone)}</span>
              </a>
            )}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#FFFEF0] text-black font-bold border-2 border-black hover:bg-black hover:text-[#FFFEF0] transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span className="hidden sm:inline">{website.replace(/^https?:\/\//, "")}</span>
                <span className="sm:hidden">Website</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
            {location && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#FFFEF0] text-black font-bold border-2 border-black">
                <MapPin className="w-5 h-5" />
                <span>{location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left - Business Info */}
            <div>
              {/* Logo */}
              <div className="inline-block mb-6">
                <div className="w-24 h-24 bg-[#39FF14] border-4 border-black flex items-center justify-center overflow-hidden transform rotate-3 hover:rotate-0 transition-transform">
                  {logoUrl ? (
                    <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-black">{initials}</span>
                  )}
                </div>
              </div>

              {/* Category */}
              {categoryName && (
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#00FFFF] border-2 border-black font-bold text-sm uppercase tracking-wider">
                    {categoryName}
                  </span>
                </div>
              )}

              {/* Business name */}
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-black text-black mb-6 leading-[0.9] uppercase tracking-tighter"
                style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
              >
                {businessName}
              </h1>

              {/* Description */}
              {description && (
                <div className="relative mb-8">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF5F1F]" />
                  <p className="text-lg text-black/70 leading-relaxed pl-4 max-w-lg">
                    {description}
                  </p>
                </div>
              )}

              {/* Big CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="group flex items-center justify-center gap-3 px-8 py-5 bg-black text-[#FFFEF0] font-black text-xl border-4 border-black hover:bg-[#FF5F1F] hover:text-black transition-colors"
                  >
                    <Phone className="w-6 h-6" />
                    CALL NOW
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                )}
                {website && (
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center gap-3 px-8 py-5 bg-[#FFFEF0] text-black font-black text-xl border-4 border-black hover:bg-[#39FF14] transition-colors"
                  >
                    <Globe className="w-6 h-6" />
                    WEBSITE
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                )}
              </div>
            </div>

            {/* Right - Vertical Video */}
            {videoId && (
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Video frame with offset shadow */}
                  <div className="absolute inset-0 bg-black translate-x-3 translate-y-3" style={{ aspectRatio: '9/16' }} />
                  <div
                    className="relative w-[280px] sm:w-[320px] bg-[#39FF14] border-4 border-black overflow-hidden"
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

                  {/* Label */}
                  <div className="absolute -bottom-4 -left-4 px-3 py-1 bg-[#FF5F1F] border-2 border-black font-bold text-sm uppercase">
                    Watch Video
                  </div>
                </div>
              </div>
            )}

            {/* If no video, show decorative box */}
            {!videoId && (
              <div className="hidden lg:flex justify-end">
                <div className="relative">
                  <div className="absolute inset-0 bg-black translate-x-4 translate-y-4" />
                  <div className="relative w-64 h-64 bg-[#39FF14] border-4 border-black flex items-center justify-center">
                    <Zap className="w-24 h-24 text-black" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-black text-[#FFFEF0] border-t-4 border-black">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-3xl font-black uppercase tracking-tight">Reviews</h2>
              <div className="flex-1 h-1 bg-[#FF5F1F]" />
            </div>

            <div className="text-center py-12 border-4 border-[#FFFEF0]/20">
              <div className="inline-flex items-center justify-center w-20 h-20 border-4 border-[#FFFEF0]/30 mb-6">
                <Star className="w-10 h-10 text-[#FFFEF0]/30" />
              </div>
              <p className="text-xl font-bold mb-2">NO REVIEWS YET</p>
              <p className="text-[#FFFEF0]/50">Be the first to share your experience</p>
            </div>
          </div>
        </div>

        {/* Partner Banner */}
        <div className="bg-[#39FF14] border-t-4 border-black">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div>
                  <p className="font-black text-lg uppercase">Local City Partner</p>
                  <p className="text-black/70 font-medium">Earn rewards when you shop here</p>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="px-4 py-2 bg-black text-[#39FF14] font-bold text-sm uppercase">
                  Learn More →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t-4 border-black bg-[#FFFEF0] px-4 py-6">
          <div className="max-w-7xl mx-auto text-center">
            <p className="font-bold text-black/50 text-sm uppercase tracking-wider">
              © Local City Places · Shop Local, Win Big
            </p>
          </div>
        </footer>
      </div>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-[#FFFEF0] border-t-4 border-black p-3">
        <div className="flex gap-2">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#FF5F1F] text-black font-black border-2 border-black"
            >
              <Phone className="w-5 h-5" />
              CALL
            </a>
          )}
          {website && (
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#39FF14] text-black font-black border-2 border-black"
            >
              <Globe className="w-5 h-5" />
              WEB
            </a>
          )}
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  );
}
