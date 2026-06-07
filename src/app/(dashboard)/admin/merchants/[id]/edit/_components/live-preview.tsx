"use client";

import { Eye, Monitor, Smartphone, Tablet } from "lucide-react";
import { useState } from "react";
import { PhotoStripDesign } from "@/components/merchant-page/designs/photo-strip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DeviceType = "desktop" | "tablet" | "mobile";

const DEVICES: {
  id: DeviceType;
  label: string;
  icon: typeof Monitor;
  width: number;
  scale: number;
}[] = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: 1280, scale: 0.38 },
  { id: "tablet", label: "Tablet", icon: Tablet, width: 768, scale: 0.52 },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: 375, scale: 0.72 },
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
  className?: string;
}

export function LivePreview({ data, className }: LivePreviewProps) {
  const [device, setDevice] = useState<DeviceType>("desktop");

  const deviceConfig = DEVICES.find((d) => d.id === device) || DEVICES[0];

  return (
    <div className={className}>
      {/* Header with device selector */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="w-4 h-4" />
          <span>Live Preview</span>
        </div>
        <div className="flex items-center border rounded-md p-0.5 bg-muted/50">
          {DEVICES.map((d) => (
            <Button
              key={d.id}
              variant="ghost"
              size="sm"
              onClick={() => setDevice(d.id)}
              className={cn(
                "h-7 w-7 p-0",
                device === d.id && "bg-background shadow-sm",
              )}
              title={d.label}
            >
              <d.icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>

      {/* Preview container */}
      <div className="border rounded-lg overflow-hidden bg-muted/30 shadow-sm">
        <div className="h-[calc(100vh-280px)] min-h-[400px] overflow-y-auto overflow-x-hidden flex justify-center">
          <div
            className="transition-all duration-300 origin-top shrink-0"
            style={{
              width: deviceConfig.width * deviceConfig.scale,
              height: "fit-content",
            }}
          >
            <div
              className="bg-white shadow-lg origin-top-left"
              style={{
                width: deviceConfig.width,
                transform: `scale(${deviceConfig.scale})`,
              }}
            >
              <PhotoStripDesign
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
    </div>
  );
}

// Device selector only (for use in mobile sheet header)
interface DeviceSelectorProps {
  value: DeviceType;
  onChange: (device: DeviceType) => void;
}

export function DeviceSelector({ value, onChange }: DeviceSelectorProps) {
  return (
    <div className="flex items-center border rounded-md p-0.5 bg-muted/50">
      {DEVICES.map((d) => (
        <Button
          key={d.id}
          variant="ghost"
          size="sm"
          onClick={() => onChange(d.id)}
          className={cn(
            "h-7 w-7 p-0",
            value === d.id && "bg-background shadow-sm",
          )}
          title={d.label}
        >
          <d.icon className="w-4 h-4" />
        </Button>
      ))}
    </div>
  );
}

// Get device config for external use
export function getDeviceConfig(device: DeviceType) {
  return DEVICES.find((d) => d.id === device) || DEVICES[0];
}
