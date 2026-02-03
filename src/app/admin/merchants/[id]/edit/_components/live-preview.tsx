"use client";

import { useMemo } from "react";
import { ArtDecoDesign } from "@/components/merchant-page/designs/art-deco";
import { GatsbyGlamourDesign } from "@/components/merchant-page/designs/gatsby-glamour";
import { VintageHollywoodDesign } from "@/components/merchant-page/designs/vintage-hollywood";
import { ParisianEleganceDesign } from "@/components/merchant-page/designs/parisian-elegance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye } from "lucide-react";

export type DesignType = "art-deco" | "gatsby" | "hollywood" | "parisian";

const DESIGNS: { id: DesignType; label: string }[] = [
  { id: "art-deco", label: "Art Deco" },
  { id: "gatsby", label: "Gatsby Glamour" },
  { id: "hollywood", label: "Vintage Hollywood" },
  { id: "parisian", label: "Parisian Elegance" },
];

interface MerchantPreviewData {
  businessName: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  logoUrl?: string;
  categoryName?: string;
  phone?: string;
  website?: string;
  description?: string;
  vimeoUrl?: string;
  googlePlaceId?: string;
  hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  photos?: string[];
  services?: { name: string; description?: string; price?: string }[];
  aboutStory?: string;
}

interface LivePreviewProps {
  data: MerchantPreviewData;
  design: DesignType;
  onDesignChange: (design: DesignType) => void;
  className?: string;
}

export function LivePreview({ data, design, onDesignChange, className }: LivePreviewProps) {
  const DesignComponent = useMemo(() => {
    switch (design) {
      case "gatsby":
        return GatsbyGlamourDesign;
      case "hollywood":
        return VintageHollywoodDesign;
      case "parisian":
        return ParisianEleganceDesign;
      default:
        return ArtDecoDesign;
    }
  }, [design]);

  return (
    <div className={className}>
      {/* Header with design selector */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="w-4 h-4" />
          <span>Live Preview</span>
        </div>
        <Select value={design} onValueChange={(v) => onDesignChange(v as DesignType)}>
          <SelectTrigger className="w-[160px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DESIGNS.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preview container */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="h-[calc(100vh-280px)] min-h-[400px] overflow-y-auto">
          <div className="transform scale-[0.6] origin-top-left w-[166.67%]">
            <DesignComponent
              businessName={data.businessName || "Business Name"}
              streetAddress={data.streetAddress}
              city={data.city}
              state={data.state}
              zipCode={data.zipCode}
              logoUrl={data.logoUrl}
              categoryName={data.categoryName}
              phone={data.phone}
              website={data.website}
              description={data.description}
              vimeoUrl={data.vimeoUrl}
              googlePlaceId={data.googlePlaceId}
              hours={data.hours}
              instagramUrl={data.instagramUrl}
              facebookUrl={data.facebookUrl}
              tiktokUrl={data.tiktokUrl}
              photos={data.photos}
              services={data.services}
              aboutStory={data.aboutStory}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Design selector only (for use in mobile sheet header)
interface DesignSelectorProps {
  value: DesignType;
  onChange: (design: DesignType) => void;
}

export function DesignSelector({ value, onChange }: DesignSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DesignType)}>
      <SelectTrigger className="w-[160px] h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DESIGNS.map((d) => (
          <SelectItem key={d.id} value={d.id}>
            {d.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
