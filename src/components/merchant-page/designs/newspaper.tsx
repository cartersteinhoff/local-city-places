"use client";

/**
 * DESIGN 11: "Newspaper"
 *
 * Vintage newspaper/classified ad aesthetic.
 * Typewriter fonts, sepia tones, print feel.
 * Nostalgic and trustworthy vibe.
 */

import { MapPin, Phone, Globe, Share2, Star } from "lucide-react";
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

export function NewspaperDesign({
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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#F5F0E1]" style={{ fontFamily: "'Times New Roman', 'Georgia', serif" }}>
      {/* Paper texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Newspaper Header */}
      <header className="relative border-b-4 border-double border-[#2C2416] bg-[#F5F0E1]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="text-center border-b border-[#2C2416]/30 pb-2 mb-2">
            <p className="text-xs tracking-[0.3em] uppercase text-[#2C2416]/60">The</p>
            <h1
              className="text-4xl sm:text-5xl font-black tracking-tight text-[#2C2416]"
              style={{ fontFamily: "'Old Standard TT', 'Times New Roman', serif" }}
            >
              Local City Places
            </h1>
            <p className="text-xs tracking-[0.2em] uppercase text-[#2C2416]/60 mt-1">Gazette & Business Directory</p>
          </div>
          <div className="flex items-center justify-between text-xs text-[#2C2416]/60">
            <span>{today}</span>
            <button onClick={handleShare} className="hover:text-[#2C2416] transition-colors flex items-center gap-1">
              <Share2 className="w-3 h-3" />
              {copied ? "Copied!" : "Share This Article"}
            </button>
            <span>Price: FREE</span>
          </div>
        </div>
      </header>

      {/* Contact Classified Strip */}
      <div className="relative bg-[#2C2416] text-[#F5F0E1]">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm">
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-2 hover:underline">
                <Phone className="w-4 h-4" />
                <span style={{ fontFamily: "'Courier New', monospace" }}>{formatPhoneNumber(phone)}</span>
              </a>
            )}
            {phone && website && <span className="text-[#F5F0E1]/40">•</span>}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <Globe className="w-4 h-4" />
                <span style={{ fontFamily: "'Courier New', monospace" }} className="truncate max-w-[180px]">
                  {website.replace(/^https?:\/\//, "")}
                </span>
              </a>
            )}
            {(phone || website) && location && <span className="text-[#F5F0E1]/40">•</span>}
            {location && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Newspaper Layout */}
      <div className="relative">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Headline */}
          <div className="text-center mb-8 border-b-2 border-[#2C2416]/20 pb-6">
            {categoryName && (
              <p className="text-xs tracking-[0.3em] uppercase text-[#8B4513] mb-2">{categoryName}</p>
            )}
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#2C2416] leading-tight mb-4"
              style={{ fontFamily: "'Old Standard TT', 'Times New Roman', serif" }}
            >
              {businessName}
            </h2>
            <p className="text-sm italic text-[#2C2416]/60">
              A Distinguished Establishment in {location || "Your Community"}
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Column */}
            <div className="lg:col-span-2">
              {/* Article Lead */}
              <div className="mb-6">
                <span
                  className="text-6xl font-bold float-left mr-3 leading-none text-[#2C2416]"
                  style={{ fontFamily: "'Old Standard TT', serif" }}
                >
                  {businessName.charAt(0)}
                </span>
                {description ? (
                  <p className="text-lg leading-relaxed text-[#2C2416]/80 text-justify">
                    {description} This establishment has earned its reputation through dedication to excellence and commitment to serving the community with distinction.
                  </p>
                ) : (
                  <p className="text-lg leading-relaxed text-[#2C2416]/80 text-justify">
                    This distinguished establishment has earned its reputation through dedication to excellence and commitment to serving the community with distinction. Readers are encouraged to visit and experience the quality service firsthand.
                  </p>
                )}
              </div>

              {/* CTA Box */}
              <div className="border-2 border-[#2C2416] p-6 mb-6 bg-[#F5F0E1]">
                <p className="text-center text-xs tracking-[0.2em] uppercase text-[#2C2416]/60 mb-4">— Contact Information —</p>
                <div className="flex flex-wrap justify-center gap-4">
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#2C2416] text-[#F5F0E1] font-bold hover:bg-[#1a1610] transition-colors"
                      style={{ fontFamily: "'Courier New', monospace" }}
                    >
                      <Phone className="w-4 h-4" />
                      TELEPHONE
                    </a>
                  )}
                  {website && (
                    <a
                      href={website.startsWith("http") ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#2C2416] text-[#2C2416] font-bold hover:bg-[#2C2416] hover:text-[#F5F0E1] transition-colors"
                      style={{ fontFamily: "'Courier New', monospace" }}
                    >
                      <Globe className="w-4 h-4" />
                      WEBSITE
                    </a>
                  )}
                </div>
              </div>

              {/* Video Section */}
              {videoId && (
                <div className="mb-6">
                  <p className="text-xs tracking-[0.2em] uppercase text-[#2C2416]/60 mb-3 text-center">— Moving Picture Feature —</p>
                  <div className="border-2 border-[#2C2416] p-2 bg-[#2C2416]">
                    <div className="aspect-video bg-black">
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
                  <p className="text-xs italic text-center text-[#2C2416]/60 mt-2">
                    Fig. 1 — A visual presentation from {businessName}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Logo/Photo Box */}
              <div className="border-2 border-[#2C2416] p-4 mb-6 text-center bg-[#F5F0E1]">
                <div className="w-32 h-32 mx-auto bg-[#2C2416]/10 flex items-center justify-center overflow-hidden mb-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt={businessName} className="w-full h-full object-cover grayscale" />
                  ) : (
                    <span
                      className="text-5xl font-black text-[#2C2416]/30"
                      style={{ fontFamily: "'Old Standard TT', serif" }}
                    >
                      {initials}
                    </span>
                  )}
                </div>
                <p className="text-xs italic text-[#2C2416]/60">Portrait of Establishment</p>
              </div>

              {/* Reviews Box */}
              <div className="border-2 border-[#2C2416] p-4 mb-6 bg-[#F5F0E1]">
                <p className="text-xs tracking-[0.2em] uppercase text-center text-[#2C2416]/60 mb-4">— Reader Reviews —</p>
                <div className="text-center py-6">
                  <Star className="w-8 h-8 text-[#2C2416]/20 mx-auto mb-3" />
                  <p className="text-sm text-[#2C2416]/60 italic">No testimonials yet</p>
                  <p className="text-xs text-[#2C2416]/40 mt-1">Write to the Editor</p>
                </div>
              </div>

              {/* Partner Notice */}
              <div className="border border-dashed border-[#2C2416]/50 p-4 text-center">
                <p className="text-xs tracking-[0.2em] uppercase text-[#8B4513] mb-1">★ VERIFIED ★</p>
                <p className="text-sm font-bold text-[#2C2416]">Local City Partner</p>
                <p className="text-xs text-[#2C2416]/60 mt-1">Earn rewards with patronage</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t-2 border-[#2C2416]/30 mt-8">
          <div className="max-w-5xl mx-auto px-6 py-4 text-center">
            <p className="text-xs text-[#2C2416]/40">
              © The Local City Places Gazette — "All the Local News That's Fit to Print"
            </p>
          </div>
        </footer>
      </div>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-[#F5F0E1] border-t-2 border-[#2C2416] p-4">
        <div className="flex gap-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2C2416] text-[#F5F0E1] font-bold"
              style={{ fontFamily: "'Courier New', monospace" }}
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
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-[#2C2416] text-[#2C2416] font-bold"
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              <Globe className="w-4 h-4" />
              Web
            </a>
          )}
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  );
}
