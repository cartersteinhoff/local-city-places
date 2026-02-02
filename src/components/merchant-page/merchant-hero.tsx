"use client";

import { MapPin, Phone, Globe, Share2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPhoneNumber } from "@/lib/utils";
import { extractVimeoId, getVimeoEmbedUrl } from "@/lib/vimeo";
import { useState } from "react";

interface MerchantHeroProps {
  businessName: string;
  city?: string | null;
  state?: string | null;
  logoUrl?: string | null;
  categoryName?: string | null;
  phone?: string | null;
  website?: string | null;
  vimeoUrl?: string | null;
}

export function MerchantHero({
  businessName,
  city,
  state,
  logoUrl,
  categoryName,
  phone,
  website,
  vimeoUrl,
}: MerchantHeroProps) {
  const [copied, setCopied] = useState(false);

  const initials = businessName
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const location = [city, state].filter(Boolean).join(", ");
  const videoId = vimeoUrl ? extractVimeoId(vimeoUrl) : null;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: businessName, url });
      } catch (e) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative">
      {/* Background */}
      <div className="absolute inset-0 h-[420px] sm:h-[480px] overflow-hidden">
        {/* Gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Content */}
      <div className="relative px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-6">
        <div className="max-w-5xl mx-auto">
          {/* Top section with logo and info */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Logo */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden flex-shrink-0 ring-1 ring-white/20">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={businessName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 text-white text-3xl sm:text-4xl font-bold">
                  {initials}
                </div>
              )}
            </div>

            {/* Business info */}
            <div className="flex-1 min-w-0">
              {categoryName && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/90 backdrop-blur-sm mb-3">
                  {categoryName}
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight">
                {businessName}
              </h1>
              {location && (
                <div className="flex items-center gap-2 text-white/70 text-lg">
                  <MapPin className="w-5 h-5" />
                  <span>{location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-8">
            {phone && (
              <Button
                size="lg"
                className="bg-white text-slate-900 hover:bg-white/90 shadow-lg gap-2 font-semibold"
                asChild
              >
                <a href={`tel:${phone}`}>
                  <Phone className="w-5 h-5" />
                  {formatPhoneNumber(phone)}
                </a>
              </Button>
            )}
            {website && (
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm gap-2"
                asChild
              >
                <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-5 h-5" />
                  Visit Website
                </a>
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm gap-2"
              onClick={handleShare}
            >
              <Share2 className="w-5 h-5" />
              {copied ? "Copied!" : "Share"}
            </Button>
          </div>

          {/* Video preview card - if video exists */}
          {videoId && (
            <div className="mt-8">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <div className="aspect-video">
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
          )}

          {/* Scroll indicator */}
          <div className="flex justify-center mt-8 sm:mt-12">
            <div className="flex flex-col items-center gap-2 text-white/40">
              <span className="text-xs uppercase tracking-wider">Scroll for more</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
