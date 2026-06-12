"use client";

import {
  ArrowLeft,
  Building2,
  Camera,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileAudio,
  FileText,
  Globe,
  Link2,
  Loader2,
  MapPin,
  Mic2,
  Music2,
  Phone,
  Plus,
  RadioTower,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Facebook, Instagram } from "@/components/icons/social-icons";
// Preview components
import { PhotoStripDesign } from "@/components/merchant-page/designs/photo-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  GooglePlacesAutocomplete,
  type PlaceDetails,
} from "@/components/ui/google-places-autocomplete";
import { GalleryUploader, ImageUploader } from "@/components/ui/image-uploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SortableImageGrid, SortableList } from "@/components/ui/sortable-list";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useManualSave } from "@/hooks/use-manual-save";
import {
  calculateCompletion,
  type MerchantData,
} from "@/lib/merchant-completion";
import { cn, formatPhoneNumber, stripPhoneNumber } from "@/lib/utils";
import { isValidVimeoUrl } from "@/lib/vimeo";
import {
  type Hours,
  HoursSection,
} from "../[id]/edit/_components/hours-section";
import {
  DeviceSelector,
  type DeviceType,
  getDeviceConfig,
  LivePreview,
} from "../[id]/edit/_components/live-preview";

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

interface MerchantOwner {
  id: string;
  email: string;
  role: "member" | "merchant" | "admin";
  name: string | null;
}

type CampaignAudioKind = "radioSpot" | "soundtrack";

interface CampaignAudioAsset {
  title: string;
  description?: string;
  url: string;
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
  uploadedAt?: string;
  status?: "ready" | "in_production" | "pending";
}

interface CampaignAudio {
  radioSpot?: CampaignAudioAsset | null;
  soundtrack?: CampaignAudioAsset | null;
  showOnProfile?: boolean;
  updatedAt?: string;
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
  campaignAudio: CampaignAudio | null;
  slug: string;
  featuredOnHomepage: boolean;
  isPublicPage: boolean;
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
  campaignAudio: null,
  slug: "",
  featuredOnHomepage: false,
  isPublicPage: true,
};

const INITIAL_URLS = { full: null, short: null } as const;
const INITIAL_OWNERS: MerchantOwner[] = [];

const sections = [
  { id: "business", label: "Business", icon: Building2 },
  { id: "location", label: "Location", icon: MapPin },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "hours", label: "Hours", icon: null },
  { id: "media", label: "Media", icon: Camera },
  { id: "services", label: "Services", icon: FileText },
  { id: "tracks", label: "Tracks", icon: RadioTower },
  { id: "visibility", label: "Visibility", icon: Eye },
  { id: "managers", label: "Managers", icon: Users },
];

const editOnlySectionIds = new Set(["visibility", "managers", "tracks"]);
const linksBarSectionIds = new Set(["visibility", "managers"]);

const merchantTrackSlots: Array<{
  kind: CampaignAudioKind;
  label: string;
  icon: typeof Mic2;
  fallbackTitle: string;
  fallbackDescription: string;
}> = [
  {
    kind: "radioSpot",
    label: "Radio Spot",
    icon: Mic2,
    fallbackTitle: "KLCP Radio Spot",
    fallbackDescription: "Final produced ad for KLCP 96.5 FM.",
  },
  {
    kind: "soundtrack",
    label: "Signature Soundtrack",
    icon: Music2,
    fallbackTitle: "Signature Soundtrack",
    fallbackDescription: "Custom music bed for the merchant campaign.",
  },
];

const audioAccept =
  "audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,.mp3,.m4a,.aac,.wav";
const emptyAudioCaptionsTrack = "data:text/vtt,WEBVTT%0A%0A";

function formatFileSize(bytes?: number) {
  if (!bytes || bytes <= 0) return null;

  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatUploadedAt(value?: string) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TrackUploadButton({
  inputId,
  label,
  isUploading,
  disabled,
  onFileSelect,
}: {
  inputId: string;
  label: string;
  isUploading: boolean;
  disabled: boolean;
  onFileSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) onFileSelect(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        id={inputId}
        accept={audioAccept}
        className="hidden"
        disabled={disabled}
        onChange={handleChange}
        type="file"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <UploadCloud className="w-4 h-4" />
        )}
        {label}
      </Button>
    </>
  );
}

interface MerchantFormProps {
  mode: "create" | "edit";
  surface?: "admin" | "merchant";
  merchantId?: string;
  initialData?: FormData;
  initialUrls?: { full: string | null; short: string | null };
  initialOwners?: MerchantOwner[];
  initialCategoryName?: string;
  categories: Category[];
  onSuccess?: (data: {
    id: string;
    urls: { full: string; short: string };
  }) => void;
}

export function MerchantForm({
  mode,
  surface = "admin",
  merchantId,
  initialData = INITIAL_FORM_DATA,
  initialUrls = INITIAL_URLS,
  initialOwners = INITIAL_OWNERS,
  initialCategoryName = "",
  categories,
  onSuccess,
}: MerchantFormProps) {
  // Form data
  const [formData, setFormData] = useState<FormData>(initialData);
  const [originalData, setOriginalData] = useState<FormData>(initialData);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [urls, setUrls] = useState(initialUrls);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("business");
  const [desktopPreviewDevice, setDesktopPreviewDevice] =
    useState<DeviceType>("desktop");
  const [previewDevice, setPreviewDevice] = useState<DeviceType>("mobile");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [categoryName, setCategoryName] = useState(initialCategoryName);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [owners, setOwners] = useState<MerchantOwner[]>(initialOwners);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState<MerchantOwner[]>([]);
  const [isOwnerSearchLoading, setIsOwnerSearchLoading] = useState(false);
  const [isOwnerSaving, setIsOwnerSaving] = useState(false);
  const [ownerError, setOwnerError] = useState("");
  const [uploadingTrack, setUploadingTrack] =
    useState<CampaignAudioKind | null>(null);
  const [tracksError, setTracksError] = useState("");
  const isAdminSurface = surface === "admin";
  const canManageOwners = isAdminSurface && mode === "edit";
  const canViewTracks = mode === "edit";
  const canUploadTracks = isAdminSurface && mode === "edit";
  const canManageHomepageFeature = isAdminSurface;
  const backHref = isAdminSurface ? "/admin/merchants" : "/merchant";
  const backLabel = isAdminSurface ? "Back" : "Dashboard";

  // Sync initial data changes (for edit mode when data loads)
  useEffect(() => {
    setFormData(initialData);
    setOriginalData(initialData);
  }, [initialData]);

  useEffect(() => {
    setUrls(initialUrls);
  }, [initialUrls]);

  useEffect(() => {
    setOwners(initialOwners);
  }, [initialOwners]);

  useEffect(() => {
    setCategoryName(initialCategoryName);
  }, [initialCategoryName]);

  // Update form field
  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Auto-save for edit mode
  const handleSave = useCallback(
    async (data: FormData) => {
      if (mode !== "edit" || (isAdminSurface && !merchantId)) return;

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
      if (strippedPhone?.length !== 10) {
        throw new Error("Phone number must be 10 digits");
      }
      if (data.vimeoUrl && !isValidVimeoUrl(data.vimeoUrl)) {
        throw new Error("Invalid Vimeo URL");
      }

      const payload: Record<string, unknown> = {
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
        hours:
          data.hours && Object.keys(data.hours).length > 0 ? data.hours : null,
        instagramUrl: data.instagramUrl?.trim() || null,
        facebookUrl: data.facebookUrl?.trim() || null,
        tiktokUrl: data.tiktokUrl?.trim() || null,
        photos: data.photos?.length > 0 ? data.photos : null,
        services:
          data.services?.length > 0
            ? data.services.map(({ name, description, price }) => ({
                name,
                description,
                price,
              }))
            : null,
        aboutStory: data.aboutStory?.trim() || null,
        isPublicPage: data.isPublicPage,
      };

      if (isAdminSurface) {
        payload.featuredOnHomepage = data.featuredOnHomepage;
      }
      if (canViewTracks) {
        payload.signatureTracksEnabled = Boolean(
          data.campaignAudio?.showOnProfile,
        );
      }

      const endpoint = isAdminSurface
        ? `/api/admin/merchant-pages/${merchantId}`
        : "/api/merchant/page";

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save");
      }
      setUrls(result.urls);
      setOriginalData(data);
    },
    [canViewTracks, isAdminSurface, mode, merchantId],
  );

  const {
    status,
    isDirty,
    isSaving,
    lastSaved,
    error: saveError,
    save,
    retry,
  } = useManualSave({
    data: formData,
    originalData,
    onSave: handleSave,
    enabled: mode === "edit",
  });

  const renderStepSaveButton = () => {
    if (mode !== "edit") return null;

    return (
      <Button
        type="button"
        size="sm"
        onClick={save}
        disabled={isSaving || !isDirty}
        className="shrink-0"
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-1" />
        )}
        Save
      </Button>
    );
  };

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
      if (strippedPhone?.length !== 10) {
        throw new Error("Phone number must be 10 digits");
      }
      if (formData.vimeoUrl && !isValidVimeoUrl(formData.vimeoUrl)) {
        throw new Error(
          "Invalid Vimeo URL. Use format: https://vimeo.com/123456789",
        );
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
          photos:
            formData.photos.filter((p) => p.trim()).length > 0
              ? formData.photos.filter((p) => p.trim())
              : null,
          services:
            formData.services.length > 0
              ? formData.services.map(({ name, description, price }) => ({
                  name,
                  description,
                  price,
                }))
              : null,
          aboutStory: formData.aboutStory.trim() || null,
          featuredOnHomepage: formData.featuredOnHomepage,
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
    if (mode !== "edit" || (isAdminSurface && !merchantId)) return;
    setIsRebuilding(true);
    try {
      const endpoint = isAdminSurface
        ? `/api/admin/merchant-pages/${merchantId}/revalidate`
        : "/api/merchant/page/revalidate";
      await fetch(endpoint, {
        method: "POST",
      });
    } catch (err) {
      console.error("Failed to rebuild:", err);
    } finally {
      setIsRebuilding(false);
    }
  }, [isAdminSurface, merchantId, mode]);

  useEffect(() => {
    if (!canManageOwners || ownerSearch.trim().length < 2) {
      setOwnerResults([]);
      setIsOwnerSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsOwnerSearchLoading(true);
      setOwnerError("");

      try {
        const res = await fetch(
          `/api/admin/users/search?q=${encodeURIComponent(ownerSearch.trim())}`,
          { signal: controller.signal },
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to search users");
        }

        const currentOwnerIds = new Set(owners.map((owner) => owner.id));
        setOwnerResults(
          (data.users || []).filter(
            (user: MerchantOwner) =>
              !currentOwnerIds.has(user.id) &&
              (user.role === "merchant" || user.role === "admin"),
          ),
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          setOwnerError(
            err instanceof Error ? err.message : "Failed to search users",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsOwnerSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [canManageOwners, ownerSearch, owners]);

  const saveOwners = useCallback(
    async (nextOwners: MerchantOwner[]) => {
      if (!canManageOwners || !merchantId) return;

      setOwnerError("");
      setIsOwnerSaving(true);

      try {
        const res = await fetch(
          `/api/admin/merchant-pages/${merchantId}/owners`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ownerUserIds: nextOwners.map((owner) => owner.id),
            }),
          },
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to update managers");
        }

        setOwners(data.owners || nextOwners);
        setOwnerSearch("");
        setOwnerResults([]);
      } catch (err) {
        setOwnerError(
          err instanceof Error ? err.message : "Failed to update managers",
        );
      } finally {
        setIsOwnerSaving(false);
      }
    },
    [canManageOwners, merchantId],
  );

  const addOwner = useCallback(
    (owner: MerchantOwner) => {
      if (owners.some((currentOwner) => currentOwner.id === owner.id)) return;
      saveOwners([...owners, owner]);
    },
    [owners, saveOwners],
  );

  const removeOwner = useCallback(
    (ownerId: string) => {
      if (owners.length <= 1) {
        setOwnerError("At least one manager is required");
        return;
      }

      saveOwners(owners.filter((owner) => owner.id !== ownerId));
    },
    [owners, saveOwners],
  );

  // Update category name when category changes
  useEffect(() => {
    if (formData.categoryId && categories.length > 0) {
      const cat = categories.find((c) => c.id === formData.categoryId);
      if (cat) {
        setCategoryName(cat.name);
      }
    }
  }, [formData.categoryId, categories]);

  const handlePlaceSelect = useCallback(
    (_name: string, placeId: string, details?: PlaceDetails) => {
      if (details) {
        setFormData((prev) => ({
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
    },
    [],
  );

  // Address-only version: updates location fields without touching businessName
  const handleAddressSelect = useCallback(
    (_name: string, placeId: string, details?: PlaceDetails) => {
      if (details) {
        setFormData((prev) => ({
          ...prev,
          googlePlaceId: placeId,
          streetAddress: details.streetAddress || prev.streetAddress,
          city: details.city || prev.city,
          state: details.state || prev.state,
          zipCode: details.zipCode || prev.zipCode,
        }));
      }
    },
    [],
  );

  const copyToClipboard = async (text: string, type: string) => {
    try {
      const fullUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${text}`
          : text;
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
    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        { id: `service-${Date.now()}`, name: "", description: "", price: "" },
      ],
    }));
  };

  const updateService = (
    id: string,
    field: keyof Omit<Service, "id">,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === id ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const removeService = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== id),
    }));
  };

  // Photo upload handler (edit mode only)
  const handlePhotoUpload = useCallback(
    async (file: File): Promise<string> => {
      if (isAdminSurface && !merchantId) {
        throw new Error("Cannot upload without merchant ID");
      }

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("type", "photo");

      const endpoint = isAdminSurface
        ? `/api/admin/merchant-pages/${merchantId}/upload-photo`
        : "/api/merchant/page/upload-photo";
      const res = await fetch(endpoint, {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const { url } = await res.json();
      return url;
    },
    [isAdminSurface, merchantId],
  );

  // Logo upload handler (edit mode only)
  const handleLogoUpload = useCallback(
    async (file: File): Promise<string> => {
      if (isAdminSurface && !merchantId) {
        throw new Error("Cannot upload without merchant ID");
      }

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("type", "logo");

      const endpoint = isAdminSurface
        ? `/api/admin/merchant-pages/${merchantId}/upload-photo`
        : "/api/merchant/page/upload-photo";
      const res = await fetch(endpoint, {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const { url } = await res.json();
      return url;
    },
    [isAdminSurface, merchantId],
  );

  const handleCampaignAudioUploaded = useCallback(
    (campaignAudio: CampaignAudio) => {
      setFormData((prev) => ({ ...prev, campaignAudio }));
      setOriginalData((prev) => ({ ...prev, campaignAudio }));
    },
    [],
  );

  const handleTrackUpload = useCallback(
    async (kind: CampaignAudioKind, file: File) => {
      if (!canUploadTracks || !merchantId) return;

      setTracksError("");
      setUploadingTrack(kind);

      const slot = merchantTrackSlots.find((track) => track.kind === kind);
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("kind", kind);
      formDataUpload.append(
        "title",
        `${formData.businessName || "Merchant"} ${slot?.fallbackTitle || "Track"}`,
      );
      if (slot?.fallbackDescription) {
        formDataUpload.append("description", slot.fallbackDescription);
      }

      try {
        const res = await fetch(
          `/api/admin/merchants/${merchantId}/campaign-audio`,
          {
            method: "POST",
            body: formDataUpload,
          },
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to upload track");
        }

        handleCampaignAudioUploaded(data.campaignAudio);
      } catch (err) {
        setTracksError(
          err instanceof Error ? err.message : "Failed to upload track",
        );
      } finally {
        setUploadingTrack(null);
      }
    },
    [
      canUploadTracks,
      formData.businessName,
      handleCampaignAudioUploaded,
      merchantId,
    ],
  );

  const visibleSections = useMemo(
    () =>
      sections.filter((section) => {
        if (mode !== "edit" && editOnlySectionIds.has(section.id)) {
          return false;
        }
        if (section.id === "managers") return canManageOwners;
        if (section.id === "tracks") return canViewTracks;
        return true;
      }),
    [canManageOwners, canViewTracks, mode],
  );
  const mainSections = useMemo(
    () =>
      visibleSections.filter((section) => !linksBarSectionIds.has(section.id)),
    [visibleSections],
  );
  const linksBarSections = useMemo(
    () =>
      visibleSections.filter((section) => linksBarSectionIds.has(section.id)),
    [visibleSections],
  );

  // Completion data for the header badge and section tabs.
  const completionData: MerchantData = useMemo(() => {
    const data: MerchantData = {
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
    };

    if (canViewTracks) {
      data.campaignAudio = formData.campaignAudio;
    }

    return data;
  }, [canViewTracks, formData]);

  const completion = useMemo(
    () => calculateCompletion(completionData),
    [completionData],
  );

  const completionBySection = useMemo(() => {
    return new Map(completion.sections.map((section) => [section.id, section]));
  }, [completion]);

  // Preview data for live preview
  const previewData = useMemo(
    () => ({
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
      hours:
        Object.keys(formData.hours).length > 0 ? formData.hours : undefined,
      instagramUrl: formData.instagramUrl || undefined,
      facebookUrl: formData.facebookUrl || undefined,
      tiktokUrl: formData.tiktokUrl || undefined,
      photos:
        formData.photos.filter((p) => p.trim()).length > 0
          ? formData.photos.filter((p) => p.trim())
          : undefined,
      services:
        formData.services.length > 0
          ? formData.services.map(({ name, description, price }) => ({
              name,
              description,
              price,
            }))
          : undefined,
      aboutStory: formData.aboutStory || undefined,
      campaignAudio: formData.campaignAudio || undefined,
    }),
    [formData, categoryName],
  );

  const fullUrlPrefix = `/business/${formData.city.toLowerCase() || "city"}/${
    formData.state.toLowerCase() || "st"
  }/`;
  const fullUrlPath = `${fullUrlPrefix}${formData.slug || "url-slug"}`;
  const shortUrlPath = urls.short || "";

  const renderPageLinksPopover = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          title="Page links"
        >
          <Link2 className="h-4 w-4" />
          <span className="sr-only">Page links</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        onOpenAutoFocus={(event) => event.preventDefault()}
        sideOffset={8}
        className="z-[1000] w-[360px] border-border !bg-white p-3 text-card-foreground shadow-xl dark:!bg-slate-950"
      >
        <div className="mb-3 flex items-center justify-between gap-3 border-b pb-2">
          <div>
            <p className="text-sm font-semibold">Page links</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Public page
            </p>
            <div className="flex min-w-0 items-center gap-1 rounded-md border bg-muted/35 p-1.5">
              <code
                className="min-w-0 max-w-[138px] truncate text-xs text-muted-foreground"
                title={fullUrlPrefix}
              >
                {fullUrlPrefix}
              </code>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  updateField(
                    "slug",
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                  )
                }
                placeholder="url-slug"
                className="h-7 min-w-0 flex-1 border-0 bg-background px-2 text-xs font-mono shadow-none focus-visible:ring-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => copyToClipboard(fullUrlPath, "full")}
                title={`Copy ${getFullUrl(fullUrlPath)}`}
              >
                {copiedUrl === "full" ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span className="sr-only">Copy public page URL</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                asChild
                title={`Open ${getFullUrl(fullUrlPath)}`}
              >
                <a
                  href={getFullUrl(fullUrlPath)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="sr-only">Open public page URL</span>
                </a>
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Short link
            </p>
            <div className="flex min-w-0 items-center gap-1 rounded-md border bg-muted/35 p-1.5">
              {shortUrlPath ? (
                <>
                  <code
                    className="min-w-0 flex-1 truncate px-1 text-xs font-mono"
                    title={getFullUrl(shortUrlPath)}
                  >
                    {shortUrlPath}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => copyToClipboard(shortUrlPath, "short")}
                    title={`Copy ${getFullUrl(shortUrlPath)}`}
                  >
                    {copiedUrl === "short" ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span className="sr-only">Copy short URL</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    asChild
                    title={`Open ${getFullUrl(shortUrlPath)}`}
                  >
                    <a
                      href={getFullUrl(shortUrlPath)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="sr-only">Open short URL</span>
                    </a>
                  </Button>
                </>
              ) : (
                <span className="min-w-0 flex-1 truncate px-1 text-xs text-muted-foreground">
                  Add phone to generate
                </span>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] xl:grid-cols-[minmax(0,1fr)_minmax(380px,460px)]">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={backHref}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {backLabel}
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "h-8 rounded-md border px-3 text-sm font-semibold",
                completion.percentage === 100
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-emerald-400/35 dark:bg-emerald-400/10 dark:text-emerald-100"
                  : completion.percentage === 0
                    ? "border-red-200 bg-red-50 text-red-700 dark:border-rose-400/35 dark:bg-rose-400/10 dark:text-rose-100"
                    : "border-sky-200 bg-sky-50 text-sky-700 dark:border-blue-300/40 dark:bg-blue-400/10 dark:text-blue-100",
              )}
            >
              {completion.percentage}% complete
            </Badge>
            {mode === "edit" &&
              linksBarSections.map((section) => {
                const isActive = activeSection === section.id;

                return (
                  <Button
                    key={section.id}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveSection(section.id)}
                    className="h-8 px-2.5 text-xs"
                  >
                    {section.icon && <section.icon className="h-3.5 w-3.5" />}
                    {section.label}
                  </Button>
                );
              })}
            {mode === "create" ? (
              <Button size="sm" onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Create Page
              </Button>
            ) : urls.full ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRebuild}
                disabled={isRebuilding}
                title="Refresh the cached public page"
              >
                {isRebuilding ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                Refresh Live
              </Button>
            ) : null}
          </div>
        </div>
        <div className="hidden min-w-0 items-center justify-between gap-3 px-1 lg:flex">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span>Live Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <DeviceSelector
              value={desktopPreviewDevice}
              onChange={setDesktopPreviewDevice}
            />
            {mode === "edit" && renderPageLinksPopover()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] xl:grid-cols-[minmax(0,1fr)_minmax(380px,460px)]">
        {/* Form Panel */}
        <div className="min-w-0">
        {/* Error */}
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Section Navigation */}
        <div className="scrollbar-x-site flex gap-1.5 mb-6 overflow-x-auto pl-1 pr-3 pt-3 pb-2">
          {mainSections.map((section) => {
            const progress = completionBySection.get(section.id);
            const isComplete = progress?.percentage === 100;
            const hasPartial =
              !!progress && progress.completed > 0 && !isComplete;
            const isEmpty = !!progress && progress.completed === 0;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "relative flex min-h-[46px] min-w-[92px] flex-1 items-center justify-center gap-1.5 overflow-visible rounded-lg border px-2 py-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer",
                  "border-border/60 bg-card/65 text-muted-foreground hover:border-sky-400/50 hover:bg-sky-500/10 hover:text-foreground",
                  "dark:border-white/10 dark:bg-white/[0.035] dark:text-blue-100/80 dark:hover:border-blue-300/40 dark:hover:bg-blue-500/10 dark:hover:text-white",
                  isActive &&
                    "border-sky-400/80 bg-sky-500/15 text-sky-950 shadow-sm dark:border-blue-300/60 dark:bg-blue-500/20 dark:text-white",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none absolute -right-2 -top-2 z-10 flex h-5 items-center gap-1 rounded-full border px-1.5 text-[10px] font-bold leading-none tabular-nums shadow-sm ring-2 ring-background",
                    isComplete &&
                      "border-green-500/25 bg-green-500/10 text-green-700 dark:border-green-400/30 dark:bg-green-950 dark:text-green-200",
                    hasPartial &&
                      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-950 dark:text-amber-200",
                    isEmpty &&
                      "border-red-500/25 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:bg-red-950 dark:text-red-200",
                    !progress &&
                      "border-muted-foreground/20 bg-muted text-muted-foreground",
                  )}
                >
                  {isComplete ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        hasPartial && "bg-amber-500",
                        isEmpty && "bg-red-500",
                        !progress && "bg-slate-400",
                      )}
                      aria-hidden="true"
                    />
                  )}
                  {progress ? `${progress.percentage}%` : "Edit"}
                </span>
                {section.icon && <section.icon className="h-3.5 w-3.5" />}
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Business Info Section */}
        {activeSection === "business" && (
          <div className="space-y-6 bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Business Information
              </h3>
              {renderStepSaveButton()}
            </div>

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
                <select
                  id="category"
                  value={formData.categoryId}
                  onChange={(event) =>
                    updateField("categoryId", event.target.value)
                  }
                  className="border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">No category</option>
                  {categories
                    .filter((cat) => Boolean(cat.id))
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
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
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </h3>
              {renderStepSaveButton()}
            </div>

            <div className="space-y-4">
              <div>
                <Label>Search Address on Google Places</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Search to auto-fill address details from Google
                </p>
                <GooglePlacesAutocomplete
                  value=""
                  onChange={handleAddressSelect}
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
                    onChange={(e) =>
                      updateField(
                        "state",
                        e.target.value.toUpperCase().slice(0, 2),
                      )
                    }
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
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact & Social
              </h3>
              {renderStepSaveButton()}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    updateField("phone", formatPhoneNumber(e.target.value))
                  }
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
                      onChange={(e) =>
                        updateField("instagramUrl", e.target.value)
                      }
                      placeholder="https://instagram.com/username"
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={formData.facebookUrl}
                      onChange={(e) =>
                        updateField("facebookUrl", e.target.value)
                      }
                      placeholder="https://facebook.com/page"
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
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
            headerAction={renderStepSaveButton()}
          />
        )}

        {/* Media Section */}
        {activeSection === "media" && (
          <div className="space-y-6 bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Media
              </h3>
              {renderStepSaveButton()}
            </div>

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
                            updateField(
                              "photos",
                              formData.photos.filter((_, i) => i !== index),
                            );
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
                      You can upload photos after creating the page. For now,
                      add photo URLs:
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
                          onClick={() =>
                            updateField(
                              "photos",
                              formData.photos.filter((_, i) => i !== idx),
                            )
                          }
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateField("photos", [...formData.photos, ""])
                      }
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Photo URL
                    </Button>
                  </>
                )}
              </div>

              {/* Feature on Homepage */}
              {canManageHomepageFeature && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="featuredOnHomepage"
                      checked={formData.featuredOnHomepage}
                      onCheckedChange={(checked) =>
                        updateField("featuredOnHomepage", Boolean(checked))
                      }
                    />
                    <Label
                      htmlFor="featuredOnHomepage"
                      className="mb-0 cursor-pointer"
                    >
                      Feature on Homepage
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-7">
                    Show this merchant in the homepage slider
                  </p>
                </div>
              )}
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
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addService}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Service
                </Button>
                {renderStepSaveButton()}
              </div>
            </div>

            {formData.services.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No services added yet</p>
                <p className="text-sm">
                  Click &quot;Add Service&quot; to get started
                </p>
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
                          onChange={(e) =>
                            updateService(service.id, "name", e.target.value)
                          }
                          placeholder="Service name"
                        />
                      </div>
                      <div className="w-28">
                        <Label className="text-xs">Price</Label>
                        <Input
                          value={service.price || ""}
                          onChange={(e) =>
                            updateService(service.id, "price", e.target.value)
                          }
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
                        onChange={(e) =>
                          updateService(
                            service.id,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="Brief description..."
                        rows={2}
                      />
                    </div>
                  </div>
                )}
                renderDragOverlay={(service) => (
                  <div className="text-sm font-medium">
                    {service.name || "Service"}
                  </div>
                )}
              />
            ) : (
              <div className="space-y-4">
                {formData.services.map((service) => (
                  <div
                    key={service.id}
                    className="border rounded-lg p-4 space-y-3 bg-background"
                  >
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Label className="text-xs">Name *</Label>
                        <Input
                          value={service.name}
                          onChange={(e) =>
                            updateService(service.id, "name", e.target.value)
                          }
                          placeholder="Service name"
                        />
                      </div>
                      <div className="w-28">
                        <Label className="text-xs">Price</Label>
                        <Input
                          value={service.price || ""}
                          onChange={(e) =>
                            updateService(service.id, "price", e.target.value)
                          }
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
                        onChange={(e) =>
                          updateService(
                            service.id,
                            "description",
                            e.target.value,
                          )
                        }
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

        {/* Visibility Section */}
        {activeSection === "visibility" && mode === "edit" && (
          <div className="space-y-6 bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Public Visibility
              </h3>
              {renderStepSaveButton()}
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/25 p-4">
              <div>
                <Label htmlFor="isPublicPage">Public visibility</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formData.isPublicPage
                    ? "Public page is on"
                    : "Public page is off"}
                </p>
              </div>
              <Switch
                id="isPublicPage"
                checked={formData.isPublicPage}
                onCheckedChange={(checked) =>
                  updateField("isPublicPage", Boolean(checked))
                }
              />
            </div>
          </div>
        )}

        {/* Managers Section */}
        {activeSection === "managers" &&
          canManageOwners &&
          merchantId && (
          <div className="space-y-6 bg-card border rounded-lg p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 font-semibold">
                  <Users className="h-5 w-5" />
                  Merchant Dashboard Managers
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Managers can open this merchant dashboard and manage the
                  shared profile.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isOwnerSaving && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving
                  </span>
                )}
                {renderStepSaveButton()}
              </div>
            </div>

            <div className="space-y-2">
              {owners.map((owner) => (
                <div
                  key={owner.id}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {owner.name || owner.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {owner.email} · {owner.role}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeOwner(owner.id)}
                    disabled={isOwnerSaving || owners.length <= 1}
                    title={
                      owners.length <= 1
                        ? "At least one manager is required"
                        : "Remove manager"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div>
              <Label htmlFor="ownerSearch">Add Manager</Label>
              <Input
                id="ownerSearch"
                value={ownerSearch}
                onChange={(event) => setOwnerSearch(event.target.value)}
                placeholder="Search admin or merchant users by name or email"
                disabled={isOwnerSaving}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Only admin and merchant users can be assigned as dashboard
                managers.
              </p>
            </div>

            {(isOwnerSearchLoading || ownerResults.length > 0) && (
              <div className="overflow-hidden rounded-lg border">
                {isOwnerSearchLoading ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching users
                  </div>
                ) : (
                  ownerResults.map((owner) => (
                    <button
                      key={owner.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => addOwner(owner)}
                      disabled={isOwnerSaving}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {owner.name || owner.email}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {owner.email} · {owner.role}
                        </span>
                      </span>
                      <Plus className="h-4 w-4 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}

            {ownerError && (
              <p className="text-sm text-destructive">{ownerError}</p>
            )}
          </div>
        )}

        {/* Tracks Section */}
        {activeSection === "tracks" && canViewTracks && (
          <div className="space-y-6 bg-card border rounded-lg p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <RadioTower className="w-5 h-5" />
                  Merchant Tracks
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Radio spot and signature soundtrack files for this merchant.
                </p>
              </div>
              {renderStepSaveButton()}
            </div>

            {mode !== "edit" || !merchantId ? (
              <div className="rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
                Tracks can be added after the merchant page is created.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/25 p-4">
                  <div>
                    <Label htmlFor="signatureTracksEnabled">
                      Show tracks on public profile
                    </Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Off by default. Turn on to display uploaded radio and
                      signature tracks on the public merchant page.
                    </p>
                  </div>
                  <Switch
                    id="signatureTracksEnabled"
                    checked={Boolean(formData.campaignAudio?.showOnProfile)}
                    onCheckedChange={(checked) =>
                      updateField("campaignAudio", {
                        ...(formData.campaignAudio || {}),
                        showOnProfile: Boolean(checked),
                      })
                    }
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {merchantTrackSlots.map((track) => {
                    const Icon = track.icon;
                    const asset = formData.campaignAudio?.[track.kind] || null;
                    const isUploading = uploadingTrack === track.kind;
                    const fileSize = formatFileSize(asset?.sizeBytes);
                    const uploadedAt = formatUploadedAt(asset?.uploadedAt);

                    return (
                      <article
                        key={track.kind}
                        className="flex min-h-[320px] flex-col rounded-lg border bg-background p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Icon className="w-5 h-5" />
                            </span>
                            <div className="min-w-0">
                              <h4 className="font-semibold">
                                {asset?.title || track.label}
                              </h4>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {asset?.description ||
                                  track.fallbackDescription}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "border",
                              asset?.url
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-muted-foreground/25 bg-muted text-muted-foreground",
                            )}
                          >
                            {asset?.url ? "Ready" : "Pending"}
                          </Badge>
                        </div>

                        <div className="mt-4 flex-1 rounded-lg border bg-muted/25 p-3">
                          {asset?.url ? (
                            <div className="space-y-3">
                              <audio
                                className="w-full"
                                controls
                                preload="metadata"
                                src={asset.url}
                              >
                                <track
                                  default
                                  kind="captions"
                                  label="Captions"
                                  src={emptyAudioCaptionsTrack}
                                />
                              </audio>
                              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                {asset.fileName && (
                                  <div className="flex min-w-0 items-center gap-2">
                                    <FileAudio className="w-4 h-4 shrink-0" />
                                    <span className="truncate">
                                      {asset.fileName}
                                    </span>
                                  </div>
                                )}
                                {fileSize && (
                                  <div className="flex items-center gap-2">
                                    <FileAudio className="w-4 h-4 shrink-0" />
                                    <span>{fileSize}</span>
                                  </div>
                                )}
                                {uploadedAt && (
                                  <div className="sm:col-span-2">
                                    Uploaded {uploadedAt}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-full min-h-[132px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
                              <FileAudio className="mb-2 w-8 h-8 opacity-50" />
                              <p>No track uploaded yet</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          {canUploadTracks && (
                            <TrackUploadButton
                              inputId={`merchant-track-${track.kind}`}
                              label={
                                asset?.url ? "Replace Track" : "Upload Track"
                              }
                              isUploading={isUploading}
                              disabled={uploadingTrack !== null}
                              onFileSelect={(file) =>
                                handleTrackUpload(track.kind, file)
                              }
                            />
                          )}
                          {asset?.url && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={asset.url} download>
                                <Download className="w-4 h-4" />
                                Download
                              </a>
                            </Button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {tracksError && (
              <p className="text-sm text-destructive">{tracksError}</p>
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
                  Saved{" "}
                  {lastSaved &&
                    `at ${lastSaved.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                </span>
              )}
              {status === "error" && (
                <span className="flex items-center gap-2 text-destructive">
                  Failed to save
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={retry}
                    className="h-6 px-2 text-xs"
                  >
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
      <div className="hidden min-w-0 lg:block sticky top-4 self-start">
        <LivePreview
          data={previewData}
          device={desktopPreviewDevice}
          onDeviceChange={setDesktopPreviewDevice}
          showHeader={false}
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
                <DeviceSelector
                  value={previewDevice}
                  onChange={setPreviewDevice}
                />
              </div>
            </div>
            <div className="h-[calc(100%-60px)] overflow-auto bg-muted/30 flex justify-center">
              <MobilePreviewContent device={previewDevice} data={previewData} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
    </div>
  );
}

function MobilePreviewContent({
  device,
  data,
}: {
  device: DeviceType;
  data: any;
}) {
  const deviceConfig = getDeviceConfig(device);

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
        <PhotoStripDesign {...data} />
      </div>
    </div>
  );
}
