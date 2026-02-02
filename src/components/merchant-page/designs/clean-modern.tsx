"use client";

/**
 * DESIGN 16: "Clean Modern"
 *
 * Simple, professional, universally appealing.
 * White background, subtle shadows, clear hierarchy.
 * Works for any business type.
 */

import { MapPin, Phone, Globe, Share2, Star, Building2 } from "lucide-react";
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

export function CleanModernDesign({
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
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-500">Local City Places</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </header>

      {/* Contact Bar */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-medium">{formatPhoneNumber(phone)}</p>
                </div>
              </a>
            )}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Website</p>
                  <p className="text-sm font-medium truncate max-w-[150px]">{website.replace(/^https?:\/\//, "")}</p>
                </div>
              </a>
            )}
            {location && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Location</p>
                  <p className="text-sm font-medium">{location}</p>
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
              <div className="w-24 h-24 rounded-2xl bg-gray-100 shadow-sm flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-blue-600">{initials}</span>
                )}
              </div>
            </div>

            {/* Category */}
            {categoryName && (
              <div className="mb-3">
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">
                  {categoryName}
                </span>
              </div>
            )}

            {/* Business Name */}
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              {businessName}
            </h1>

            {/* Description */}
            {description && (
              <p className="text-lg text-gray-500 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
                {description}
              </p>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
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
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors cursor-pointer"
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
                className="relative w-[260px] sm:w-[300px] rounded-2xl overflow-hidden bg-gray-100 shadow-lg"
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
              <div className="w-48 h-48 rounded-2xl bg-gray-50 flex items-center justify-center">
                <Building2 className="w-16 h-16 text-gray-200" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <Star className="w-10 h-10 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-900 font-medium mb-1">No reviews yet</p>
            <p className="text-gray-400 text-sm">Be the first to leave a review</p>
          </div>
        </div>
      </div>

      {/* Partner Banner */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center">
          <p className="font-medium">Local City Places Partner</p>
          <p className="text-blue-100 text-sm">Earn rewards every time you visit</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-gray-400">© Local City Places</p>
        </div>
      </footer>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-white border-t border-gray-100 p-4">
        <div className="flex gap-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-medium rounded-lg cursor-pointer"
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
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-700 font-medium rounded-lg cursor-pointer"
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
