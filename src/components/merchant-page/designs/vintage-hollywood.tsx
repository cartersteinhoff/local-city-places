"use client";

/**
 * DESIGN: "Vintage Hollywood"
 *
 * Old Hollywood glamour, red carpet vibes.
 * Deep burgundy/black with silver/platinum accents.
 * Spotlight effects and dramatic typography.
 */

import { Cinzel, Lato } from "next/font/google";
import { MapPin, Phone, Globe, Share2, Star, Award, Clock, Instagram, Facebook, Navigation, Image } from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils";
import { extractVimeoId, getVimeoEmbedUrl } from "@/lib/vimeo";
import { useState } from "react";
import { GoogleMapEmbed, getGoogleMapsDirectionsUrl, formatFullAddress } from "../google-map-embed";

const cinzel = Cinzel({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const lato = Lato({
  weight: ["300", "400", "700"],
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

export function VintageHollywoodDesign({
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
    <div className="min-h-screen text-[#E8E8E8]" style={{
      background: `
        radial-gradient(ellipse at top center, rgba(192, 192, 192, 0.1) 0%, transparent 40%),
        radial-gradient(ellipse at 20% 80%, rgba(139, 0, 0, 0.08) 0%, transparent 30%),
        radial-gradient(ellipse at 80% 80%, rgba(139, 0, 0, 0.08) 0%, transparent 30%),
        linear-gradient(to bottom, #1a0a0a, #0d0d0d, #0a0a0a)
      `
    }}>
      {/* Vintage curtain/drape pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='80' viewBox='0 0 40 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 Q20 20 40 0 Q20 40 40 80 Q20 60 0 80 Q20 40 0 0' fill='none' stroke='%23C0C0C0' stroke-width='0.5'/%3E%3Cpath d='M20 0 L20 80' stroke='%23C0C0C0' stroke-width='0.3' stroke-dasharray='2,4'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 80px',
        }}
      />
      {/* Spotlight effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-[#C0C0C0]/8 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Silver top border */}
      <div className="h-1 bg-gradient-to-r from-[#71706E] via-[#C0C0C0] to-[#71706E]" />

      {/* Header */}
      <header className="border-b border-[#C0C0C0]/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-[#C0C0C0]" />
            <span className={`text-sm tracking-[0.2em] uppercase text-[#C0C0C0]/70 ${lato.className}`}>Local City Places</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm text-[#C0C0C0]/70 hover:text-[#C0C0C0] transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </header>

      {/* Section Navigation */}
      <nav className="bg-[#0d0d0d]/95 border-b border-[#C0C0C0]/20 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-1 sm:gap-2 py-2 overflow-x-auto">
            {aboutStory && (
              <a href="#story" className={`px-3 py-2 text-xs tracking-[0.15em] uppercase text-[#C0C0C0]/60 hover:text-[#C0C0C0] transition-all ${lato.className}`}>Story</a>
            )}
            {hours && Object.values(hours).some(Boolean) && (
              <a href="#hours" className={`px-3 py-2 text-xs tracking-[0.15em] uppercase text-[#C0C0C0]/60 hover:text-[#C0C0C0] transition-all ${lato.className}`}>Hours</a>
            )}
            <a href="#location" className={`px-3 py-2 text-xs tracking-[0.15em] uppercase text-[#C0C0C0]/60 hover:text-[#C0C0C0] transition-all ${lato.className}`}>Location</a>
            {services && services.length > 0 && (
              <a href="#services" className={`px-3 py-2 text-xs tracking-[0.15em] uppercase text-[#C0C0C0]/60 hover:text-[#C0C0C0] transition-all ${lato.className}`}>Services</a>
            )}
            {photos && photos.length > 0 && (
              <a href="#gallery" className={`px-3 py-2 text-xs tracking-[0.15em] uppercase text-[#C0C0C0]/60 hover:text-[#C0C0C0] transition-all ${lato.className}`}>Gallery</a>
            )}
            <a href="#reviews" className={`px-3 py-2 text-xs tracking-[0.15em] uppercase text-[#C0C0C0]/60 hover:text-[#C0C0C0] transition-all ${lato.className}`}>Reviews</a>
          </div>
        </div>
      </nav>

      {/* Contact Strip - Red Carpet */}
      <div className="bg-gradient-to-r from-[#4a0000] via-[#6b0000] to-[#4a0000] text-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-8">
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Phone className="w-5 h-5 text-[#C0C0C0]" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#C0C0C0]/70">Call</p>
                  <p className={`font-medium ${lato.className}`}>{formatPhoneNumber(phone)}</p>
                </div>
              </a>
            )}
            {website && (
              <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Globe className="w-5 h-5 text-[#C0C0C0]" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#C0C0C0]/70">Website</p>
                  <p className={`font-medium ${lato.className}`}>{website.replace(/^https?:\/\//, "")}</p>
                </div>
              </a>
            )}
            {(fullAddress || location) && (
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <MapPin className="w-5 h-5 text-[#C0C0C0]" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#C0C0C0]/70">Location</p>
                  <p className={`font-medium whitespace-nowrap ${lato.className}`}>{[streetAddress, city, state, zipCode].filter(Boolean).join(", ") || location}</p>
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
              {/* Logo with spotlight ring */}
              <div className="inline-block mb-8">
                <div className="relative">
                  <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-b from-[#C0C0C0]/20 to-transparent blur-xl" />
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border-4 border-[#C0C0C0]/50 flex items-center justify-center overflow-hidden shadow-2xl">
                    {logoUrl ? (
                      <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                    ) : (
                      <span className={`text-4xl text-[#C0C0C0] ${cinzel.className}`}>{initials}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Category */}
              {categoryName && (
                <div className="mb-4">
                  <span className={`inline-flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-[#71706E] to-[#C0C0C0] text-black text-sm tracking-widest uppercase ${lato.className}`}>
                    <Star className="w-3 h-3" />
                    {categoryName}
                    <Star className="w-3 h-3" />
                  </span>
                </div>
              )}

              {/* Business Name */}
              <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-b from-[#FFFFFF] via-[#C0C0C0] to-[#71706E] bg-clip-text text-transparent ${cinzel.className}`}>
                {businessName}
              </h1>

              {/* Description */}
              {description && (
                <p className={`text-lg text-[#E8E8E8]/70 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-10 ${lato.className}`}>
                  {description}
                </p>
              )}

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {phone && (
                  <a href={`tel:${phone}`} className={`inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#71706E] to-[#C0C0C0] text-black font-semibold hover:opacity-90 transition-opacity cursor-pointer ${cinzel.className}`}>
                    <Phone className="w-5 h-5" />
                    Call Now
                  </a>
                )}
                {website && (
                  <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-[#C0C0C0]/50 text-[#C0C0C0] hover:bg-[#C0C0C0]/10 transition-colors cursor-pointer ${cinzel.className}`}>
                    <Globe className="w-5 h-5" />
                    Visit Website
                  </a>
                )}
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-[#C0C0C0]/50 text-[#C0C0C0] hover:bg-[#C0C0C0]/10 transition-colors cursor-pointer ${cinzel.className}`}>
                  <Navigation className="w-5 h-5" />
                  Directions
                </a>
              </div>
            </div>

            {/* Right - Video with Film Reel Frame */}
            {videoId && (
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Spotlight glow */}
                  <div className="absolute -inset-8 bg-gradient-radial from-[#C0C0C0]/20 via-transparent to-transparent blur-2xl" />

                  {/* Film strip perforations - left */}
                  <div className="absolute -left-6 top-0 bottom-0 w-4 flex flex-col justify-around py-4">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="w-3 h-4 bg-[#C0C0C0]/30 rounded-sm" />
                    ))}
                  </div>

                  {/* Film strip perforations - right */}
                  <div className="absolute -right-6 top-0 bottom-0 w-4 flex flex-col justify-around py-4">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="w-3 h-4 bg-[#C0C0C0]/30 rounded-sm" />
                    ))}
                  </div>

                  {/* Star decorations */}
                  <Star className="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-6 text-[#C0C0C0]" />
                  <Star className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-6 h-6 text-[#C0C0C0]" />

                  {/* Video container */}
                  <div className="relative w-[280px] sm:w-[320px] border-4 border-[#C0C0C0]/60 bg-black overflow-hidden shadow-2xl" style={{ aspectRatio: '9/16' }}>
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
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center">
                    <p className={`text-[10px] tracking-[0.3em] uppercase text-[#C0C0C0]/70 ${lato.className}`}>Now Showing</p>
                  </div>
                </div>
              </div>
            )}

            {!videoId && (
              <div className="hidden lg:flex justify-center">
                <div className="w-48 h-48 rounded-full border-2 border-[#C0C0C0]/20 flex items-center justify-center bg-gradient-to-b from-[#1a1a1a] to-transparent">
                  <Award className="w-16 h-16 text-[#C0C0C0]/20" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center py-8">
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#C0C0C0]/30 to-transparent" />
          <Star className="w-4 h-4 text-[#C0C0C0]/30 mx-4" />
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#C0C0C0]/30 to-transparent" />
        </div>

        {/* About Section */}
        {aboutStory && (
          <div id="story" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
            <h2 className={`text-3xl text-[#C0C0C0] text-center mb-8 ${cinzel.className}`}>Our Story</h2>
            <div className="border border-[#C0C0C0]/20 p-8 bg-gradient-to-b from-[#1a1a1a]/50 to-transparent rounded-lg">
              <p className={`text-lg text-[#E8E8E8]/80 leading-relaxed whitespace-pre-line ${lato.className}`}>{aboutStory}</p>
            </div>
          </div>
        )}

        {/* Hours Section */}
        {hours && Object.values(hours).some(Boolean) && (
          <div id="hours" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
            <div className="flex items-center justify-center gap-4 mb-8">
              <Clock className="w-6 h-6 text-[#C0C0C0]" />
              <h2 className={`text-3xl text-[#C0C0C0] ${cinzel.className}`}>Hours</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 border border-[#C0C0C0]/20 p-8 bg-gradient-to-b from-[#1a1a1a]/50 to-transparent rounded-lg">
              {[
                { day: "Monday", value: hours.monday },
                { day: "Tuesday", value: hours.tuesday },
                { day: "Wednesday", value: hours.wednesday },
                { day: "Thursday", value: hours.thursday },
                { day: "Friday", value: hours.friday },
                { day: "Saturday", value: hours.saturday },
                { day: "Sunday", value: hours.sunday },
              ].map(({ day, value }) => (
                <div key={day} className="flex justify-between py-2 border-b border-[#C0C0C0]/10 last:border-0">
                  <span className={`text-[#C0C0C0] ${lato.className}`}>{day}</span>
                  <span className={`text-[#E8E8E8]/70 ${lato.className}`}>{value || "Closed"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Section */}
        <div id="location" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
          <div className="flex items-center justify-center gap-4 mb-8">
            <MapPin className="w-6 h-6 text-[#C0C0C0]" />
            <h2 className={`text-3xl text-[#C0C0C0] ${cinzel.className}`}>Location</h2>
          </div>
          {fullAddress && <p className={`text-center text-[#E8E8E8]/70 mb-6 ${lato.className}`}>{fullAddress}</p>}
          <div className="border border-[#C0C0C0]/20 rounded-lg overflow-hidden">
            <GoogleMapEmbed businessName={businessName} streetAddress={streetAddress} city={city} state={state} zipCode={zipCode} googlePlaceId={googlePlaceId} height="300px" mapStyle="dark" />
          </div>
        </div>

        {/* Services Section */}
        {services && services.length > 0 && (
          <div id="services" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
            <h2 className={`text-3xl text-[#C0C0C0] text-center mb-8 ${cinzel.className}`}>Services</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, idx) => (
                <div key={idx} className="border border-[#C0C0C0]/20 p-6 bg-gradient-to-b from-[#1a1a1a]/50 to-transparent rounded-lg hover:border-[#C0C0C0]/40 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-xl text-[#C0C0C0] ${cinzel.className}`}>{service.name}</h3>
                    {service.price && <span className={`text-[#C0C0C0] ${lato.className}`}>{service.price}</span>}
                  </div>
                  {service.description && <p className={`text-[#E8E8E8]/60 ${lato.className}`}>{service.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery Section */}
        {photos && photos.length > 0 && (
          <div id="gallery" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
            <div className="flex items-center justify-center gap-4 mb-8">
              <Image className="w-6 h-6 text-[#C0C0C0]" />
              <h2 className={`text-3xl text-[#C0C0C0] ${cinzel.className}`}>Gallery</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((photo, idx) => (
                <div key={idx} className="aspect-square border border-[#C0C0C0]/20 overflow-hidden rounded-lg group">
                  <img src={photo} alt={`${businessName} photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div id="reviews" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
          <h2 className={`text-3xl text-[#C0C0C0] text-center mb-8 ${cinzel.className}`}>Reviews</h2>
          <div className="border border-[#C0C0C0]/20 p-12 text-center bg-gradient-to-b from-[#1a1a1a]/50 to-transparent rounded-lg">
            <Star className="w-10 h-10 text-[#C0C0C0]/40 mx-auto mb-4" />
            <p className={`text-[#E8E8E8]/50 ${lato.className}`}>No reviews yet</p>
            <p className={`text-[#E8E8E8]/30 text-sm ${lato.className}`}>Be the first to share your experience</p>
          </div>
        </div>

        {/* Social Links */}
        {(instagramUrl || facebookUrl || tiktokUrl) && (
          <div className="border-t border-[#C0C0C0]/20 py-8">
            <div className="flex items-center justify-center gap-6">
              <span className={`text-[#E8E8E8]/50 ${lato.className}`}>Follow Us</span>
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 border border-[#C0C0C0]/30 rounded-full flex items-center justify-center hover:bg-[#C0C0C0]/10 transition-all">
                  <Instagram className="w-5 h-5 text-[#C0C0C0]" />
                </a>
              )}
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 border border-[#C0C0C0]/30 rounded-full flex items-center justify-center hover:bg-[#C0C0C0]/10 transition-all">
                  <Facebook className="w-5 h-5 text-[#C0C0C0]" />
                </a>
              )}
              {tiktokUrl && (
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 border border-[#C0C0C0]/30 rounded-full flex items-center justify-center hover:bg-[#C0C0C0]/10 transition-all">
                  <svg className="w-5 h-5 text-[#C0C0C0]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-[#C0C0C0]/20 py-6">
          <p className={`text-center text-xs text-[#E8E8E8]/30 tracking-widest uppercase ${lato.className}`}>© Local City Places</p>
        </footer>
      </div>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-[#0d0d0d]/95 border-t border-[#C0C0C0]/30 p-4">
        <div className="flex gap-3">
          {phone && (
            <a href={`tel:${phone}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#71706E] to-[#C0C0C0] text-black font-medium rounded">
              <Phone className="w-4 h-4" /> Call
            </a>
          )}
          {website && (
            <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#C0C0C0]/50 text-[#C0C0C0] rounded">
              <Globe className="w-4 h-4" /> Website
            </a>
          )}
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  );
}
