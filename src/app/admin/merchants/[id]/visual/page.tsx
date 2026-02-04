"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  Save,
  RefreshCw,
  PanelLeft,
  Eye,
  EyeOff,
  Monitor,
  Tablet,
  Smartphone,
  ZoomIn,
  ZoomOut,
  Import,
} from "lucide-react";
import { ImportGoogleDialog } from "./_components/import-google-dialog";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../../../nav";
import { formatPhoneNumber, stripPhoneNumber, cn } from "@/lib/utils";
import { useManualSave } from "@/hooks/use-manual-save";
import { UnifiedVisualEditor } from "./_components/unified-visual-editor";

// Device configurations for visual editor
type DeviceType = "desktop" | "tablet" | "mobile";

interface DeviceConfig {
  id: DeviceType;
  label: string;
  icon: typeof Monitor;
  width: number;
}

const DEVICES: DeviceConfig[] = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: 1280 },
  { id: "tablet", label: "Tablet", icon: Tablet, width: 768 },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: 375 },
];

// Default zoom levels for each device
const DEFAULT_ZOOM: Record<DeviceType, number> = {
  desktop: 100,
  tablet: 100,
  mobile: 100,
};

interface Category {
  id: string;
  name: string;
}

interface Service {
  name: string;
  description?: string;
  price?: string;
}

interface Hours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
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

const INITIAL_FORM_DATA: FormData = {
  businessName: "",
  categoryId: "",
  categoryName: "",
  description: "",
  aboutStory: "",
  googlePlaceId: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  phone: "",
  website: "",
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
  hours: {},
  logoUrl: "",
  vimeoUrl: "",
  photos: [],
  services: [],
};

export default function VisualEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [originalData, setOriginalData] = useState<FormData>(INITIAL_FORM_DATA);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditHints, setShowEditHints] = useState(true);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Device preview state
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [zoom, setZoom] = useState(DEFAULT_ZOOM.desktop);

  // Handler for device change that also adjusts zoom
  const handleDeviceChange = useCallback((newDevice: DeviceType) => {
    setDevice(newDevice);
    setZoom(DEFAULT_ZOOM[newDevice]);
  }, []);

  // Handler for importing from Google Places
  const handleImport = useCallback((data: {
    businessName: string;
    googlePlaceId: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    website: string;
    hours: Hours;
  }) => {
    setFormData(prev => ({
      ...prev,
      businessName: data.businessName || prev.businessName,
      googlePlaceId: data.googlePlaceId || prev.googlePlaceId,
      streetAddress: data.streetAddress || prev.streetAddress,
      city: data.city || prev.city,
      state: data.state || prev.state,
      zipCode: data.zipCode || prev.zipCode,
      phone: data.phone ? formatPhoneNumber(data.phone) : prev.phone,
      website: data.website || prev.website,
      hours: {
        monday: data.hours.monday || prev.hours.monday,
        tuesday: data.hours.tuesday || prev.hours.tuesday,
        wednesday: data.hours.wednesday || prev.hours.wednesday,
        thursday: data.hours.thursday || prev.hours.thursday,
        friday: data.hours.friday || prev.hours.friday,
        saturday: data.hours.saturday || prev.hours.saturday,
        sunday: data.hours.sunday || prev.hours.sunday,
      },
    }));
  }, []);

  // Update a single field
  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Save handler
  const handleSave = useCallback(async (data: FormData) => {
    const strippedPhone = stripPhoneNumber(data.phone || "");

    const res = await fetch(`/api/admin/merchant-pages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: data.businessName?.trim() || "",
        streetAddress: data.streetAddress?.trim() || null,
        city: data.city?.trim() || "",
        state: data.state?.trim()?.toUpperCase() || "",
        zipCode: data.zipCode?.trim() || null,
        phone: strippedPhone,
        website: data.website?.trim() || null,
        categoryId: data.categoryId || null,
        description: data.description?.trim() || null,
        vimeoUrl: data.vimeoUrl?.trim() || null,
        googlePlaceId: data.googlePlaceId || null,
        logoUrl: data.logoUrl?.trim() || null,
        hours: data.hours && Object.keys(data.hours).length > 0 ? data.hours : null,
        instagramUrl: data.instagramUrl?.trim() || null,
        facebookUrl: data.facebookUrl?.trim() || null,
        tiktokUrl: data.tiktokUrl?.trim() || null,
        photos: data.photos?.length > 0 ? data.photos : null,
        services: data.services?.length > 0 ? data.services : null,
        aboutStory: data.aboutStory?.trim() || null,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || "Failed to save");
    }
    setOriginalData(data);
  }, [id]);

  const { status, isDirty, isSaving, save } = useManualSave({
    data: formData,
    originalData,
    onSave: handleSave,
  });

  // Rebuild handler
  const handleRebuild = useCallback(async () => {
    setIsRebuilding(true);
    try {
      await fetch(`/api/admin/merchant-pages/${id}/revalidate`, { method: "POST" });
    } finally {
      setIsRebuilding(false);
    }
  }, [id]);

  // Photo upload handler
  const handlePhotoUpload = useCallback(async (file: File): Promise<string> => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("type", "photo");

    const res = await fetch(`/api/admin/merchant-pages/${id}/upload-photo`, {
      method: "POST",
      body: formDataUpload,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Upload failed");
    }

    const { url } = await res.json();
    return url;
  }, [id]);

  // Logo upload handler
  const handleLogoUpload = useCallback(async (file: File): Promise<string> => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("type", "logo");

    const res = await fetch(`/api/admin/merchant-pages/${id}/upload-photo`, {
      method: "POST",
      body: formDataUpload,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Upload failed");
    }

    const { url } = await res.json();
    return url;
  }, [id]);

  // Auth check
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  // Fetch merchant data and categories
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch merchant and categories in parallel
        const [merchantRes, categoriesRes] = await Promise.all([
          fetch(`/api/admin/merchant-pages/${id}`),
          fetch("/api/admin/categories"),
        ]);

        if (merchantRes.ok) {
          const data = await merchantRes.json();
          const m = data.merchant;

          const loadedData: FormData = {
            businessName: m.businessName || "",
            categoryId: m.categoryId || "",
            categoryName: m.categoryName || "",
            description: m.description || "",
            aboutStory: m.aboutStory || "",
            googlePlaceId: m.googlePlaceId || "",
            streetAddress: m.streetAddress || "",
            city: m.city || "",
            state: m.state || "",
            zipCode: m.zipCode || "",
            phone: formatPhoneNumber(m.phone || ""),
            website: m.website || "",
            instagramUrl: m.instagramUrl || "",
            facebookUrl: m.facebookUrl || "",
            tiktokUrl: m.tiktokUrl || "",
            hours: m.hours || {},
            logoUrl: m.logoUrl || "",
            vimeoUrl: m.vimeoUrl || "",
            photos: m.photos || [],
            services: m.services || [],
          };

          setFormData(loadedData);
          setOriginalData(loadedData);
        } else {
          setError("Merchant not found");
        }

        if (categoriesRes.ok) {
          const catData = await categoriesRes.json();
          setCategories(catData.categories || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load merchant");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && isAuthenticated && id) {
      fetchData();
    }
  }, [authLoading, isAuthenticated, id]);

  // Calculate scale based on zoom and available container width
  const deviceConfig = DEVICES.find(d => d.id === device) || DEVICES[0];
  const scale = zoom / 100;

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading || isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" asChild>
            <Link href="/admin/merchants">Back to Merchant Pages</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          {/* Top Toolbar - Navigation and Actions */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/merchants">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div className="h-6 w-px bg-border" />
              <span className="font-medium truncate max-w-[200px]">
                {formData.businessName || "Visual Editor"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle edit hints */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditHints(!showEditHints)}
                title={showEditHints ? "Hide edit hints" : "Show edit hints"}
              >
                {showEditHints ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>

              {/* Import from Google */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
              >
                <Import className="w-4 h-4 mr-2" />
                Import
              </Button>

              {/* Switch to form editor */}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/merchants/${id}/edit`}>
                  <PanelLeft className="w-4 h-4 mr-2" />
                  Form Editor
                </Link>
              </Button>

              {/* Status indicator */}
              <span className={cn(
                "text-sm",
                status === "error" ? "text-destructive" : "text-muted-foreground"
              )}>
                {status === "dirty" && "Unsaved changes"}
                {status === "saving" && "Saving..."}
                {status === "saved" && "Saved"}
                {status === "clean" && "All saved"}
                {status === "error" && "Save failed"}
              </span>

              {/* Save button */}
              <Button
                size="sm"
                onClick={save}
                disabled={isSaving || !isDirty}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>

              {/* Publish button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRebuild}
                disabled={isRebuilding}
              >
                {isRebuilding ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Publish
              </Button>
            </div>
          </div>

          {/* Device Preview Toolbar */}
          <div className="flex items-center justify-center gap-6 px-4 py-2 border-b bg-muted/30">
            {/* Device Selector */}
            <div className="flex items-center gap-1 border rounded-md p-0.5 bg-background">
              {DEVICES.map((d) => (
                <Button
                  key={d.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeviceChange(d.id)}
                  className={cn(
                    "h-8 px-3 gap-2",
                    device === d.id && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                  title={`${d.label} (${d.width}px)`}
                >
                  <d.icon className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">{d.label}</span>
                </Button>
              ))}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.max(50, zoom - 25))}
                disabled={zoom <= 50}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(DEFAULT_ZOOM[device])}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                title="Reset to default zoom"
              >
                {zoom}%
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.min(150, zoom + 25))}
                disabled={zoom >= 150}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Device Width Indicator */}
            <div className="text-xs text-muted-foreground hidden sm:block">
              {deviceConfig.width}px wide
            </div>
          </div>

          {/* Visual Editor Canvas */}
          <div className="flex-1 overflow-auto bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.02)_10px,rgba(0,0,0,0.02)_20px)]">
            <div className="flex justify-center py-8 px-4">
              {/* Wrapper that contains the scaled content */}
              <div
                className="transition-all duration-300 origin-top"
                style={{
                  width: deviceConfig.width * scale,
                }}
              >
                {/* Scaled content with device-appropriate styling */}
                <div
                  className={cn(
                    "origin-top-left transition-all duration-300 shadow-2xl",
                    device === "mobile" && "rounded-[24px] ring-8 ring-gray-800",
                    device === "tablet" && "rounded-[16px] ring-4 ring-gray-700",
                    device === "desktop" && "rounded-t-lg ring-1 ring-gray-300"
                  )}
                  style={{
                    width: deviceConfig.width,
                    transform: `scale(${scale})`,
                  }}
                >
                  <div className={cn(
                    "bg-white overflow-hidden",
                    device === "mobile" && "rounded-[16px]",
                    device === "tablet" && "rounded-[12px]",
                    device === "desktop" && "rounded-t-md"
                  )}>
                    <UnifiedVisualEditor
                      data={formData}
                      onUpdate={updateField}
                      onPhotoUpload={handlePhotoUpload}
                      onLogoUpload={handleLogoUpload}
                      showEditHints={showEditHints}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import from Google Dialog */}
      <ImportGoogleDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImport}
      />
    </DashboardLayout>
  );
}
