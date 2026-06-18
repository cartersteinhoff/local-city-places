"use client";

import { Eye, Monitor, Smartphone, Tablet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PhotoStripDesign } from "@/components/merchant-page/designs/photo-strip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DeviceType = "desktop" | "tablet" | "mobile";

const DEVICES: {
  id: DeviceType;
  label: string;
  icon: typeof Monitor;
  width: number;
  height: number;
  scale: number;
}[] = [
  {
    id: "desktop",
    label: "Desktop",
    icon: Monitor,
    width: 1280,
    height: 900,
    scale: 0.38,
  },
  {
    id: "tablet",
    label: "Tablet",
    icon: Tablet,
    width: 768,
    height: 1024,
    scale: 0.52,
  },
  {
    id: "mobile",
    label: "Mobile",
    icon: Smartphone,
    width: 375,
    height: 812,
    scale: 0.72,
  },
];

export interface MerchantPreviewData {
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
  campaignAudio?: {
    radioSpot?: {
      title: string;
      description?: string;
      url: string;
      fileName?: string;
      contentType?: string;
      sizeBytes?: number;
      uploadedAt?: string;
      status?: "ready" | "in_production" | "pending";
    } | null;
    soundtrack?: {
      title: string;
      description?: string;
      url: string;
      fileName?: string;
      contentType?: string;
      sizeBytes?: number;
      uploadedAt?: string;
      status?: "ready" | "in_production" | "pending";
    } | null;
    soundtrack2?: {
      title: string;
      description?: string;
      url: string;
      fileName?: string;
      contentType?: string;
      sizeBytes?: number;
      uploadedAt?: string;
      status?: "ready" | "in_production" | "pending";
    } | null;
    showOnProfile?: boolean;
    updatedAt?: string;
  } | null;
}

function syncFrameStyles(frameDocument: Document, deviceWidth: number) {
  if (typeof document === "undefined") return;

  const { head, body, documentElement } = frameDocument;
  head.replaceChildren();

  const viewportMeta = frameDocument.createElement("meta");
  viewportMeta.name = "viewport";
  viewportMeta.content = `width=${deviceWidth}, initial-scale=1`;
  head.appendChild(viewportMeta);

  const base = frameDocument.createElement("base");
  base.href = `${window.location.origin}/`;
  head.appendChild(base);

  document.querySelectorAll("link[rel='stylesheet'], style").forEach((node) => {
    if (node instanceof HTMLLinkElement) {
      const link = frameDocument.createElement("link");
      link.rel = "stylesheet";
      link.href = node.href;
      link.media = node.media;
      link.crossOrigin = node.crossOrigin;
      head.appendChild(link);
      return;
    }

    const style = frameDocument.createElement("style");
    style.textContent = node.textContent;
    head.appendChild(style);
  });

  const resetStyle = frameDocument.createElement("style");
  resetStyle.textContent = `
    html, body {
      margin: 0;
      min-width: ${deviceWidth}px;
      background: #fff;
      overflow: hidden;
    }

    body {
      color-scheme: light;
    }

    #merchant-preview-root {
      min-height: 100%;
      background: #fff;
    }
  `;
  head.appendChild(resetStyle);

  documentElement.style.background = "#fff";
  body.style.margin = "0";
}

function PreviewContent({
  data,
  minHeight,
  onHeightChange,
}: {
  data: MerchantPreviewData;
  minHeight: number;
  onHeightChange: (height: number) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Preview data changes can alter rendered iframe height before ResizeObserver fires.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const frameDocument = root.ownerDocument;
    const frameWindow = frameDocument.defaultView;
    const updateHeight = () => {
      const nextHeight = Math.ceil(
        Math.max(
          minHeight,
          root.scrollHeight,
          frameDocument.body.scrollHeight,
          frameDocument.documentElement.scrollHeight,
        ),
      );
      onHeightChange(nextHeight);
    };

    updateHeight();

    const FrameResizeObserver = frameWindow?.ResizeObserver ?? ResizeObserver;
    const resizeObserver = new FrameResizeObserver(updateHeight);
    resizeObserver.observe(root);
    resizeObserver.observe(frameDocument.body);

    const images = Array.from(root.querySelectorAll("img"));
    images.forEach((image) => {
      if (!image.complete) {
        image.addEventListener("load", updateHeight);
        image.addEventListener("error", updateHeight);
      }
    });

    const timeoutId = frameWindow?.setTimeout(updateHeight, 100);

    return () => {
      resizeObserver.disconnect();
      images.forEach((image) => {
        image.removeEventListener("load", updateHeight);
        image.removeEventListener("error", updateHeight);
      });
      if (timeoutId) frameWindow?.clearTimeout(timeoutId);
    };
  }, [data, minHeight, onHeightChange]);

  return (
    <div id="merchant-preview-root" ref={rootRef}>
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
        campaignAudio={data.campaignAudio}
      />
    </div>
  );
}

interface PreviewDeviceCanvasProps {
  data: MerchantPreviewData;
  device: DeviceType;
  className?: string;
}

export function PreviewDeviceCanvas({
  data,
  device,
  className,
}: PreviewDeviceCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameDocument, setFrameDocument] = useState<Document | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const deviceConfig = DEVICES.find((d) => d.id === device) || DEVICES[0];
  const fallbackHeight = deviceConfig.height;
  const frameHeight = Math.max(contentHeight || fallbackHeight, fallbackHeight);
  const availableWidth = Math.max(0, viewportWidth - 16);
  const previewScale =
    viewportWidth > 0
      ? Math.min(deviceConfig.scale, availableWidth / deviceConfig.width)
      : deviceConfig.scale;
  const safePreviewScale = Number.isFinite(previewScale)
    ? Math.max(0.2, previewScale)
    : deviceConfig.scale;
  const handleHeightChange = useCallback((height: number) => {
    setContentHeight((currentHeight) =>
      Math.abs(currentHeight - height) > 1 ? height : currentHeight,
    );
  }, []);
  const connectFrameDocument = useCallback(() => {
    const nextDocument = iframeRef.current?.contentDocument ?? null;
    if (nextDocument?.body) {
      setFrameDocument(nextDocument);
    }
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateWidth = () => setViewportWidth(viewport.clientWidth);
    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(viewport);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    connectFrameDocument();
  }, [connectFrameDocument]);

  useEffect(() => {
    if (!frameDocument) return;

    const sync = () => syncFrameStyles(frameDocument, deviceConfig.width);
    sync();

    const mutationObserver = new MutationObserver(sync);
    mutationObserver.observe(document.head, {
      childList: true,
      subtree: true,
    });

    return () => mutationObserver.disconnect();
  }, [deviceConfig.width, frameDocument]);

  return (
    <div
      ref={viewportRef}
      className={cn(
        "overflow-y-auto overflow-x-hidden flex justify-center",
        className,
      )}
    >
      <div
        className="transition-all duration-300 origin-top shrink-0"
        style={{
          width: deviceConfig.width * safePreviewScale,
          height: frameHeight * safePreviewScale,
        }}
      >
        <iframe
          ref={iframeRef}
          src="about:blank"
          title={`${deviceConfig.label} merchant page preview`}
          className="block border-0 bg-white shadow-lg origin-top-left pointer-events-none"
          scrolling="no"
          onLoad={connectFrameDocument}
          style={{
            width: deviceConfig.width,
            height: frameHeight,
            transform: `scale(${safePreviewScale})`,
          }}
        />
        {frameDocument?.body &&
          createPortal(
            <PreviewContent
              data={data}
              minHeight={fallbackHeight}
              onHeightChange={handleHeightChange}
            />,
            frameDocument.body,
          )}
      </div>
    </div>
  );
}

interface LivePreviewProps {
  data: MerchantPreviewData;
  className?: string;
  device?: DeviceType;
  onDeviceChange?: (device: DeviceType) => void;
  showHeader?: boolean;
}

export function LivePreview({
  data,
  className,
  device: controlledDevice,
  onDeviceChange,
  showHeader = true,
}: LivePreviewProps) {
  const [internalDevice, setInternalDevice] = useState<DeviceType>("desktop");
  const device = controlledDevice ?? internalDevice;
  const handleDeviceChange = (nextDevice: DeviceType) => {
    if (onDeviceChange) {
      onDeviceChange(nextDevice);
      return;
    }

    setInternalDevice(nextDevice);
  };
  return (
    <div className={className}>
      {/* Header with device selector */}
      {showHeader && (
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span>Live Preview</span>
          </div>
          <DeviceSelector value={device} onChange={handleDeviceChange} />
        </div>
      )}

      {/* Preview container */}
      <div className="border rounded-lg overflow-hidden bg-muted/30 shadow-sm">
        <PreviewDeviceCanvas
          data={data}
          device={device}
          className="h-[calc(100vh-280px)] min-h-[400px] px-2 py-3"
        />
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
