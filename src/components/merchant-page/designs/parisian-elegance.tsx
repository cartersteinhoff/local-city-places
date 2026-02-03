"use client";

/**
 * DESIGN: "Parisian Elegance"
 *
 * French luxury, romantic sophistication.
 * Cream/blush/rose gold palette, ornate flourishes.
 * Elegant script and serif typography.
 */

import { Cormorant_Garamond, Great_Vibes } from "next/font/google";
import { MapPin, Phone, Globe, Share2, Star, Heart, Clock, Instagram, Facebook, Navigation, Image } from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils";
import { extractVimeoId, getVimeoEmbedUrl } from "@/lib/vimeo";
import { useState } from "react";
import { GoogleMapEmbed, getGoogleMapsDirectionsUrl, formatFullAddress } from "../google-map-embed";

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

interface MerchantPageProps {
  businessName: string;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  logoUrl?: string | null;
  categoryName?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  vimeoUrl?: string | null;
  googlePlaceId?: string | null;
  hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  } | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  photos?: string[] | null;
  services?: { name: string; description?: string; price?: string }[] | null;
  aboutStory?: string | null;
}

export function ParisianEleganceDesign({
  businessName,
  streetAddress,
  city,
  state,
  zipCode,
  logoUrl,
  categoryName,
  phone,
  website,
  description,
  vimeoUrl,
  googlePlaceId,
  hours,
  instagramUrl,
  facebookUrl,
  tiktokUrl,
  photos,
  services,
  aboutStory,
}: MerchantPageProps) {
  const [copied, setCopied] = useState(false);
  const location = [city, state].filter(Boolean).join(", ");
  const fullAddress = formatFullAddress(streetAddress, city, state, zipCode);
  const videoId = vimeoUrl ? extractVimeoId(vimeoUrl) : null;
  const directionsUrl = getGoogleMapsDirectionsUrl(businessName, streetAddress, city, state, zipCode, googlePlaceId);

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
    <div className="min-h-screen bg-[#FDF8F5] text-[#2C1810]">
      {/* Subtle pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B8860B' fill-opacity='1'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Rose gold top border */}
      <div className="h-1 bg-gradient-to-r from-[#E8D5C4] via-[#B8860B] to-[#E8D5C4]" />

      {/* Header */}
      <header className="border-b border-[#B8860B]/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-[#B8860B]" />
            <span className={`text-sm tracking-widest uppercase text-[#B8860B]/70 ${cormorant.className}`}>Local City Places</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm text-[#B8860B]/70 hover:text-[#B8860B] transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </header>

      {/* Section Navigation */}
      <nav className="bg-[#FDF8F5]/95 border-b border-[#B8860B]/20 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-1 sm:gap-2 py-2 overflow-x-auto">
            {aboutStory && (
              <a href="#story" className={`px-3 py-2 text-xs tracking-widest uppercase text-[#B8860B]/60 hover:text-[#B8860B] transition-all ${cormorant.className}`}>Story</a>
            )}
            {hours && Object.values(hours).some(Boolean) && (
              <a href="#hours" className={`px-3 py-2 text-xs tracking-widest uppercase text-[#B8860B]/60 hover:text-[#B8860B] transition-all ${cormorant.className}`}>Hours</a>
            )}
            {services && services.length > 0 && (
              <a href="#services" className={`px-3 py-2 text-xs tracking-widest uppercase text-[#B8860B]/60 hover:text-[#B8860B] transition-all ${cormorant.className}`}>Services</a>
            )}
            {photos && photos.length > 0 && (
              <a href="#gallery" className={`px-3 py-2 text-xs tracking-widest uppercase text-[#B8860B]/60 hover:text-[#B8860B] transition-all ${cormorant.className}`}>Gallery</a>
            )}
            <a href="#location" className={`px-3 py-2 text-xs tracking-widest uppercase text-[#B8860B]/60 hover:text-[#B8860B] transition-all ${cormorant.className}`}>Location</a>
            <a href="#reviews" className={`px-3 py-2 text-xs tracking-widest uppercase text-[#B8860B]/60 hover:text-[#B8860B] transition-all ${cormorant.className}`}>Reviews</a>
          </div>
        </div>
      </nav>

      {/* Contact Strip - Blush */}
      <div className="bg-gradient-to-r from-[#E8D5C4] via-[#F5E6D8] to-[#E8D5C4] text-[#2C1810]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-8">
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Phone className="w-5 h-5 text-[#B8860B]" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#B8860B]/70">Telephone</p>
                  <p className={`font-medium ${cormorant.className}`}>{formatPhoneNumber(phone)}</p>
                </div>
              </a>
            )}
            {website && (
              <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Globe className="w-5 h-5 text-[#B8860B]" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#B8860B]/70">Website</p>
                  <p className={`font-medium ${cormorant.className}`}>{website.replace(/^https?:\/\//, "")}</p>
                </div>
              </a>
            )}
            {(fullAddress || location) && (
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <MapPin className="w-5 h-5 text-[#B8860B]" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#B8860B]/70">Location</p>
                  <p className={`font-medium whitespace-nowrap ${cormorant.className}`}>{[streetAddress, city, state, zipCode].filter(Boolean).join(", ") || location}</p>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Business Info */}
            <div className="text-center lg:text-left">
              {/* Logo with ornate border */}
              <div className="inline-block mb-8">
                <div className="relative">
                  {/* Decorative corners */}
                  <svg className="absolute -top-4 -left-4 w-8 h-8 text-[#B8860B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M2 12 C2 6, 6 2, 12 2" />
                    <path d="M2 8 C2 4, 4 2, 8 2" />
                  </svg>
                  <svg className="absolute -top-4 -right-4 w-8 h-8 text-[#B8860B] rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M2 12 C2 6, 6 2, 12 2" />
                    <path d="M2 8 C2 4, 4 2, 8 2" />
                  </svg>
                  <svg className="absolute -bottom-4 -left-4 w-8 h-8 text-[#B8860B] -rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M2 12 C2 6, 6 2, 12 2" />
                    <path d="M2 8 C2 4, 4 2, 8 2" />
                  </svg>
                  <svg className="absolute -bottom-4 -right-4 w-8 h-8 text-[#B8860B] rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M2 12 C2 6, 6 2, 12 2" />
                    <path d="M2 8 C2 4, 4 2, 8 2" />
                  </svg>
                  <div className="w-28 h-28 rounded-full bg-white border-2 border-[#B8860B]/30 flex items-center justify-center overflow-hidden shadow-lg">
                    {logoUrl ? (
                      <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                    ) : (
                      <span className={`text-4xl text-[#B8860B] ${greatVibes.className}`}>{initials}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Category */}
              {categoryName && (
                <div className="mb-4">
                  <span className={`inline-flex items-center gap-3 text-sm tracking-widest uppercase text-[#B8860B] ${cormorant.className}`}>
                    <span className="w-8 h-px bg-[#B8860B]/30" />
                    {categoryName}
                    <span className="w-8 h-px bg-[#B8860B]/30" />
                  </span>
                </div>
              )}

              {/* Business Name */}
              <h1 className={`text-5xl sm:text-6xl lg:text-7xl mb-6 leading-tight text-[#2C1810] ${greatVibes.className}`}>
                {businessName}
              </h1>

              {/* Description */}
              {description && (
                <p className={`text-lg text-[#2C1810]/70 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-10 italic ${cormorant.className}`}>
                  {description}
                </p>
              )}

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {phone && (
                  <a href={`tel:${phone}`} className={`inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#B8860B] text-white font-medium hover:bg-[#9A7209] transition-colors cursor-pointer rounded-full ${cormorant.className}`}>
                    <Phone className="w-5 h-5" />
                    Call Now
                  </a>
                )}
                {website && (
                  <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B]/10 transition-colors cursor-pointer rounded-full ${cormorant.className}`}>
                    <Globe className="w-5 h-5" />
                    Visit Website
                  </a>
                )}
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B]/10 transition-colors cursor-pointer rounded-full ${cormorant.className}`}>
                  <Navigation className="w-5 h-5" />
                  Directions
                </a>
              </div>
            </div>

            {/* Right - Video */}
            {videoId && (
              <div className="flex justify-center lg:justify-end">
                <div className="relative w-[280px] sm:w-[320px] rounded-2xl overflow-hidden border-4 border-[#E8D5C4] shadow-xl" style={{ aspectRatio: '9/16' }}>
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

            {!videoId && (
              <div className="hidden lg:flex justify-center">
                <div className="w-48 h-48 rounded-full border-2 border-[#B8860B]/20 flex items-center justify-center bg-white/50">
                  <Heart className="w-16 h-16 text-[#B8860B]/20" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center py-8">
          <div className="w-24 h-px bg-gradient-to-r from-transparent to-[#B8860B]/30" />
          <Heart className="w-5 h-5 text-[#B8860B]/30 mx-4" />
          <div className="w-24 h-px bg-gradient-to-l from-transparent to-[#B8860B]/30" />
        </div>

        {/* About Section */}
        {aboutStory && (
          <div id="story" className="max-w-4xl mx-auto px-4 py-12 scroll-mt-16">
            <h2 className={`text-4xl text-[#B8860B] text-center mb-8 ${greatVibes.className}`}>Our Story</h2>
            <div className="border border-[#B8860B]/20 p-8 bg-white/50 rounded-2xl">
              <p className={`text-lg text-[#2C1810]/80 leading-relaxed whitespace-pre-line ${cormorant.className}`}>{aboutStory}</p>
            </div>
          </div>
        )}

        {/* Hours Section */}
        {hours && Object.values(hours).some(Boolean) && (
          <div id="hours" className="max-w-4xl mx-auto px-4 py-12 scroll-mt-16">
            <div className="flex items-center justify-center gap-4 mb-8">
              <Clock className="w-6 h-6 text-[#B8860B]" />
              <h2 className={`text-4xl text-[#B8860B] ${greatVibes.className}`}>Hours</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 border border-[#B8860B]/20 p-8 bg-white/50 rounded-2xl">
              {[
                { day: "Monday", value: hours.monday },
                { day: "Tuesday", value: hours.tuesday },
                { day: "Wednesday", value: hours.wednesday },
                { day: "Thursday", value: hours.thursday },
                { day: "Friday", value: hours.friday },
                { day: "Saturday", value: hours.saturday },
                { day: "Sunday", value: hours.sunday },
              ].map(({ day, value }) => (
                <div key={day} className="flex justify-between py-2 border-b border-[#B8860B]/10 last:border-0">
                  <span className={`text-[#B8860B] ${cormorant.className}`}>{day}</span>
                  <span className={`text-[#2C1810]/70 ${cormorant.className}`}>{value || "Closed"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services Section */}
        {services && services.length > 0 && (
          <div id="services" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
            <h2 className={`text-4xl text-[#B8860B] text-center mb-8 ${greatVibes.className}`}>Services</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, idx) => (
                <div key={idx} className="border border-[#B8860B]/20 p-6 bg-white/50 rounded-2xl hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-xl text-[#B8860B] ${greatVibes.className}`}>{service.name}</h3>
                    {service.price && <span className={`text-[#B8860B] ${cormorant.className}`}>{service.price}</span>}
                  </div>
                  {service.description && <p className={`text-[#2C1810]/60 ${cormorant.className}`}>{service.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery Section */}
        {photos && photos.length > 0 && (
          <div id="gallery" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
            <div className="flex items-center justify-center gap-4 mb-8">
              <Image className="w-6 h-6 text-[#B8860B]" />
              <h2 className={`text-4xl text-[#B8860B] ${greatVibes.className}`}>Gallery</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((photo, idx) => (
                <div key={idx} className="aspect-square border-2 border-[#E8D5C4] overflow-hidden rounded-2xl group shadow-md">
                  <img src={photo} alt={`${businessName} photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map Section */}
        <div id="location" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
          <div className="flex items-center justify-center gap-4 mb-8">
            <MapPin className="w-6 h-6 text-[#B8860B]" />
            <h2 className={`text-4xl text-[#B8860B] ${greatVibes.className}`}>Location</h2>
          </div>
          {fullAddress && <p className={`text-center text-[#2C1810]/70 mb-6 ${cormorant.className}`}>{fullAddress}</p>}
          <div className="border-2 border-[#E8D5C4] rounded-2xl overflow-hidden shadow-lg">
            <GoogleMapEmbed businessName={businessName} streetAddress={streetAddress} city={city} state={state} zipCode={zipCode} googlePlaceId={googlePlaceId} height="300px" mapStyle="warm" />
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews" className="max-w-4xl mx-auto px-4 py-12 scroll-mt-16">
          <h2 className={`text-4xl text-[#B8860B] text-center mb-8 ${greatVibes.className}`}>Reviews</h2>
          <div className="border border-[#B8860B]/20 p-12 text-center bg-white/50 rounded-2xl">
            <Star className="w-10 h-10 text-[#B8860B]/40 mx-auto mb-4" />
            <p className={`text-[#2C1810]/50 ${cormorant.className}`}>No reviews yet</p>
            <p className={`text-[#2C1810]/30 text-sm ${cormorant.className}`}>Be the first to share your experience</p>
          </div>
        </div>

        {/* Social Links */}
        {(instagramUrl || facebookUrl || tiktokUrl) && (
          <div className="border-t border-[#B8860B]/20 py-8">
            <div className="flex items-center justify-center gap-6">
              <span className={`text-[#2C1810]/50 ${cormorant.className}`}>Follow Us</span>
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 border border-[#B8860B]/30 rounded-full flex items-center justify-center hover:bg-[#B8860B]/10 transition-all">
                  <Instagram className="w-5 h-5 text-[#B8860B]" />
                </a>
              )}
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 border border-[#B8860B]/30 rounded-full flex items-center justify-center hover:bg-[#B8860B]/10 transition-all">
                  <Facebook className="w-5 h-5 text-[#B8860B]" />
                </a>
              )}
              {tiktokUrl && (
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 border border-[#B8860B]/30 rounded-full flex items-center justify-center hover:bg-[#B8860B]/10 transition-all">
                  <svg className="w-5 h-5 text-[#B8860B]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-[#B8860B]/20 py-6">
          <p className={`text-center text-xs text-[#2C1810]/30 tracking-widest uppercase ${cormorant.className}`}>© Local City Places</p>
        </footer>
      </div>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-[#FDF8F5]/95 border-t border-[#B8860B]/30 p-4">
        <div className="flex gap-3">
          {phone && (
            <a href={`tel:${phone}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#B8860B] text-white font-medium rounded-full">
              <Phone className="w-4 h-4" /> Call
            </a>
          )}
          {website && (
            <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#B8860B] text-[#B8860B] rounded-full">
              <Globe className="w-4 h-4" /> Website
            </a>
          )}
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  );
}
