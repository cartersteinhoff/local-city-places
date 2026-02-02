"use client";

/**
 * DESIGN 18: "Professional Dark"
 *
 * Sleek, corporate, trustworthy.
 * Dark slate background, clean lines, professional feel.
 * Good for B2B and professional services.
 */

import { MapPin, Phone, Globe, Share2, Star, Briefcase } from "lucide-react";
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

export function ProfessionalDarkDesign({
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
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-sky-400" />
            <span className="text-sm font-medium text-slate-400">Local City Places</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </header>

      {/* Contact Bar */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-3 text-slate-300 hover:text-sky-400 transition-colors">
                <div className="w-11 h-11 rounded-lg bg-slate-700 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Phone</p>
                  <p className="font-medium">{formatPhoneNumber(phone)}</p>
                </div>
              </a>
            )}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-300 hover:text-sky-400 transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-slate-700 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Website</p>
                  <p className="font-medium truncate max-w-[150px]">{website.replace(/^https?:\/\//, "")}</p>
                </div>
              </a>
            )}
            {location && (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-slate-700 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Location</p>
                  <p className="font-medium text-slate-300">{location}</p>
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
              <div className="w-24 h-24 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-sky-400">{initials}</span>
                )}
              </div>
            </div>

            {/* Category */}
            {categoryName && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-sky-500/10 text-sky-400 text-sm font-medium rounded border border-sky-500/20">
                  {categoryName}
                </span>
              </div>
            )}

            {/* Business Name */}
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
              {businessName}
            </h1>

            {/* Description */}
            {description && (
              <p className="text-lg text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
                {description}
              </p>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition-colors cursor-pointer"
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
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-600 text-slate-300 font-medium rounded-lg hover:border-sky-500 hover:text-sky-400 transition-colors cursor-pointer"
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
                className="relative w-[260px] sm:w-[300px] rounded-xl overflow-hidden bg-slate-800 border border-slate-700"
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
              <div className="w-48 h-48 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Briefcase className="w-16 h-16 text-slate-700" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold text-white mb-6">Reviews</h2>
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8 text-center">
            <Star className="w-10 h-10 text-slate-600 mx-auto mb-4" />
            <p className="text-white font-medium mb-1">No reviews yet</p>
            <p className="text-slate-500 text-sm">Be the first to leave a review</p>
          </div>
        </div>
      </div>

      {/* Partner Banner */}
      <div className="bg-sky-500">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center text-white">
          <p className="font-semibold">Local City Places Partner</p>
          <p className="text-sky-100 text-sm">Earn rewards every time you visit</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-slate-500">© Local City Places</p>
        </div>
      </footer>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-slate-900 border-t border-slate-800 p-4">
        <div className="flex gap-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-sky-500 text-white font-medium rounded-lg cursor-pointer"
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
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-700 text-slate-300 font-medium rounded-lg cursor-pointer"
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
