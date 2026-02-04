"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Loader2,
  Check,
  Copy,
  ExternalLink,
  MapPin,
  Phone,
  Globe,
  Camera,
  Plus,
  Trash2,
  Instagram,
  Facebook,
  Video,
  Building2,
  FileText,
  Eye,
  Save,
  RefreshCw,
  Paintbrush,
} from "lucide-react";
import { formatPhoneNumber, stripPhoneNumber, cn } from "@/lib/utils";
import { isValidVimeoUrl } from "@/lib/vimeo";
import { GooglePlacesAutocomplete, type PlaceDetails } from "@/components/ui/google-places-autocomplete";
import { ImageUploader, GalleryUploader } from "@/components/ui/image-uploader";
import { SortableList, SortableImageGrid } from "@/components/ui/sortable-list";
import { HoursSection, type Hours } from "../[id]/edit/_components/hours-section";
import { CompletionIndicator } from "../[id]/edit/_components/completion-indicator";
import { LivePreview, DesignSelector, DeviceSelector, type DesignType, type DeviceType, getDeviceConfig } from "../[id]/edit/_components/live-preview";
import type { MerchantData } from "@/lib/merchant-completion";
import { useManualSave } from "@/hooks/use-manual-save";

// Preview components
import { ArtDecoDesign } from "@/components/merchant-page/designs/art-deco";
import { GatsbyGlamourDesign } from "@/components/merchant-page/designs/gatsby-glamour";
import { VintageHollywoodDesign } from "@/components/merchant-page/designs/vintage-hollywood";
import { ParisianEleganceDesign } from "@/components/merchant-page/designs/parisian-elegance";

interface Category {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  price?: string;
}

export interface FormData {
  businessName: string;
  categoryId: string;
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
  slug: string;
}

export const INITIAL_FORM_DATA: FormData = {
  businessName: "",
  categoryId: "",
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
  slug: "",
};

const INITIAL_URLS = { full: null, short: null } as const;

const sections = [
  { id: "business", label: "Business", icon: Building2 },
  { id: "location", label: "Location", icon: MapPin },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "hours", label: "Hours", icon: null },
  { id: "media", label: "Media", icon: Camera },
  { id: "services", label: "Services", icon: FileText },
];

interface MerchantFormProps {
  mode: "create" | "edit";
  merchantId?: string;
  initialData?: FormData;
  initialUrls?: { full: string | null; short: string | null };
  initialCategoryName?: string;
  categories: Category[];
  onSuccess?: (data: { id: string; urls: { full: string; short: string } }) => void;
}

export function MerchantForm({
  mode,
  merchantId,
  initialData = INITIAL_FORM_DATA,
  initialUrls = INITIAL_URLS,
  initialCategoryName = "",
  categories,
  onSuccess,
}: MerchantFormProps) {
  const router = useRouter();

  // Form data
  const [formData, setFormData] = useState<FormData>(initialData);
  const [originalData, setOriginalData] = useState<FormData>(initialData);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [urls, setUrls] = useState(initialUrls);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("business");
  const [previewDesign, setPreviewDesign] = useState<DesignType>("art-deco");
  const [previewDevice, setPreviewDevice] = useState<DeviceType>("mobile");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [categoryName, setCategoryName] = useState(initialCategoryName);
  const [isRebuilding, setIsRebuilding] = useState(false);

  // Sync initial data changes (for edit mode when data loads)
  useEffect(() => {
    setFormData(initialData);
    setOriginalData(initialData);
  }, [initialData]);

  useEffect(() => {
    setUrls(initialUrls);
  }, [initialUrls]);

  useEffect(() => {
    setCategoryName(initialCategoryName);
  }, [initialCategoryName]);

  // Update form field
  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Auto-save for edit mode
  const handleSave = useCallback(async (data: FormData) => {
    if (mode !== "edit" || !merchantId) return;

    // Validation
    if (!data.businessName?.trim()) {
      throw new Error("Business name is required");
    }
    if (!data.city?.trim()) {
      throw new Error("City is required");
    }
    if (!data.state?.trim() || data.state.length !== 2) {
      throw new Error("State must be a 2-letter code");
    }
    const strippedPhone = stripPhoneNumber(data.phone || "");
    if (!strippedPhone || strippedPhone.length !== 10) {
      throw new Error("Phone number must be 10 digits");
    }
    if (data.vimeoUrl && !isValidVimeoUrl(data.vimeoUrl)) {
      throw new Error("Invalid Vimeo URL");
    }

    const res = await fetch(`/api/admin/merchant-pages/${merchantId}`, {
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
        slug: data.slug?.trim() || null,
        hours: data.hours && Object.keys(data.hours).length > 0 ? data.hours : null,
        instagramUrl: data.instagramUrl?.trim() || null,
        facebookUrl: data.facebookUrl?.trim() || null,
        tiktokUrl: data.tiktokUrl?.trim() || null,
        photos: data.photos?.length > 0 ? data.photos : null,
        services: data.services?.length > 0
          ? data.services.map(({ name, description, price }) => ({ name, description, price }))
          : null,
        aboutStory: data.aboutStory?.trim() || null,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || "Failed to save");
    }
    setUrls(result.urls);
    setOriginalData(data);
  }, [mode, merchantId]);

  const { status, isDirty, isSaving, lastSaved, error: saveError, save, retry } = useManualSave({
    data: formData,
    originalData,
    onSave: handleSave,
    enabled: mode === "edit",
  });

  // Handle create submit
  const handleCreate = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.businessName.trim()) {
        throw new Error("Business name is required");
      }
      if (!formData.city.trim()) {
        throw new Error("City is required");
      }
      if (!formData.state.trim() || formData.state.length !== 2) {
        throw new Error("State must be a 2-letter code (e.g., CO, CA)");
      }
      const strippedPhone = stripPhoneNumber(formData.phone);
      if (!strippedPhone || strippedPhone.length !== 10) {
        throw new Error("Phone number must be 10 digits");
      }
      if (formData.vimeoUrl && !isValidVimeoUrl(formData.vimeoUrl)) {
        throw new Error("Invalid Vimeo URL. Use format: https://vimeo.com/123456789");
      }

      const res = await fetch("/api/admin/merchant-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.businessName.trim(),
          streetAddress: formData.streetAddress.trim() || null,
          city: formData.city.trim(),
          state: formData.state.trim().toUpperCase(),
          zipCode: formData.zipCode.trim() || null,
          phone: strippedPhone,
          website: formData.website.trim() || null,
          categoryId: formData.categoryId || null,
          description: formData.description.trim() || null,
          vimeoUrl: formData.vimeoUrl.trim() || null,
          googlePlaceId: formData.googlePlaceId || null,
          logoUrl: formData.logoUrl.trim() || null,
          hours: Object.keys(formData.hours).length > 0 ? formData.hours : null,
          instagramUrl: formData.instagramUrl.trim() || null,
          facebookUrl: formData.facebookUrl.trim() || null,
          tiktokUrl: formData.tiktokUrl.trim() || null,
          photos: formData.photos.filter(p => p.trim()).length > 0 ? formData.photos.filter(p => p.trim()) : null,
          services: formData.services.length > 0
            ? formData.services.map(({ name, description, price }) => ({ name, description, price }))
            : null,
          aboutStory: formData.aboutStory.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create merchant page");
      }

      onSuccess?.({ id: data.merchant.id, urls: data.urls });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle rebuild page (edit mode only)
  const handleRebuild = useCallback(async () => {
    if (!merchantId) return;
    setIsRebuilding(true);
    try {
      await fetch(`/api/admin/merchant-pages/${merchantId}/revalidate`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Failed to rebuild:", err);
    } finally {
      setIsRebuilding(false);
    }
  }, [merchantId]);

  // Update category name when category changes
  useEffect(() => {
    if (formData.categoryId && categories.length > 0) {
      const cat = categories.find(c => c.id === formData.categoryId);
      if (cat) {
        setCategoryName(cat.name);
      }
    }
  }, [formData.categoryId, categories]);

  const handlePlaceSelect = useCallback((_name: string, placeId: string, details?: PlaceDetails) => {
    if (details) {
      setFormData(prev => ({
        ...prev,
        businessName: details.name,
        googlePlaceId: placeId,
        streetAddress: details.streetAddress || prev.streetAddress,
        city: details.city || prev.city,
        state: details.state || prev.state,
        zipCode: details.zipCode || prev.zipCode,
        phone: details.phone ? formatPhoneNumber(details.phone) : prev.phone,
        website: details.website || prev.website,
      }));
    }
  }, []);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${text}` : text;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedUrl(type);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getFullUrl = (path: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${path}`;
    }
    return path;
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { id: `service-${Date.now()}`, name: "", description: "", price: "" }],
    }));
  };

  const updateService = (id: string, field: keyof Omit<Service, "id">, value: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map(s => s.id === id ? { ...s, [field]: value } : s),
    }));
  };

  const removeService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== id),
    }));
  };

  // Photo upload handler (edit mode only)
  const handlePhotoUpload = useCallback(async (file: File): Promise<string> => {
    if (!merchantId) throw new Error("Cannot upload without merchant ID");

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("type", "photo");

    const res = await fetch(`/api/admin/merchant-pages/${merchantId}/upload-photo`, {
      method: "POST",
      body: formDataUpload,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Upload failed");
    }

    const { url } = await res.json();
    return url;
  }, [merchantId]);

  // Logo upload handler (edit mode only)
  const handleLogoUpload = useCallback(async (file: File): Promise<string> => {
    if (!merchantId) throw new Error("Cannot upload without merchant ID");

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("type", "logo");

    const res = await fetch(`/api/admin/merchant-pages/${merchantId}/upload-photo`, {
      method: "POST",
      body: formDataUpload,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Upload failed");
    }

    const { url } = await res.json();
    return url;
  }, [merchantId]);

  // Completion data for indicator
  const completionData: MerchantData = useMemo(() => ({
    businessName: formData.businessName,
    categoryId: formData.categoryId,
    description: formData.description,
    aboutStory: formData.aboutStory,
    streetAddress: formData.streetAddress,
    city: formData.city,
    state: formData.state,
    zipCode: formData.zipCode,
    phone: formData.phone,
    website: formData.website,
    instagramUrl: formData.instagramUrl,
    facebookUrl: formData.facebookUrl,
    tiktokUrl: formData.tiktokUrl,
    hours: formData.hours,
    logoUrl: formData.logoUrl,
    vimeoUrl: formData.vimeoUrl,
    photos: formData.photos,
    services: formData.services,
  }), [formData]);

  // Preview data for live preview
  const previewData = useMemo(() => ({
    businessName: formData.businessName,
    streetAddress: formData.streetAddress || undefined,
    city: formData.city || undefined,
    state: formData.state || undefined,
    zipCode: formData.zipCode || undefined,
    logoUrl: formData.logoUrl || undefined,
    categoryName: categoryName || undefined,
    phone: formData.phone || undefined,
    website: formData.website || undefined,
    description: formData.description || undefined,
    vimeoUrl: formData.vimeoUrl || undefined,
    googlePlaceId: formData.googlePlaceId || undefined,
    hours: Object.keys(formData.hours).length > 0 ? formData.hours : undefined,
    instagramUrl: formData.instagramUrl || undefined,
    facebookUrl: formData.facebookUrl || undefined,
    tiktokUrl: formData.tiktokUrl || undefined,
    photos: formData.photos.filter(p => p.trim()).length > 0 ? formData.photos.filter(p => p.trim()) : undefined,
    services: formData.services.length > 0
      ? formData.services.map(({ name, description, price }) => ({ name, description, price }))
      : undefined,
    aboutStory: formData.aboutStory || undefined,
  }), [formData, categoryName]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 overflow-x-hidden">
      {/* Form Panel */}
      <div className="flex-1 lg:max-w-[60%]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/merchants">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              {mode === "edit" && merchantId && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/merchants/${merchantId}/visual`}>
                    <Paintbrush className="w-4 h-4 mr-2" />
                    Visual Editor
                  </Link>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {mode === "create" ? (
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  Create Page
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={save}
                    disabled={isSaving || !isDirty}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Save
                  </Button>
                  {urls.full && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRebuild}
                      disabled={isRebuilding}
                      title="Publish changes to live page"
                    >
                      {isRebuilding ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-1" />
                      )}
                      Publish
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Completion Indicator */}
        <div className="mb-6">
          <CompletionIndicator data={completionData} />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* URLs (edit mode) */}
        {mode === "edit" && (
          <div className="grid gap-3 sm:grid-cols-2 mb-6">
            <div className="bg-card border rounded-lg p-3">
              <Label className="text-xs text-muted-foreground">Full URL</Label>
              <div className="flex items-center gap-1 mt-1">
                <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground whitespace-nowrap">
                  /business/{formData.city.toLowerCase() || "city"}/{formData.state.toLowerCase() || "st"}/
                </code>
                <Input
                  value={formData.slug}
                  onChange={(e) => updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="url-slug"
                  className="h-7 text-xs font-mono flex-1 min-w-0"
                />
                {urls.full && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" asChild>
                    <a href={urls.full} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-card border rounded-lg p-3">
              <Label className="text-xs text-muted-foreground">Short URL</Label>
              {urls.short ? (
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-xs bg-muted px-2 py-1 rounded truncate">
                    {getFullUrl(urls.short)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => copyToClipboard(urls.short!, "short")}
                  >
                    {copiedUrl === "short" ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  Add phone number to generate short URL
                </p>
              )}
            </div>
          </div>
        )}

        {/* Section Navigation */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer",
                activeSection === section.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              {section.icon && <section.icon className="w-4 h-4" />}
              {section.label}
            </button>
          ))}
        </div>

        {/* Business Info Section */}
        {activeSection === "business" && (
          <div className="space-y-6 bg-card border rounded-lg p-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Business Information
            </h3>

            <div>
              <Label>Search Google Places</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Search to auto-fill business details from Google
              </p>
              <GooglePlacesAutocomplete
                value=""
                onChange={handlePlaceSelect}
                placeholder="Search for a business..."
                types={["establishment"]}
                fetchDetails={true}
              />
            </div>

            <div className="border-t pt-6 space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                  placeholder="Business name"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.categoryId || "none"}
                  onValueChange={(v) => updateField("categoryId", v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Short Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Brief description (shown in listings)..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="aboutStory">About / Story</Label>
                <Textarea
                  id="aboutStory"
                  value={formData.aboutStory}
                  onChange={(e) => updateField("aboutStory", e.target.value)}
                  placeholder="Longer about section, history, story..."
                  rows={5}
                />
              </div>
            </div>
          </div>
        )}

        {/* Location Section */}
        {activeSection === "location" && (
          <div className="space-y-6 bg-card border rounded-lg p-6">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </h3>

            <div className="space-y-4">
              <div>
                <Label>Search Address on Google Places</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Search to auto-fill address details from Google
                </p>
                <GooglePlacesAutocomplete
                  value=""
                  onChange={handlePlaceSelect}
                  placeholder="Search for an address..."
                  types={["address"]}
                  fetchDetails={true}
                />
              </div>

              <div>
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  value={formData.streetAddress}
                  onChange={(e) => updateField("streetAddress", e.target.value)}
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="Denver"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => updateField("state", e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="CO"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => updateField("zipCode", e.target.value)}
                    placeholder="80202"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="googlePlaceId">Google Place ID</Label>
                <Input
                  id="googlePlaceId"
                  value={formData.googlePlaceId}
                  onChange={(e) => updateField("googlePlaceId", e.target.value)}
                  placeholder="ChIJ..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-filled from Google Places search. Used for map embed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Section */}
        {activeSection === "contact" && (
          <div className="space-y-6 bg-card border rounded-lg p-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact & Social
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", formatPhoneNumber(e.target.value))}
                  placeholder="(425) 577-9060"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used for the short URL (e.g., /4255779060)
                </p>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-3 block">Social Media</Label>
                <div className="space-y-3">
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={formData.instagramUrl}
                      onChange={(e) => updateField("instagramUrl", e.target.value)}
                      placeholder="https://instagram.com/username"
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={formData.facebookUrl}
                      onChange={(e) => updateField("facebookUrl", e.target.value)}
                      placeholder="https://facebook.com/page"
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <Input
                      value={formData.tiktokUrl}
                      onChange={(e) => updateField("tiktokUrl", e.target.value)}
                      placeholder="https://tiktok.com/@username"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hours Section */}
        {activeSection === "hours" && (
          <HoursSection
            value={formData.hours}
            onChange={(hours) => updateField("hours", hours)}
          />
        )}

        {/* Media Section */}
        {activeSection === "media" && (
          <div className="space-y-6 bg-card border rounded-lg p-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Media
            </h3>

            <div className="space-y-6">
              {/* Logo */}
              <div>
                <Label className="mb-2 block">Logo</Label>
                {mode === "edit" && merchantId ? (
                  <ImageUploader
                    value={formData.logoUrl}
                    onChange={(url) => updateField("logoUrl", url || "")}
                    onUpload={handleLogoUpload}
                    aspectRatio="square"
                    className="max-w-[200px]"
                    placeholder="Drag logo here or click to browse"
                  />
                ) : (
                  <>
                    <Input
                      value={formData.logoUrl}
                      onChange={(e) => updateField("logoUrl", e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      You can upload images after creating the page
                    </p>
                  </>
                )}
              </div>

              {/* Video */}
              <div>
                <Label htmlFor="vimeoUrl">Vimeo Video URL</Label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="vimeoUrl"
                    type="url"
                    value={formData.vimeoUrl}
                    onChange={(e) => updateField("vimeoUrl", e.target.value)}
                    placeholder="https://vimeo.com/1160781582"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Featured video displayed on the merchant page
                </p>
              </div>

              {/* Photo Gallery */}
              <div className="border-t pt-4">
                <Label className="mb-3 block">Photo Gallery</Label>

                {mode === "edit" && merchantId ? (
                  <>
                    {formData.photos.length > 0 && (
                      <div className="mb-4">
                        <SortableImageGrid
                          images={formData.photos}
                          onChange={(photos) => updateField("photos", photos)}
                          onRemove={(index) => {
                            updateField("photos", formData.photos.filter((_, i) => i !== index));
                          }}
                        />
                      </div>
                    )}
                    <GalleryUploader
                      value={[]}
                      onChange={(newUrls) => {
                        updateField("photos", [...formData.photos, ...newUrls]);
                      }}
                      onUpload={handlePhotoUpload}
                    />
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-3">
                      You can upload photos after creating the page. For now, add photo URLs:
                    </p>
                    {formData.photos.map((photo, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <Input
                          value={photo}
                          onChange={(e) => {
                            const newPhotos = [...formData.photos];
                            newPhotos[idx] = e.target.value;
                            updateField("photos", newPhotos);
                          }}
                          placeholder="https://example.com/photo.jpg"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => updateField("photos", formData.photos.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateField("photos", [...formData.photos, ""])}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Photo URL
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Services Section */}
        {activeSection === "services" && (
          <div className="space-y-6 bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Services / Menu Items
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addService}>
                <Plus className="w-4 h-4 mr-1" />
                Add Service
              </Button>
            </div>

            {formData.services.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No services added yet</p>
                <p className="text-sm">Click &quot;Add Service&quot; to get started</p>
              </div>
            ) : mode === "edit" ? (
              <SortableList
                items={formData.services}
                onChange={(services) => updateField("services", services)}
                getItemId={(service) => service.id}
                renderItem={(service) => (
                  <div className="border rounded-lg p-4 space-y-3 bg-background">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Label className="text-xs">Name *</Label>
                        <Input
                          value={service.name}
                          onChange={(e) => updateService(service.id, "name", e.target.value)}
                          placeholder="Service name"
                        />
                      </div>
                      <div className="w-28">
                        <Label className="text-xs">Price</Label>
                        <Input
                          value={service.price || ""}
                          onChange={(e) => updateService(service.id, "price", e.target.value)}
                          placeholder="$50"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 mt-5"
                        onClick={() => removeService(service.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={service.description || ""}
                        onChange={(e) => updateService(service.id, "description", e.target.value)}
                        placeholder="Brief description..."
                        rows={2}
                      />
                    </div>
                  </div>
                )}
                renderDragOverlay={(service) => (
                  <div className="text-sm font-medium">{service.name || "Service"}</div>
                )}
              />
            ) : (
              <div className="space-y-4">
                {formData.services.map((service) => (
                  <div key={service.id} className="border rounded-lg p-4 space-y-3 bg-background">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Label className="text-xs">Name *</Label>
                        <Input
                          value={service.name}
                          onChange={(e) => updateService(service.id, "name", e.target.value)}
                          placeholder="Service name"
                        />
                      </div>
                      <div className="w-28">
                        <Label className="text-xs">Price</Label>
                        <Input
                          value={service.price || ""}
                          onChange={(e) => updateService(service.id, "price", e.target.value)}
                          placeholder="$50"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 mt-5"
                        onClick={() => removeService(service.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={service.description || ""}
                        onChange={(e) => updateService(service.id, "description", e.target.value)}
                        placeholder="Brief description..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Save Status (edit mode) */}
        {mode === "edit" && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {status === "clean" && (
                <span className="text-muted-foreground">All changes saved</span>
              )}
              {status === "dirty" && (
                <span className="text-yellow-600">Unsaved changes</span>
              )}
              {status === "saving" && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              )}
              {status === "saved" && (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="w-3 h-3" />
                  Saved {lastSaved && `at ${lastSaved.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                </span>
              )}
              {status === "error" && (
                <span className="flex items-center gap-2 text-destructive">
                  Failed to save
                  <Button variant="ghost" size="sm" onClick={retry} className="h-6 px-2 text-xs">
                    Retry
                  </Button>
                </span>
              )}
            </div>
            {saveError && status !== "error" && (
              <p className="text-sm text-destructive">{saveError}</p>
            )}
          </div>
        )}
      </div>

      {/* Preview Panel - Desktop */}
      <div className="hidden lg:block w-[40%] sticky top-4 self-start">
        <LivePreview
          data={previewData}
          design={previewDesign}
          onDesignChange={setPreviewDesign}
        />
      </div>

      {/* Preview Button - Mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg h-14 w-14">
              <Eye className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-full h-[85vh] p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-medium">Preview</span>
              <div className="flex items-center gap-2">
                <DeviceSelector value={previewDevice} onChange={setPreviewDevice} />
                <DesignSelector value={previewDesign} onChange={setPreviewDesign} />
              </div>
            </div>
            <div className="h-[calc(100%-60px)] overflow-auto bg-muted/30 flex justify-center">
              <MobilePreviewContent
                design={previewDesign}
                device={previewDevice}
                data={previewData}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

function MobilePreviewContent({
  design,
  device,
  data
}: {
  design: DesignType;
  device: DeviceType;
  data: any;
}) {
  const deviceConfig = getDeviceConfig(device);
  const DesignComponent = {
    "art-deco": ArtDecoDesign,
    "gatsby": GatsbyGlamourDesign,
    "hollywood": VintageHollywoodDesign,
    "parisian": ParisianEleganceDesign,
  }[design];

  return (
    <div
      className="transition-all duration-300 my-4 shrink-0"
      style={{
        width: deviceConfig.width * deviceConfig.scale,
      }}
    >
      <div
        className="bg-white shadow-lg origin-top-left"
        style={{
          width: deviceConfig.width,
          transform: `scale(${deviceConfig.scale})`,
        }}
      >
        <DesignComponent {...data} />
      </div>
    </div>
  );
}
