"use client";

/**
 * DESIGN 17: "Warm Friendly"
 *
 * Approachable, welcoming, soft colors.
 * Rounded corners, warm tones, friendly feel.
 * Great for service businesses.
 */

import { MapPin, Phone, Globe, Share2, Star, Heart } from "lucide-react";
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

export function WarmFriendlyDesign({
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
    <div className="min-h-screen bg-amber-50 text-gray-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-500">Local City Places</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </header>

      {/* Contact Bar */}
      <div className="bg-gradient-to-r from-orange-400 to-amber-400">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-white">
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-80">Call Us</p>
                  <p className="font-semibold">{formatPhoneNumber(phone)}</p>
                </div>
              </a>
            )}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-80">Website</p>
                  <p className="font-semibold truncate max-w-[150px]">{website.replace(/^https?:\/\//, "")}</p>
                </div>
              </a>
            )}
            {location && (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-80">Find Us</p>
                  <p className="font-semibold">{location}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Business Info */}
          <div className="text-center lg:text-left">
            {/* Logo */}
            <div className="inline-block mb-6">
              <div className="w-28 h-28 rounded-3xl bg-white shadow-md border-4 border-amber-100 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-orange-500">{initials}</span>
                )}
              </div>
            </div>

            {/* Category */}
            {categoryName && (
              <div className="mb-4">
                <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 text-sm font-medium rounded-full">
                  {categoryName}
                </span>
              </div>
            )}

            {/* Business Name */}
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-4 leading-tight">
              {businessName}
            </h1>

            {/* Description */}
            {description && (
              <p className="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
                {description}
              </p>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </a>
              )}
              {website && (
                <a
                  href={website.startsWith("http") ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-gray-700 font-semibold rounded-full border-2 border-amber-200 hover:border-orange-400 transition-colors cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  Visit Website
                </a>
              )}
            </div>
          </div>

          {/* Right - Vertical Video */}
          {videoId && (
            <div className="flex justify-center lg:justify-end">
              <div
                className="relative w-[260px] sm:w-[300px] rounded-3xl overflow-hidden bg-white shadow-xl border-4 border-white"
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
          )}

          {/* If no video */}
          {!videoId && (
            <div className="hidden lg:flex justify-end">
              <div className="w-48 h-48 rounded-3xl bg-white/80 shadow-sm flex items-center justify-center">
                <Heart className="w-16 h-16 text-amber-200" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-3xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-400" />
            Reviews
          </h2>
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-amber-300" />
            </div>
            <p className="text-gray-700 font-medium mb-1">No reviews yet</p>
            <p className="text-gray-400 text-sm">Be the first to share your experience!</p>
          </div>
        </div>
      </div>

      {/* Partner Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center">
          <Heart className="w-6 h-6 mx-auto mb-2 opacity-80" />
          <p className="font-semibold">Local City Places Partner</p>
          <p className="text-white/80 text-sm">Earn rewards every time you visit</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/80 px-6 py-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-gray-400">© Local City Places</p>
        </div>
      </footer>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-white border-t border-amber-100 p-4">
        <div className="flex gap-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 text-white font-semibold rounded-full cursor-pointer"
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
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-100 text-gray-700 font-semibold rounded-full cursor-pointer"
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
