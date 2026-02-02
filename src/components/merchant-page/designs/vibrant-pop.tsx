"use client";

/**
 * DESIGN 2: "Vibrant Pop"
 *
 * Bold, colorful, modern design with playful geometric shapes.
 * Energetic gradient accents, dynamic visual rhythm.
 * Fun and approachable while still professional.
 */

import { MapPin, Phone, Globe, Share2, Sparkles, Star, MessageCircle } from "lucide-react";
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

export function VibrantPopDesign({
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
    <div className="min-h-screen bg-[#FFF8F0] overflow-hidden">
      {/* Floating geometric shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-orange-400/20 to-pink-500/20 blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-64 h-64 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-green-400/15 to-teal-500/15 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative">
        {/* Hero Section */}
        <div className="px-6 pt-8 pb-12">
          <div className="max-w-4xl mx-auto">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-600">Local City Places</span>
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-sm font-medium hover:bg-white transition-colors"
              >
                <Share2 className="w-4 h-4" />
                {copied ? "Copied!" : "Share"}
              </button>
            </div>

            {/* Contact Strip */}
            <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-2xl p-4 mb-8">
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-white">
                {phone && (
                  <a href={`tel:${phone}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-70">Call</p>
                      <p className="text-sm font-semibold">{formatPhoneNumber(phone)}</p>
                    </div>
                  </a>
                )}
                {website && (
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-70">Web</p>
                      <p className="text-sm font-semibold truncate max-w-[120px]">{website.replace(/^https?:\/\//, "")}</p>
                    </div>
                  </a>
                )}
                {location && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-70">Location</p>
                      <p className="text-sm font-semibold">{location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main hero content */}
            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute -top-4 -left-4 w-24 h-24 border-4 border-orange-400/30 rounded-3xl rotate-12" />
              <div className="absolute top-8 -right-8 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl rotate-[-15deg] opacity-60" />

              {/* Logo card */}
              <div className="relative z-10 inline-block mb-8">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 p-1 shadow-xl shadow-orange-500/25">
                  <div className="w-full h-full rounded-[20px] bg-white flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold bg-gradient-to-br from-orange-500 to-pink-500 bg-clip-text text-transparent">
                        {initials}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Category badge */}
              {categoryName && (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    {categoryName}
                  </span>
                </div>
              )}

              {/* Business name */}
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-4 leading-tight"
                style={{ fontFamily: "'Poppins', 'Nunito', sans-serif" }}
              >
                {businessName}
              </h1>

              {/* Location */}
              {location && (
                <div className="flex items-center gap-2 text-gray-500 mb-8">
                  <MapPin className="w-5 h-5 text-pink-500" />
                  <span className="text-lg">{location}</span>
                </div>
              )}

              {/* Description */}
              {description && (
                <div className="relative mb-8">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-pink-500 rounded-full" />
                  <p className="text-lg text-gray-600 leading-relaxed max-w-2xl pl-4">
                    {description}
                  </p>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all hover:-translate-y-0.5"
                  >
                    <Phone className="w-5 h-5" />
                    {formatPhoneNumber(phone)}
                  </a>
                )}
                {website && (
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 font-semibold rounded-2xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all hover:-translate-y-0.5"
                  >
                    <Globe className="w-5 h-5 text-purple-500" />
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Video Section */}
        {videoId && (
          <div className="px-6 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Decorative frame */}
                <div className="absolute -inset-3 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-3xl opacity-20 blur-xl" />
                <div className="relative bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 p-1 rounded-3xl">
                  <div className="aspect-video rounded-[20px] overflow-hidden bg-black">
                    <iframe
                      src={`${getVimeoEmbedUrl(videoId)}?background=0&autoplay=0&title=0&byline=0&portrait=0`}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title="Featured video"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Cards Section */}
        <div className="px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Contact Card */}
              <div className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </span>
                  Get in Touch
                </h3>

                <div className="space-y-4">
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Call us</p>
                        <p className="text-lg font-semibold text-gray-900">{formatPhoneNumber(phone)}</p>
                      </div>
                    </a>
                  )}

                  {website && (
                    <a
                      href={website.startsWith("http") ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                        <Globe className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Website</p>
                        <p className="text-lg font-semibold text-gray-900 truncate">
                          {website.replace(/^https?:\/\//, "")}
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* Reviews Card */}
              <div className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </span>
                  Reviews
                </h3>

                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-amber-400" />
                  </div>
                  <p className="text-gray-900 font-medium mb-1">No reviews yet</p>
                  <p className="text-gray-500 text-sm">Be the first to share your experience!</p>
                </div>
              </div>
            </div>

            {/* Rewards banner */}
            <div className="mt-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-3xl" />
              <div className="relative p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold">Local City Places Partner</p>
                    <p className="text-white/80 text-sm">Earn rewards every time you shop here</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                    Learn More →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-[#FFF8F0] to-transparent" />
        <div className="bg-white/90 backdrop-blur-lg border-t border-gray-200 p-4">
          <div className="flex gap-3">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl"
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
                className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-200 font-semibold rounded-xl"
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
