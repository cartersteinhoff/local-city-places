"use client";

/**
 * Art Deco Visual Editor
 *
 * A WYSIWYG editing experience for merchant pages.
 * Click on any element to edit it directly.
 */

import { useState } from "react";
import { Poiret_One, Raleway } from "next/font/google";
import {
  MapPin, Phone, Globe, Gem, Navigation, Clock, Instagram, Facebook,
  Image as ImageIcon, Sparkles, Plus, Video, Pencil, X, Check,
  GripVertical, Trash2
} from "lucide-react";
import { formatPhoneNumber, stripPhoneNumber } from "@/lib/utils";
import { extractVimeoId, getVimeoEmbedUrl, isValidVimeoUrl } from "@/lib/vimeo";
import { GoogleMapEmbed, getGoogleMapsDirectionsUrl, formatFullAddress } from "@/components/merchant-page/google-map-embed";
import { EditableText } from "@/components/ui/editable-text";
import { EditableImage } from "@/components/ui/editable-image";
import { SortableGrid } from "@/components/ui/sortable-grid";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const poiretOne = Poiret_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const raleway = Raleway({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  display: "swap",
});

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

interface Category {
  id: string;
  name: string;
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

type DeviceType = "desktop" | "tablet" | "mobile";

interface ArtDecoVisualEditorProps {
  data: FormData;
  categories: Category[];
  onUpdate: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  onPhotoUpload: (file: File) => Promise<string>;
  onLogoUpload: (file: File) => Promise<string>;
  showEditHints?: boolean;
  device?: DeviceType;
}

// Time options for hours picker
const TIME_OPTIONS = [
  "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM",
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
  "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM",
];

function parseHoursValue(value: string | undefined): { isOpen: boolean; open: string; close: string } {
  if (!value || value.toLowerCase() === "closed") {
    return { isOpen: false, open: "9:00 AM", close: "5:00 PM" };
  }
  if (value === "24 Hours") {
    return { isOpen: true, open: "12:00 AM", close: "11:59 PM" };
  }

  // Parse HH:MM-HH:MM format
  const match = value.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (match) {
    const formatTime = (h: string, m: string) => {
      const hour = parseInt(h);
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${m} ${period}`;
    };
    return { isOpen: true, open: formatTime(match[1], match[2]), close: formatTime(match[3], match[4]) };
  }

  // Try display format
  const displayMatch = value.match(/^(.+?)\s*-\s*(.+)$/);
  if (displayMatch) {
    return { isOpen: true, open: displayMatch[1].trim(), close: displayMatch[2].trim() };
  }

  return { isOpen: true, open: "9:00 AM", close: "5:00 PM" };
}

function formatHoursForStorage(isOpen: boolean, open: string, close: string): string {
  if (!isOpen) return "Closed";

  const parseTime = (t: string): string => {
    const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return "09:00";
    let [, h, m, period] = match;
    let hour = parseInt(h);
    if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, "0")}:${m}`;
  };

  return `${parseTime(open)}-${parseTime(close)}`;
}

function formatHoursDisplay(value: string | undefined): string {
  if (!value) return "—";
  if (value.toLowerCase() === "closed") return "Closed";
  if (value === "24 Hours") return "24 Hours";

  const parsed = parseHoursValue(value);
  if (!parsed.isOpen) return "Closed";
  return `${parsed.open} - ${parsed.close}`;
}

// Inline editable field with popover
function InlineEditField({
  value,
  onChange,
  label,
  icon: Icon,
  placeholder,
  type = "text",
  className,
  displayValue,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  icon: typeof Phone;
  placeholder?: string;
  type?: string;
  className?: string;
  displayValue?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onChange(editValue);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex items-center gap-3 hover:opacity-80 transition-opacity text-left group",
          className
        )}>
          <Icon className="w-5 h-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider opacity-70">{label}</p>
            <p className={`font-semibold truncate ${raleway.className}`}>
              {displayValue || value || <span className="opacity-50 italic">Click to add</span>}
            </p>
          </div>
          <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <label className="text-sm font-medium">{label}</label>
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Hours editor row
function HoursEditorRow({
  day,
  label,
  value,
  onChange,
  editableClass,
}: {
  day: string;
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  editableClass: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const parsed = parseHoursValue(value);
  const [isOpenToday, setIsOpenToday] = useState(parsed.isOpen);
  const [openTime, setOpenTime] = useState(parsed.open);
  const [closeTime, setCloseTime] = useState(parsed.close);

  const handleSave = () => {
    onChange(formatHoursForStorage(isOpenToday, openTime, closeTime));
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={cn(
          "flex justify-between items-center py-2 border-b border-[#D4AF37]/10 last:border-0 cursor-pointer group",
          editableClass
        )}>
          <span className={`text-[#D4AF37] ${raleway.className}`}>{label}</span>
          <span className={`text-[#F5F1E6]/70 ${raleway.className} flex items-center gap-2`}>
            {formatHoursDisplay(value)}
            <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50" />
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{label}</label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isOpenToday}
                onChange={(e) => setIsOpenToday(e.target.checked)}
                className="rounded"
              />
              Open
            </label>
          </div>

          {isOpenToday && (
            <div className="flex items-center gap-2">
              <Select value={openTime} onValueChange={setOpenTime}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">to</span>
              <Select value={closeTime} onValueChange={setCloseTime}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ArtDecoVisualEditor({
  data,
  categories,
  onUpdate,
  onPhotoUpload,
  onLogoUpload,
  showEditHints = true,
  device = "desktop",
}: ArtDecoVisualEditorProps) {
  const isMobile = device === "mobile";
  const isTablet = device === "tablet";
  const isDesktop = device === "desktop";
  const {
    businessName,
    categoryId,
    streetAddress,
    city,
    state,
    zipCode,
    logoUrl,
    categoryName,
    phone,
    website,
    description,
    vimeoUrl,
    googlePlaceId,
    hours,
    instagramUrl,
    facebookUrl,
    tiktokUrl,
    photos,
    services,
    aboutStory,
  } = data;

  const location = [city, state].filter(Boolean).join(", ");
  const fullAddress = formatFullAddress(streetAddress, city, state, zipCode);
  const videoId = vimeoUrl ? extractVimeoId(vimeoUrl) : null;
  const directionsUrl = getGoogleMapsDirectionsUrl(businessName, streetAddress, city, state, zipCode, googlePlaceId);

  const editableClass = showEditHints
    ? "outline-dashed outline-2 outline-transparent hover:outline-blue-400/50 transition-all rounded"
    : "";

  const updateService = (index: number, field: keyof Service, value: string) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    onUpdate("services", newServices);
  };

  const addService = () => {
    onUpdate("services", [...services, { name: "New Service", description: "", price: "" }]);
  };

  const removeService = (index: number) => {
    onUpdate("services", services.filter((_, i) => i !== index));
  };

  const updateHour = (day: keyof Hours, value: string) => {
    onUpdate("hours", { ...hours, [day]: value });
  };

  const addPhoto = async (file: File) => {
    const url = await onPhotoUpload(file);
    onUpdate("photos", [...photos, url]);
  };

  const removePhoto = (index: number) => {
    onUpdate("photos", photos.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-[#0D1F22] text-[#F5F1E6] relative">
      {/* Art deco pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="relative border-b border-[#D4AF37]/30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#D4AF37] flex items-center justify-center rotate-45">
              <Gem className="w-5 h-5 text-[#D4AF37] -rotate-45" />
            </div>
            <span className="text-xs tracking-[0.3em] uppercase text-[#D4AF37]/70">Local City Places</span>
          </div>
        </div>
      </header>

      {/* Editable Contact Strip */}
      <div className="bg-gradient-to-r from-[#D4AF37] via-[#E5C97B] to-[#D4AF37] text-[#0D1F22]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className={cn(
            "flex flex-wrap items-center justify-center",
            isMobile ? "gap-4" : "gap-6 sm:gap-10"
          )}>
            <InlineEditField
              value={phone}
              onChange={(val) => onUpdate("phone", formatPhoneNumber(val))}
              label="Telephone"
              icon={Phone}
              placeholder="(555) 123-4567"
              type="tel"
              displayValue={phone ? formatPhoneNumber(phone) : undefined}
            />
            <InlineEditField
              value={website}
              onChange={(val) => onUpdate("website", val)}
              label="Website"
              icon={Globe}
              placeholder="https://example.com"
              type="url"
              displayValue={website?.replace(/^https?:\/\//, "")}
            />
            <InlineEditField
              value={[streetAddress, city, state, zipCode].filter(Boolean).join(", ")}
              onChange={(val) => {
                // Parse the address - simple approach
                const parts = val.split(",").map(p => p.trim());
                if (parts.length >= 1) onUpdate("streetAddress", parts[0] || "");
                if (parts.length >= 2) onUpdate("city", parts[1] || "");
                if (parts.length >= 3) onUpdate("state", parts[2]?.slice(0, 2)?.toUpperCase() || "");
                if (parts.length >= 4) onUpdate("zipCode", parts[3] || "");
              }}
              label="Location"
              icon={MapPin}
              placeholder="123 Main St, City, ST, 12345"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className={cn("max-w-6xl mx-auto px-4 py-12", isDesktop && "lg:py-16")}>
          <div className={cn(
            "grid gap-12 items-start",
            isDesktop && "lg:grid-cols-2",
            (isMobile || isTablet) && "grid-cols-1"
          )}>
            {/* Left - Business Info */}
            <div className={cn("text-center", isDesktop && "lg:text-left")}>
              {/* Editable Logo */}
              <div className={cn("inline-block mb-8", editableClass)}>
                <div className="relative">
                  <div className="absolute inset-0 bg-[#D4AF37]/20 blur-xl" />
                  <div className="absolute -top-3 -left-3 w-4 h-4 bg-[#D4AF37] rotate-45" />
                  <div className="absolute -top-3 -right-3 w-4 h-4 bg-[#D4AF37] rotate-45" />
                  <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-[#D4AF37] rotate-45" />
                  <div className="absolute -bottom-3 -right-3 w-4 h-4 bg-[#D4AF37] rotate-45" />

                  <EditableImage
                    value={logoUrl}
                    onChange={(url) => onUpdate("logoUrl", url || "")}
                    onUpload={onLogoUpload}
                    className="relative w-32 h-32 border-2 border-[#D4AF37]"
                    aspectRatio="square"
                    placeholder="Add Logo"
                  />
                </div>
              </div>

              {/* Editable Category */}
              <div className="mb-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(
                      "inline-flex items-center gap-3 text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] group cursor-pointer",
                      editableClass
                    )}>
                      <span className="w-8 h-px bg-[#D4AF37]/50" />
                      {categoryName || <span className="opacity-50">Select Category</span>}
                      <span className="w-8 h-px bg-[#D4AF37]/50" />
                      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select
                        value={categoryId}
                        onValueChange={(val) => {
                          onUpdate("categoryId", val);
                          const cat = categories.find(c => c.id === val);
                          if (cat) onUpdate("categoryName", cat.name);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
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
                  </PopoverContent>
                </Popover>
              </div>

              {/* Editable Business Name */}
              <div className="relative mb-8">
                <div className={cn("flex items-center justify-center gap-3 mb-4", isDesktop && "lg:justify-start")}>
                  <div className="w-2 h-2 bg-[#D4AF37] rotate-45" />
                  <div className="w-16 h-px bg-gradient-to-r from-[#D4AF37] to-transparent" />
                </div>

                <div className={editableClass}>
                  <EditableText
                    value={businessName}
                    onChange={(val) => onUpdate("businessName", val)}
                    placeholder="Business Name"
                    as="h1"
                    className={cn(
                      "font-light leading-tight bg-gradient-to-r from-[#F5F1E6] via-[#D4AF37] to-[#F5F1E6] bg-clip-text text-transparent",
                      poiretOne.className,
                      isMobile ? "text-3xl" : isTablet ? "text-4xl" : "text-4xl sm:text-5xl lg:text-6xl"
                    )}
                    inputClassName="!text-[#F5F1E6] !bg-[#0D1F22]/80"
                  />
                </div>

                <div className={cn("flex items-center justify-center gap-3 mt-4", isDesktop && "lg:justify-start")}>
                  <div className="w-24 h-px bg-gradient-to-r from-[#D4AF37] to-transparent" />
                  <div className="w-2 h-2 bg-[#D4AF37] rotate-45" />
                  <div className="w-12 h-px bg-gradient-to-l from-[#D4AF37] to-transparent" />
                </div>
              </div>

              {/* Editable Description */}
              <div className={cn("mb-10 max-w-lg mx-auto", isDesktop && "lg:mx-0", editableClass)}>
                <EditableText
                  value={description}
                  onChange={(val) => onUpdate("description", val)}
                  placeholder="Add a short description..."
                  as="p"
                  multiline
                  className={`text-lg text-[#F5F1E6]/70 leading-relaxed ${raleway.className}`}
                  inputClassName="!text-[#F5F1E6]/70 !bg-[#0D1F22]/80"
                />
              </div>

              {/* CTA Buttons - display only */}
              <div className={cn(
                "flex gap-4 justify-center",
                isMobile ? "flex-col" : "flex-row",
                isDesktop && "lg:justify-start"
              )}>
                {phone && (
                  <span className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#D4AF37] via-[#E5C97B] to-[#D4AF37] text-[#0D1F22] font-medium">
                    <Phone className="w-5 h-5" />
                    <span className={poiretOne.className}>Call Now</span>
                  </span>
                )}
                {website && (
                  <span className="flex items-center justify-center gap-3 px-8 py-4 border border-[#D4AF37]">
                    <Globe className="w-5 h-5 text-[#D4AF37]" />
                    <span className={poiretOne.className}>Visit Website</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right - Editable Video */}
            <div className="flex flex-col items-center gap-4">
              {videoId ? (
                <div className="relative">
                  <div className="absolute -inset-4 border border-[#D4AF37]/30" />
                  <div className="absolute -inset-6 border border-[#D4AF37]/20" />
                  <div className="absolute -top-8 -left-8 w-4 h-4 bg-[#D4AF37] rotate-45" />
                  <div className="absolute -top-8 -right-8 w-4 h-4 bg-[#D4AF37] rotate-45" />
                  <div className="absolute -bottom-8 -left-8 w-4 h-4 bg-[#D4AF37] rotate-45" />
                  <div className="absolute -bottom-8 -right-8 w-4 h-4 bg-[#D4AF37] rotate-45" />

                  <div
                    className={cn(
                      "relative border-2 border-[#D4AF37] bg-black overflow-hidden",
                      isMobile ? "w-[200px]" : "w-[260px] sm:w-[300px]"
                    )}
                    style={{ aspectRatio: '9/16' }}
                  >
                    <iframe
                      src={`${getVimeoEmbedUrl(videoId)}?background=0&autoplay=0&title=0&byline=0&portrait=0`}
                      className="absolute inset-0 w-full h-full"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title="Featured video"
                    />
                  </div>

                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center">
                    <p className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]/70">Merchant Tracks</p>
                  </div>
                </div>
              ) : null}

              {/* Video URL Editor */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-2 px-4 py-2 border border-[#D4AF37]/30 text-[#D4AF37] text-sm hover:bg-[#D4AF37]/10 transition-colors mt-8",
                    editableClass
                  )}>
                    <Video className="w-4 h-4" />
                    {videoId ? "Change Video" : "Add Video"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Vimeo Video URL</label>
                    <Input
                      value={vimeoUrl}
                      onChange={(e) => onUpdate("vimeoUrl", e.target.value)}
                      placeholder="https://vimeo.com/123456789"
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste a Vimeo video URL
                    </p>
                    {vimeoUrl && !isValidVimeoUrl(vimeoUrl) && (
                      <p className="text-xs text-red-500">Invalid Vimeo URL</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
          <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
          <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
        </div>

        {/* Map Section - right after hero, before story */}
        {(googlePlaceId || fullAddress) && (
          <div id="location" className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h2 className={`text-2xl ${poiretOne.className}`}>
                  <span className="text-[#D4AF37]">✦</span> Our Location
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
              </div>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors text-sm"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
              </a>
            </div>
            {fullAddress && (
              <p className={`text-center text-[#F5F1E6]/70 mb-6 ${raleway.className}`}>{fullAddress}</p>
            )}
            <div className="relative">
              <div className="absolute -inset-2 border border-[#D4AF37]/30" />
              <GoogleMapEmbed
                businessName={businessName}
                streetAddress={streetAddress}
                city={city}
                state={state}
                zipCode={zipCode}
                googlePlaceId={googlePlaceId}
                height="300px"
                mapStyle="dark"
              />
            </div>
          </div>
        )}

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
          <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
          <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
        </div>

        {/* Editable About Story */}
        <div id="story" className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            <h2 className={`text-2xl ${poiretOne.className}`}>Our Story</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
          </div>
          <div className={cn("border border-[#D4AF37]/20 p-8", editableClass)}>
            <EditableText
              value={aboutStory}
              onChange={(val) => onUpdate("aboutStory", val)}
              placeholder="Tell your story... Click to add your business history, mission, or what makes you unique."
              as="p"
              multiline
              className={`text-[#F5F1E6]/80 leading-relaxed whitespace-pre-line ${raleway.className}`}
              inputClassName="!text-[#F5F1E6]/80 !bg-[#0D1F22]/80 min-h-[200px]"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
          <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
          <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
        </div>

        {/* Editable Hours with Time Pickers */}
        <div id="hours" className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            <Clock className="w-6 h-6 text-[#D4AF37]" />
            <h2 className={`text-2xl ${poiretOne.className}`}>Hours of Operation</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
          </div>
          <div className={cn(
            "grid gap-4 border border-[#D4AF37]/20 p-8",
            isMobile ? "grid-cols-1" : "grid-cols-2"
          )}>
            {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((day) => (
              <HoursEditorRow
                key={day}
                day={day}
                label={day.charAt(0).toUpperCase() + day.slice(1)}
                value={hours[day]}
                onChange={(val) => updateHour(day, val)}
                editableClass={editableClass}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
          <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
          <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
        </div>

        {/* Editable Services with Drag */}
        <div id="services" className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            <Sparkles className="w-6 h-6 text-[#D4AF37]" />
            <h2 className={`text-2xl ${poiretOne.className}`}>Our Services</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
          </div>
          <div className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-1" : isTablet ? "grid-cols-2" : "grid-cols-3"
          )}>
            <SortableGrid
              items={services}
              getItemId={(_, idx) => `service-${idx}`}
              onReorder={(newServices) => onUpdate("services", newServices)}
              className={cn(
                "grid gap-4 col-span-full",
                isMobile ? "grid-cols-1" : isTablet ? "grid-cols-2" : "grid-cols-3"
              )}
              renderItem={(service, idx) => (
                <div
                  className={cn(
                    "border border-[#D4AF37]/20 p-6 hover:border-[#D4AF37]/40 transition-all relative group",
                    editableClass
                  )}
                >
                  <div className="absolute top-2 left-2 opacity-30 group-hover:opacity-70 transition-opacity">
                    <GripVertical className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeService(idx); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="flex justify-between items-start mb-2 pl-4">
                    <EditableText
                      value={service.name}
                      onChange={(val) => updateService(idx, "name", val)}
                      placeholder="Service name"
                      as="h3"
                      className={`text-lg text-[#D4AF37] ${poiretOne.className}`}
                      inputClassName="!text-[#D4AF37] !bg-[#0D1F22]/80"
                    />
                    <EditableText
                      value={service.price || ""}
                      onChange={(val) => updateService(idx, "price", val)}
                      placeholder="$0"
                      className={`text-[#E5C97B] ${raleway.className}`}
                      inputClassName="!text-[#E5C97B] !bg-[#0D1F22]/80 w-20 text-right"
                    />
                  </div>
                  <div className="pl-4">
                    <EditableText
                      value={service.description || ""}
                      onChange={(val) => updateService(idx, "description", val)}
                      placeholder="Service description"
                      as="p"
                      className={`text-sm text-[#F5F1E6]/60 ${raleway.className}`}
                      inputClassName="!text-[#F5F1E6]/60 !bg-[#0D1F22]/80"
                    />
                  </div>
                </div>
              )}
            />
            <button
              onClick={addService}
              className="border-2 border-dashed border-[#D4AF37]/30 p-6 hover:border-[#D4AF37]/60 transition-colors flex items-center justify-center gap-2 text-[#D4AF37]/60 hover:text-[#D4AF37] min-h-[120px]"
            >
              <Plus className="w-5 h-5" />
              Add Service
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
          <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
          <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
        </div>

        {/* Editable Photo Gallery with Drag */}
        <div id="gallery" className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            <ImageIcon className="w-6 h-6 text-[#D4AF37]" />
            <h2 className={`text-2xl ${poiretOne.className}`}>Gallery</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
          </div>
          <div className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-2" : isTablet ? "grid-cols-3" : "grid-cols-4"
          )}>
            <SortableGrid
              items={photos}
              getItemId={(photo, idx) => `photo-${idx}-${photo.slice(-20)}`}
              onReorder={(newPhotos) => onUpdate("photos", newPhotos)}
              className={cn(
                "grid gap-4 col-span-full",
                isMobile ? "grid-cols-2" : isTablet ? "grid-cols-3" : "grid-cols-4"
              )}
              renderItem={(photo, idx) => (
                <div
                  className="relative aspect-square border-2 border-[#D4AF37]/30 overflow-hidden group"
                >
                  <img
                    src={photo}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <div className="bg-white/20 rounded-full p-2">
                      <GripVertical className="w-5 h-5 text-white" />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removePhoto(idx); }}
                      className="bg-red-500/80 rounded-full p-2 hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  {/* Art deco corners */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37]" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37]" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]" />
                </div>
              )}
            />
            {/* Add photo button */}
            <label className="aspect-square border-2 border-dashed border-[#D4AF37]/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5 transition-colors">
              <Plus className="w-8 h-8 text-[#D4AF37]/60" />
              <span className="text-sm text-[#D4AF37]/60">Add Photo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) addPhoto(file);
                }}
              />
            </label>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
          <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
          <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
        </div>

        {/* Editable Social Links */}
        <div className="border-t border-[#D4AF37]/20">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col items-center gap-4">
              <span className={`text-sm text-[#F5F1E6]/50 ${raleway.className}`}>Social Media</span>
              <div className="flex items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(
                      "w-12 h-12 border flex items-center justify-center transition-all",
                      instagramUrl ? "border-[#D4AF37]/50 hover:border-[#D4AF37]" : "border-dashed border-[#D4AF37]/30 hover:border-[#D4AF37]/50"
                    )}>
                      <Instagram className={cn("w-5 h-5", instagramUrl ? "text-[#D4AF37]" : "text-[#D4AF37]/40")} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Instagram URL</label>
                      <Input
                        value={instagramUrl}
                        onChange={(e) => onUpdate("instagramUrl", e.target.value)}
                        placeholder="https://instagram.com/username"
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(
                      "w-12 h-12 border flex items-center justify-center transition-all",
                      facebookUrl ? "border-[#D4AF37]/50 hover:border-[#D4AF37]" : "border-dashed border-[#D4AF37]/30 hover:border-[#D4AF37]/50"
                    )}>
                      <Facebook className={cn("w-5 h-5", facebookUrl ? "text-[#D4AF37]" : "text-[#D4AF37]/40")} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Facebook URL</label>
                      <Input
                        value={facebookUrl}
                        onChange={(e) => onUpdate("facebookUrl", e.target.value)}
                        placeholder="https://facebook.com/page"
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(
                      "w-12 h-12 border flex items-center justify-center transition-all",
                      tiktokUrl ? "border-[#D4AF37]/50 hover:border-[#D4AF37]" : "border-dashed border-[#D4AF37]/30 hover:border-[#D4AF37]/50"
                    )}>
                      <svg className={cn("w-5 h-5", tiktokUrl ? "text-[#D4AF37]" : "text-[#D4AF37]/40")} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                      </svg>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <label className="text-sm font-medium">TikTok URL</label>
                      <Input
                        value={tiktokUrl}
                        onChange={(e) => onUpdate("tiktokUrl", e.target.value)}
                        placeholder="https://tiktok.com/@username"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#D4AF37]/20 px-4 py-6">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-xs tracking-[0.2em] uppercase text-[#F5F1E6]/30">
              © Local City Places · Visual Editor
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
