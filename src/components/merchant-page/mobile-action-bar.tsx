"use client";

import { Phone, Globe, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface MobileActionBarProps {
  businessName: string;
  phone?: string | null;
  website?: string | null;
}

export function MobileActionBar({ businessName, phone, website }: MobileActionBarProps) {
  const [copied, setCopied] = useState(false);

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

  // Only show if there are actions available
  if (!phone && !website) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50">
      {/* Gradient fade */}
      <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      {/* Action bar */}
      <div className="bg-background/95 backdrop-blur-lg border-t px-4 py-3 safe-area-inset-bottom">
        <div className="flex gap-2">
          {phone && (
            <Button className="flex-1 gap-2" size="lg" asChild>
              <a href={`tel:${phone}`}>
                <Phone className="w-5 h-5" />
                Call Now
              </a>
            </Button>
          )}
          {website && (
            <Button variant="outline" className="flex-1 gap-2" size="lg" asChild>
              <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer">
                <Globe className="w-5 h-5" />
                Website
              </a>
            </Button>
          )}
          <Button variant="outline" size="lg" className="px-4" onClick={handleShare}>
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
