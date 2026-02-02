"use client";

/**
 * DESIGN 4: "Coastal Breeze"
 *
 * Light, airy, beach-inspired design.
 * Soft blues, sandy neutrals, gentle waves.
 * Relaxed but professional atmosphere.
 * Vertical video displayed in phone mockup.
 */

import { MapPin, Phone, Globe, Share2, Star, Waves } from "lucide-react";
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

export function CoastalBreezeDesign({
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
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4F8] via-[#F5F9FA] to-[#FDF8F3]">
      {/* Subtle wave pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%230EA5E9' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header with contact */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-sky-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-cyan-300 flex items-center justify-center">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-sky-900/60 hidden sm:block">Local City Places</span>
            </div>

            {/* Contact buttons - prominent */}
            <div className="flex items-center gap-2">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-full text-sm font-medium transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">{formatPhoneNumber(phone)}</span>
                  <span className="sm:hidden">Call</span>
                </a>
              )}
              {website && (
                <a
                  href={website.startsWith("http") ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-sky-50 text-sky-700 rounded-full text-sm font-medium border border-sky-200 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Website</span>
                </a>
              )}
              <button
                onClick={handleShare}
                className="p-2 hover:bg-sky-50 rounded-full transition-colors text-sky-600"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative">
        {/* Hero Section */}
        <div className="px-4 py-8 lg:py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left - Business info */}
              <div className="text-center lg:text-left">
                {/* Logo */}
                <div className="inline-block mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-white shadow-lg shadow-sky-200/50 border border-sky-100 flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-sky-500">{initials}</span>
                    )}
                  </div>
                </div>

                {/* Category */}
                {categoryName && (
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-sm font-medium">
                      {categoryName}
                    </span>
                  </div>
                )}

                {/* Business name */}
                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-800 mb-4 leading-tight"
                  style={{ fontFamily: "'Outfit', 'DM Sans', sans-serif" }}
                >
                  {businessName}
                </h1>

                {/* Location */}
                {location && (
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-slate-500 mb-6">
                    <MapPin className="w-5 h-5 text-sky-500" />
                    <span className="text-lg">{location}</span>
                  </div>
                )}

                {/* Description */}
                {description && (
                  <p className="text-lg text-slate-600 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
                    {description}
                  </p>
                )}

                {/* Large CTA buttons for mobile */}
                <div className="flex flex-col sm:flex-row gap-3 lg:hidden">
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="flex items-center justify-center gap-2 px-6 py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl text-lg font-semibold transition-colors shadow-lg shadow-sky-500/30"
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
                      className="flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-sky-50 text-sky-700 rounded-2xl text-lg font-semibold border-2 border-sky-200 transition-colors"
                    >
                      <Globe className="w-5 h-5" />
                      Visit Website
                    </a>
                  )}
                </div>
              </div>

              {/* Right - Vertical Video in Phone Mockup */}
              {videoId && (
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Phone frame */}
                    <div className="relative w-[280px] sm:w-[320px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl shadow-slate-900/30">
                      {/* Phone notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-2xl z-10" />

                      {/* Screen */}
                      <div className="relative bg-black rounded-[2.25rem] overflow-hidden" style={{ aspectRatio: '9/16' }}>
                        <iframe
                          src={`${getVimeoEmbedUrl(videoId)}?background=0&autoplay=0&title=0&byline=0&portrait=0`}
                          className="absolute inset-0 w-full h-full"
                          frameBorder="0"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                          title="Featured video"
                        />
                      </div>

                      {/* Home indicator */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-sky-200 rounded-full blur-2xl opacity-60" />
                    <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-cyan-200 rounded-full blur-2xl opacity-60" />
                  </div>
                </div>
              )}

              {/* If no video, show decorative element */}
              {!videoId && (
                <div className="hidden lg:flex justify-center">
                  <div className="relative w-64 h-64">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-200 to-cyan-100 rounded-full blur-3xl opacity-60" />
                    <div className="absolute inset-8 bg-white rounded-full shadow-xl flex items-center justify-center">
                      <Waves className="w-16 h-16 text-sky-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Contact Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-sky-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-sky-600" />
                  </div>
                  Contact
                </h3>
                <div className="space-y-3">
                  {phone && (
                    <a href={`tel:${phone}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-sky-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Phone</p>
                        <p className="font-semibold text-slate-800">{formatPhoneNumber(phone)}</p>
                      </div>
                    </a>
                  )}
                  {website && (
                    <a
                      href={website.startsWith("http") ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-sky-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-500">Website</p>
                        <p className="font-semibold text-slate-800 truncate">{website.replace(/^https?:\/\//, "")}</p>
                      </div>
                    </a>
                  )}
                  {location && (
                    <div className="flex items-center gap-3 p-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Location</p>
                        <p className="font-semibold text-slate-800">{location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-sky-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Star className="w-4 h-4 text-amber-600" />
                  </div>
                  Reviews
                </h3>
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-sky-300" />
                  </div>
                  <p className="text-slate-600 font-medium mb-1">No reviews yet</p>
                  <p className="text-slate-400 text-sm">Be the first to share your experience</p>
                </div>
              </div>
            </div>

            {/* Partner badge */}
            <div className="mt-6 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Waves className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold">Local City Places Partner</p>
                  <p className="text-white/80 text-sm">Earn rewards every time you visit</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-4 py-6 border-t border-sky-100">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-sm text-slate-400">
              © Local City Places · Discover local favorites
            </p>
          </div>
        </footer>
      </div>

      {/* Mobile Action Bar - hidden since contact is in header */}
      <div className="h-0 lg:hidden" />
    </div>
  );
}
