"use client";

/**
 * Art Deco Visual Editor
 *
 * A WYSIWYG editing experience for merchant pages.
 * Click on any element to edit it directly.
 */

import { Poiret_One, Raleway } from "next/font/google";
import { MapPin, Phone, Globe, Gem, Navigation, Clock, Instagram, Facebook, Image as ImageIcon, Sparkles, Plus } from "lucide-react";
import { formatPhoneNumber, formatHoursDisplay } from "@/lib/utils";
import { extractVimeoId, getVimeoEmbedUrl } from "@/lib/vimeo";
import { GoogleMapEmbed, getGoogleMapsDirectionsUrl, formatFullAddress } from "@/components/merchant-page/google-map-embed";
import { EditableText } from "@/components/ui/editable-text";
import { EditableImage } from "@/components/ui/editable-image";
import { cn } from "@/lib/utils";

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

interface ArtDecoVisualEditorProps {
  data: FormData;
  onUpdate: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  onPhotoUpload: (file: File) => Promise<string>;
  onLogoUpload: (file: File) => Promise<string>;
  showEditHints?: boolean;
}

export function ArtDecoVisualEditor({
  data,
  onUpdate,
  onPhotoUpload,
  onLogoUpload,
  showEditHints = true,
}: ArtDecoVisualEditorProps) {
  const {
    businessName,
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
    <div className="min-h-screen bg-[#0D1F22] text-[#F5F1E6]">
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

      {/* Contact Strip */}
      <div className="bg-gradient-to-r from-[#D4AF37] via-[#E5C97B] to-[#D4AF37] text-[#0D1F22]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-70">Telephone</p>
                  <p className={`font-semibold ${raleway.className}`}>{formatPhoneNumber(phone)}</p>
                </div>
              </div>
            )}
            {website && (
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-70">Website</p>
                  <p className={`font-semibold ${raleway.className}`}>
                    {website.replace(/^https?:\/\//, "")}
                  </p>
                </div>
              </div>
            )}
            {(fullAddress || location) && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-70">Location</p>
                  <p className={`font-semibold ${raleway.className}`}>
                    {[streetAddress, city, state, zipCode].filter(Boolean).join(", ") || location}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left - Business Info */}
            <div className="text-center lg:text-left">
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

              {/* Category */}
              {categoryName && (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-3 text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]">
                    <span className="w-8 h-px bg-[#D4AF37]/50" />
                    {categoryName}
                    <span className="w-8 h-px bg-[#D4AF37]/50" />
                  </span>
                </div>
              )}

              {/* Editable Business Name */}
              <div className="relative mb-8">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                  <div className="w-2 h-2 bg-[#D4AF37] rotate-45" />
                  <div className="w-16 h-px bg-gradient-to-r from-[#D4AF37] to-transparent" />
                </div>

                <div className={editableClass}>
                  <EditableText
                    value={businessName}
                    onChange={(val) => onUpdate("businessName", val)}
                    placeholder="Business Name"
                    as="h1"
                    className={`text-4xl sm:text-5xl lg:text-6xl font-light leading-tight bg-gradient-to-r from-[#F5F1E6] via-[#D4AF37] to-[#F5F1E6] bg-clip-text text-transparent ${poiretOne.className}`}
                    inputClassName="!text-[#F5F1E6] !bg-[#0D1F22]/80"
                  />
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-3 mt-4">
                  <div className="w-24 h-px bg-gradient-to-r from-[#D4AF37] to-transparent" />
                  <div className="w-2 h-2 bg-[#D4AF37] rotate-45" />
                  <div className="w-12 h-px bg-gradient-to-l from-[#D4AF37] to-transparent" />
                </div>
              </div>

              {/* Editable Description */}
              <div className={cn("mb-10 max-w-lg mx-auto lg:mx-0", editableClass)}>
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

              {/* CTAs - not editable, just display */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
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

            {/* Right - Video */}
            {videoId && (
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-4 border border-[#D4AF37]/30" />
                  <div className="absolute -inset-6 border border-[#D4AF37]/20" />
                  <div className="absolute -top-8 -left-8 w-4 h-4 bg-[#D4AF37] rotate-45" />
                  <div className="absolute -top-8 -right-8 w-4 h-4 bg-[#D4AF37] rotate-45" />
                  <div className="absolute -bottom-8 -left-8 w-4 h-4 bg-[#D4AF37] rotate-45" />
                  <div className="absolute -bottom-8 -right-8 w-4 h-4 bg-[#D4AF37] rotate-45" />

                  <div
                    className="relative w-[260px] sm:w-[300px] border-2 border-[#D4AF37] bg-black overflow-hidden"
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
              </div>
            )}
          </div>
        </div>

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

        {/* Editable Hours */}
        <div id="hours" className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            <Clock className="w-6 h-6 text-[#D4AF37]" />
            <h2 className={`text-2xl ${poiretOne.className}`}>Hours of Operation</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 border border-[#D4AF37]/20 p-8">
            {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((day) => (
              <div key={day} className={cn("flex justify-between items-center py-2 border-b border-[#D4AF37]/10 last:border-0", editableClass)}>
                <span className={`text-[#D4AF37] capitalize ${raleway.className}`}>{day}</span>
                <EditableText
                  value={hours[day] || ""}
                  onChange={(val) => updateHour(day, val)}
                  placeholder="Click to set hours"
                  className={`text-[#F5F1E6]/70 text-right ${raleway.className}`}
                  inputClassName="!text-[#F5F1E6]/70 !bg-[#0D1F22]/80 text-right"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
          <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
          <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
        </div>

        {/* Editable Services */}
        <div id="services" className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            <Sparkles className="w-6 h-6 text-[#D4AF37]" />
            <h2 className={`text-2xl ${poiretOne.className}`}>Our Services</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service, idx) => (
              <div key={idx} className={cn("border border-[#D4AF37]/20 p-6 hover:border-[#D4AF37]/40 transition-colors relative group", editableClass)}>
                <button
                  onClick={() => removeService(idx)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs"
                >
                  ×
                </button>
                <div className="flex justify-between items-start mb-2">
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
                <EditableText
                  value={service.description || ""}
                  onChange={(val) => updateService(idx, "description", val)}
                  placeholder="Service description"
                  as="p"
                  className={`text-sm text-[#F5F1E6]/60 ${raleway.className}`}
                  inputClassName="!text-[#F5F1E6]/60 !bg-[#0D1F22]/80"
                />
              </div>
            ))}
            <button
              onClick={addService}
              className="border-2 border-dashed border-[#D4AF37]/30 p-6 hover:border-[#D4AF37]/60 transition-colors flex items-center justify-center gap-2 text-[#D4AF37]/60 hover:text-[#D4AF37]"
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

        {/* Editable Photo Gallery */}
        <div id="gallery" className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            <ImageIcon className="w-6 h-6 text-[#D4AF37]" />
            <h2 className={`text-2xl ${poiretOne.className}`}>Gallery</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative aspect-square border-2 border-[#D4AF37]/30 overflow-hidden group">
                <img
                  src={photo}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                >
                  ×
                </button>
                {/* Art deco corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37]" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37]" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]" />
              </div>
            ))}
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

        {/* Social Links - Display only */}
        {(instagramUrl || facebookUrl || tiktokUrl) && (
          <div className="border-t border-[#D4AF37]/20">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="flex items-center justify-center gap-6">
                <span className={`text-sm text-[#F5F1E6]/50 ${raleway.className}`}>Follow Us</span>
                <div className="flex items-center gap-4">
                  {instagramUrl && (
                    <div className="w-12 h-12 border border-[#D4AF37]/30 flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                  )}
                  {facebookUrl && (
                    <div className="w-12 h-12 border border-[#D4AF37]/30 flex items-center justify-center">
                      <Facebook className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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
