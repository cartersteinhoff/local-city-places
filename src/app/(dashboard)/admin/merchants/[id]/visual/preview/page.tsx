"use client";

/**
 * IFRAME PREVIEW PAGE
 *
 * This page renders the merchant page in isolation for iframe preview.
 * It receives data via postMessage from the parent visual editor.
 * This ensures CSS media queries respond to the iframe width, not the viewport.
 */

import { useEffect, useState } from "react";
import { EditorProvider } from "@/components/merchant-page/editor-context";
import { ArtDecoDesign } from "@/components/merchant-page/designs/art-deco";

interface Hours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

interface Service {
  name: string;
  description?: string;
  price?: string;
}

interface FormData {
  businessName: string;
  categoryId: string;
  categoryName: string;
  description: string;
  aboutStory: string;
  googlePlaceId: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  website: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  hours: Hours;
  logoUrl: string;
  vimeoUrl: string;
  photos: string[];
  services: Service[];
}

interface PreviewMessage {
  type: "preview-data";
  data: FormData;
  showEditHints: boolean;
}

export default function PreviewPage() {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [showEditHints, setShowEditHints] = useState(true);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from same origin
      if (event.origin !== window.location.origin) return;

      const message = event.data as PreviewMessage;
      if (message.type === "preview-data") {
        setFormData(message.data);
        setShowEditHints(message.showEditHints);
      }
    };

    window.addEventListener("message", handleMessage);

    // Notify parent that iframe is ready
    window.parent.postMessage({ type: "preview-ready" }, window.location.origin);

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Handle updates from the preview (for edit mode)
  const handleUpdate = <T,>(field: string, value: T) => {
    // Send update back to parent
    window.parent.postMessage(
      { type: "preview-update", field, value },
      window.location.origin
    );
  };

  if (!formData) {
    return (
      <div className="min-h-screen bg-[#0D1F22] flex items-center justify-center">
        <div className="text-[#D4AF37] text-sm">Loading preview...</div>
      </div>
    );
  }

  return (
    <EditorProvider
      editable={true}
      onUpdate={handleUpdate}
      showEditHints={showEditHints}
    >
      <ArtDecoDesign
        businessName={formData.businessName || "Business Name"}
        streetAddress={formData.streetAddress || null}
        city={formData.city || null}
        state={formData.state || null}
        zipCode={formData.zipCode || null}
        logoUrl={formData.logoUrl || null}
        categoryName={formData.categoryName || null}
        phone={formData.phone || null}
        website={formData.website || null}
        description={formData.description || null}
        vimeoUrl={formData.vimeoUrl || null}
        googlePlaceId={formData.googlePlaceId || null}
        hours={formData.hours && Object.keys(formData.hours).length > 0 ? formData.hours : null}
        instagramUrl={formData.instagramUrl || null}
        facebookUrl={formData.facebookUrl || null}
        tiktokUrl={formData.tiktokUrl || null}
        photos={formData.photos?.length > 0 ? formData.photos : null}
        services={formData.services?.length > 0 ? formData.services : null}
        aboutStory={formData.aboutStory || null}
      />
    </EditorProvider>
  );
}
