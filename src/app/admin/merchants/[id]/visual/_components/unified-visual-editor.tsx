"use client";

/**
 * UNIFIED VISUAL EDITOR
 *
 * This component wraps the actual ArtDecoDesign template with EditorProvider
 * to enable editing. This ensures the visual editor always matches the actual
 * merchant page design - no drift possible.
 */

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

interface UnifiedVisualEditorProps {
  data: FormData;
  onUpdate: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  onPhotoUpload?: (file: File) => Promise<string>;
  onLogoUpload?: (file: File) => Promise<string>;
  showEditHints?: boolean;
}

export function UnifiedVisualEditor({
  data,
  onUpdate,
  onPhotoUpload,
  onLogoUpload,
  showEditHints = true,
}: UnifiedVisualEditorProps) {
  // Generic update handler that casts field appropriately
  const handleUpdate = <T,>(field: string, value: T) => {
    onUpdate(field as keyof FormData, value as FormData[keyof FormData]);
  };

  return (
    <EditorProvider
      editable={true}
      onUpdate={handleUpdate}
      onPhotoUpload={onPhotoUpload}
      onLogoUpload={onLogoUpload}
      showEditHints={showEditHints}
    >
      <ArtDecoDesign
        businessName={data.businessName || "Business Name"}
        streetAddress={data.streetAddress || null}
        city={data.city || null}
        state={data.state || null}
        zipCode={data.zipCode || null}
        logoUrl={data.logoUrl || null}
        categoryName={data.categoryName || null}
        phone={data.phone || null}
        website={data.website || null}
        description={data.description || null}
        vimeoUrl={data.vimeoUrl || null}
        googlePlaceId={data.googlePlaceId || null}
        hours={data.hours && Object.keys(data.hours).length > 0 ? data.hours : null}
        instagramUrl={data.instagramUrl || null}
        facebookUrl={data.facebookUrl || null}
        tiktokUrl={data.tiktokUrl || null}
        photos={data.photos?.length > 0 ? data.photos : null}
        services={data.services?.length > 0 ? data.services : null}
        aboutStory={data.aboutStory || null}
      />
    </EditorProvider>
  );
}
