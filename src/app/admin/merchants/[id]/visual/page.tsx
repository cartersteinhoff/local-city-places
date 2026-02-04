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
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../../../nav";
import { formatPhoneNumber, stripPhoneNumber } from "@/lib/utils";
import { useManualSave } from "@/hooks/use-manual-save";
import { ArtDecoVisualEditor } from "./_components/art-deco-visual-editor";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditHints, setShowEditHints] = useState(true);
  const [isRebuilding, setIsRebuilding] = useState(false);

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

  // Fetch merchant data
  useEffect(() => {
    async function fetchMerchant() {
      try {
        const res = await fetch(`/api/admin/merchant-pages/${id}`);
        if (res.ok) {
          const data = await res.json();
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
      } catch (err) {
        console.error("Error fetching merchant:", err);
        setError("Failed to load merchant");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && isAuthenticated && id) {
      fetchMerchant();
    }
  }, [authLoading, isAuthenticated, id]);

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
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/merchants">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div className="h-6 w-px bg-border" />
              <span className="font-medium">{formData.businessName || "Visual Editor"}</span>
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

              {/* Switch to form editor */}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/merchants/${id}/edit`}>
                  <PanelLeft className="w-4 h-4 mr-2" />
                  Form Editor
                </Link>
              </Button>

              {/* Status indicator */}
              <span className="text-sm text-muted-foreground">
                {status === "dirty" && "Unsaved changes"}
                {status === "saving" && "Saving..."}
                {status === "saved" && "Saved"}
                {status === "clean" && "All saved"}
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

          {/* Visual Editor Canvas */}
          <div className="flex-1 overflow-auto bg-muted/50">
            <div className="max-w-5xl mx-auto my-6 shadow-2xl">
              <ArtDecoVisualEditor
                data={formData}
                onUpdate={updateField}
                onPhotoUpload={handlePhotoUpload}
                onLogoUpload={handleLogoUpload}
                showEditHints={showEditHints}
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
