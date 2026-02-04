"use client";

import { useEffect, useState, useCallback, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
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
  Undo2,
  Save,
  RefreshCw,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { adminNavItems } from "../../../nav";
import { formatPhoneNumber, stripPhoneNumber } from "@/lib/utils";
import { isValidVimeoUrl } from "@/lib/vimeo";
import { GooglePlacesAutocomplete, PlaceDetails } from "@/components/ui/google-places-autocomplete";
import { cn } from "@/lib/utils";
import { useAutoSave } from "@/hooks/use-auto-save";
import { AutoSaveIndicator } from "@/components/ui/auto-save-indicator";
import { ImageUploader, GalleryUploader } from "@/components/ui/image-uploader";
import { SortableList, SortableImageGrid } from "@/components/ui/sortable-list";
import { HoursSection, Hours } from "./_components/hours-section";
import { CompletionIndicator } from "./_components/completion-indicator";
import { LivePreview, DesignSelector, DesignType } from "./_components/live-preview";
import { MerchantData } from "@/lib/merchant-completion";

interface Category {
  id: string;
  name: string;
}

interface Service {
  id: string; // for drag-and-drop
  name: string;
  description?: string;
  price?: string;
}

interface FormData {
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

const INITIAL_FORM_DATA: FormData = {
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

const sections = [
  { id: "business", label: "Business", icon: Building2 },
  { id: "location", label: "Location", icon: MapPin },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "hours", label: "Hours", icon: null }, // Uses HoursSection
  { id: "media", label: "Media", icon: Camera },
  { id: "services", label: "Services", icon: FileText },
];

export default function EditMerchantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useUser();

  // Form data
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [originalData, setOriginalData] = useState<FormData>(INITIAL_FORM_DATA);

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [urls, setUrls] = useState<{ full: string | null; short: string | null }>({ full: null, short: null });
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("business");
  const [previewDesign, setPreviewDesign] = useState<DesignType>("art-deco");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [categoryName, setCategoryName] = useState<string>("");
  const [needsRebuild, setNeedsRebuild] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);

  // Auto-save
  const handleSave = useCallback(async (data: FormData) => {
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
    setNeedsRebuild(true); // Show rebuild button after save
  }, [id]);

  const { status, lastSaved, error: saveError, canUndo, undo, saveNow, retry } = useAutoSave({
    data: formData,
    onSave: handleSave,
    debounceMs: 3000,
    enabled: !isLoading,
  });

  // Handle rebuild page
  const handleRebuild = useCallback(async () => {
    setIsRebuilding(true);
    try {
      const res = await fetch(`/api/admin/merchant-pages/${id}/revalidate`, {
        method: "POST",
      });
      if (res.ok) {
        setNeedsRebuild(false);
      }
    } catch (err) {
      console.error("Failed to rebuild:", err);
    } finally {
      setIsRebuilding(false);
    }
  }, [id]);

  // Handle undo
  const handleUndo = useCallback(() => {
    const previousData = undo();
    if (previousData) {
      setFormData(previousData);
    }
  }, [undo]);

  // Update form field
  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

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

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }
    if (!authLoading && isAuthenticated) {
      fetchCategories();
    }
  }, [authLoading, isAuthenticated]);

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
            services: (m.services || []).map((s: { name: string; description?: string; price?: string }, i: number) => ({
              ...s,
              id: `service-${i}-${Date.now()}`,
            })),
            slug: m.slug || "",
          };

          setFormData(loadedData);
          setOriginalData(loadedData);
          setUrls(m.urls);
          setCategoryName(m.categoryName || "");
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
    photos: formData.photos.length > 0 ? formData.photos : undefined,
    services: formData.services.length > 0
      ? formData.services.map(({ name, description, price }) => ({ name, description, price }))
      : undefined,
    aboutStory: formData.aboutStory || undefined,
  }), [formData, categoryName]);

  return (
    <DashboardLayout navItems={adminNavItems}>
      {authLoading || isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error && !formData.businessName ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" asChild>
            <Link href="/admin/merchants">Back to Merchant Pages</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Form Panel */}
          <div className="flex-1 lg:max-w-[60%]">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/merchants">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Link>
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUndo}
                    disabled={!canUndo}
                  >
                    <Undo2 className="w-4 h-4 mr-1" />
                    Undo
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveNow}
                    disabled={status === "saving" || status === "clean"}
                  >
                    {status === "saving" ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Save
                  </Button>
                  {needsRebuild && urls.full && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRebuild}
                      disabled={isRebuilding}
                      title="Publish changes to live page. Auto-updates in ~1 hour anyway."
                    >
                      {isRebuilding ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-1" />
                      )}
                      Publish
                    </Button>
                  )}
                </div>
              </div>
              <PageHeader
                title="Edit Merchant Page"
                description={formData.businessName}
              />
            </div>

            {/* Completion Indicator */}
            <div className="mb-6">
              <CompletionIndicator data={completionData} />
            </div>

            {/* URLs */}
            <div className="grid gap-3 sm:grid-cols-2 mb-6">
              {/* Full URL with editable slug */}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      asChild
                    >
                      <a href={urls.full} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Short URL */}
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

                {/* Google Places Search */}
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
                      value={formData.categoryId}
                      onValueChange={(v) => updateField("categoryId", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
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
                  {/* Google Places Search for Address */}
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
                      Changing phone number will update the short URL
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
                    <ImageUploader
                      value={formData.logoUrl}
                      onChange={(url) => updateField("logoUrl", url || "")}
                      onUpload={handleLogoUpload}
                      aspectRatio="square"
                      className="max-w-[200px]"
                      placeholder="Drag logo here or click to browse"
                    />
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

                    {/* Sortable existing photos */}
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

                    {/* Upload new photos */}
                    <GalleryUploader
                      value={[]} // Don't show uploaded here, handled by SortableImageGrid above
                      onChange={(newUrls) => {
                        // Append new photos
                        updateField("photos", [...formData.photos, ...newUrls]);
                      }}
                      onUpload={handlePhotoUpload}
                    />
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
                ) : (
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
                )}
              </div>
            )}

            {/* Save Status */}
            <div className="mt-6 flex items-center justify-between">
              <AutoSaveIndicator
                status={status}
                lastSaved={lastSaved}
                error={saveError}
                onRetry={retry}
              />
              {saveError && (
                <p className="text-sm text-destructive">{saveError}</p>
              )}
            </div>
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
                  <DesignSelector value={previewDesign} onChange={setPreviewDesign} />
                </div>
                <div className="h-[calc(100%-60px)] overflow-y-auto">
                  <div className="transform scale-[0.5] origin-top-left w-[200%]">
                    {previewDesign === "art-deco" && <ArtDecoPreview data={previewData} />}
                    {previewDesign === "gatsby" && <GatsbyPreview data={previewData} />}
                    {previewDesign === "hollywood" && <HollywoodPreview data={previewData} />}
                    {previewDesign === "parisian" && <ParisianPreview data={previewData} />}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Preview components for mobile sheet
import { ArtDecoDesign } from "@/components/merchant-page/designs/art-deco";
import { GatsbyGlamourDesign } from "@/components/merchant-page/designs/gatsby-glamour";
import { VintageHollywoodDesign } from "@/components/merchant-page/designs/vintage-hollywood";
import { ParisianEleganceDesign } from "@/components/merchant-page/designs/parisian-elegance";

function ArtDecoPreview({ data }: { data: any }) {
  return <ArtDecoDesign {...data} />;
}

function GatsbyPreview({ data }: { data: any }) {
  return <GatsbyGlamourDesign {...data} />;
}

function HollywoodPreview({ data }: { data: any }) {
  return <VintageHollywoodDesign {...data} />;
}

function ParisianPreview({ data }: { data: any }) {
  return <ParisianEleganceDesign {...data} />;
}
