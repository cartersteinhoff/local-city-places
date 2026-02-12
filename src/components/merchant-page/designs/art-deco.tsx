"use client";

/**
 * DESIGN 6: "Art Deco Glam"
 *
 * 1920s inspired elegance with geometric patterns.
 * Deep emerald/navy with gold accents.
 * Contact info prominent at top.
 * Vertical video in ornate frame.
 *
 * UNIFIED COMPONENT: Works in both view mode and edit mode.
 * Wrap with EditorProvider to enable editing.
 */

import { Poiret_One, Raleway } from "next/font/google";
import { MapPin, Phone, Globe, Share2, Gem, Navigation, Clock, Instagram, Facebook, Image as ImageIcon, Sparkles, Upload, Plus, Trash2, GripVertical, Pencil, X, ChevronLeft, ChevronRight, Star, Quote, ThumbsUp, Heart } from "lucide-react";
import { formatPhoneNumber, formatHoursDisplay, cn } from "@/lib/utils";
import { useEditor, useEditable } from "../editor-context";
import { EditableText, EditableImage, EditableLink, PreventLink } from "../editable-primitives";
import { SortableGrid } from "@/components/ui/sortable-grid";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
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
import { extractVimeoId, getVimeoEmbedUrl } from "@/lib/vimeo";
import { useState, useRef, useEffect } from "react";
import { GoogleMapEmbed, getGoogleMapsDirectionsUrl, formatFullAddress } from "../google-map-embed";
import { useUser } from "@/hooks/use-user";

// =============================================================================
// EDITABLE CONTACT FIELD
// Handles contact info (phone, website, address) with popover editing
// =============================================================================

interface EditableContactFieldProps {
  field: string;
  value: string | null | undefined;
  secondaryFields?: { city?: string | null; state?: string | null; zipCode?: string | null; googlePlaceId?: string | null };
  icon: React.ReactNode;
  label: string;
  displayValue?: string;
  placeholder: string;
  href?: string;
  target?: string;
}

function EditableContactField({
  field,
  value,
  secondaryFields,
  icon,
  label,
  displayValue,
  placeholder,
  href,
  target,
}: EditableContactFieldProps) {
  const { editable, onUpdate, showEditHints } = useEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value || "");
  const [localCity, setLocalCity] = useState(secondaryFields?.city || "");
  const [localState, setLocalState] = useState(secondaryFields?.state || "");
  const [localZip, setLocalZip] = useState(secondaryFields?.zipCode || "");

  // Google Places state
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<Array<{ place_id: string; description: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const dummyDiv = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when props change
  useEffect(() => {
    setLocalValue(value || "");
    if (secondaryFields !== undefined) {
      setLocalCity(secondaryFields?.city || "");
      setLocalState(secondaryFields?.state || "");
      setLocalZip(secondaryFields?.zipCode || "");
    }
  }, [value, secondaryFields]);

  // Check if this is a location field
  const isLocationField = secondaryFields !== undefined;

  // Initialize Google Places when popover opens for location field
  useEffect(() => {
    if (!isLocationField || !isOpen) return;
    if (isScriptLoaded) return; // Already initialized

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error("NEXT_PUBLIC_GOOGLE_PLACES_API_KEY not set");
      return;
    }

    if (!dummyDiv.current) {
      dummyDiv.current = document.createElement("div");
      dummyDiv.current.style.display = "none";
      document.body.appendChild(dummyDiv.current);
    }

    const initServices = () => {
      if (!window.google?.maps?.places) return;

      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      if (dummyDiv.current) {
        placesService.current = new window.google.maps.places.PlacesService(dummyDiv.current);
      }
      setIsScriptLoaded(true);
    };

    // Check if already loaded
    if (window.google?.maps?.places) {
      initServices();
      return;
    }

    // Check if script tag exists (loading in progress)
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          initServices();
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    // Load the script ourselves
    const callbackName = `initGooglePlaces_${Date.now()}`;
    (window as any)[callbackName] = () => {
      initServices();
      delete (window as any)[callbackName];
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [isLocationField, isOpen, isScriptLoaded]);

  // Search for places with debounce
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    if (!autocompleteService.current) {
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      autocompleteService.current.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "us" },
        },
        (results: any[] | null, status: string) => {
          setIsSearching(false);
          if (status === "OK" && results) {
            setPredictions(results.map((r: any) => ({ place_id: r.place_id, description: r.description })));
          } else {
            setPredictions([]);
          }
        }
      );
    }, 300);
  };

  // Select a place from predictions
  const handleSelectPlace = (placeId: string) => {

    if (!placesService.current) {
      console.error("PlacesService not initialized");
      // Try to initialize it now
      if (window.google?.maps?.places && dummyDiv.current) {
        placesService.current = new window.google.maps.places.PlacesService(dummyDiv.current);
      } else {
        return;
      }
    }

    placesService.current.getDetails(
      {
        placeId,
        fields: ["address_components", "formatted_address"],
      },
      (place: any, status: string) => {
        if (status === "OK" && place?.address_components) {
          let streetNumber = "";
          let route = "";
          let city = "";
          let state = "";
          let zipCode = "";

          for (const component of place.address_components) {
            if (component.types.includes("street_number")) {
              streetNumber = component.long_name;
            }
            if (component.types.includes("route")) {
              route = component.long_name;
            }
            if (component.types.includes("locality")) {
              city = component.long_name;
            }
            if (component.types.includes("administrative_area_level_1")) {
              state = component.short_name;
            }
            if (component.types.includes("postal_code")) {
              zipCode = component.long_name;
            }
          }

          const streetAddress = [streetNumber, route].filter(Boolean).join(" ");
          setLocalValue(streetAddress);
          setLocalCity(city);
          setLocalState(state);
          setLocalZip(zipCode);
          setSearchQuery("");
          setPredictions([]);

          // Save all fields immediately to prevent reset from parent re-render
          onUpdate(field, streetAddress || null);
          onUpdate("city", city || null);
          onUpdate("state", state || null);
          onUpdate("zipCode", zipCode || null);
          onUpdate("googlePlaceId", placeId);
        }
      }
    );
  };

  const handleSave = () => {
    onUpdate(field, localValue || null);
    if (secondaryFields !== undefined) {
      onUpdate("city", localCity || null);
      onUpdate("state", localState || null);
      onUpdate("zipCode", localZip || null);
    }
    setIsOpen(false);
  };

  // Don't show if no value and not editable
  if (!displayValue && !value && !editable) {
    return null;
  }

  // View mode - normal link
  if (!editable) {
    if (!displayValue && !value) return null;
    return (
      <a
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
      >
        {icon}
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider opacity-70">{label}</p>
          <p className={`font-semibold truncate ${raleway.className}`}>
            {displayValue || value}
          </p>
        </div>
      </a>
    );
  }

  // Edit mode with popover
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-3 cursor-pointer transition-all group",
            showEditHints && "hover:bg-[#0D1F22]/20 rounded-lg px-3 py-2 -mx-3 -my-2"
          )}
        >
          {icon}
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-70">{label}</p>
            <p className={`font-semibold ${raleway.className} flex items-center gap-2`}>
              {displayValue || value || <span className="opacity-50">{placeholder}</span>}
              {showEditHints && <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-70" />}
            </p>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-[#1a2f33] border-[#D4AF37]/30 text-[#F5F1E6]">
        <div className="space-y-4">
          <div className="font-medium text-[#D4AF37]">{label}</div>

          {secondaryFields !== undefined ? (
            // Address fields with Google Places search
            <div className="space-y-3">
              {/* Google Places Search */}
              <div className="relative">
                <label className="text-xs text-[#D4AF37]/70 block mb-1">
                  Search Address {!isScriptLoaded && <span className="text-[#D4AF37]/50">(loading...)</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={isScriptLoaded ? "Type to search..." : "Loading Google Places..."}
                    disabled={!isScriptLoaded}
                    className="w-full bg-[#0D1F22] border border-[#D4AF37]/30 rounded px-3 py-2 text-sm focus:border-[#D4AF37] outline-none disabled:opacity-50"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {predictions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#0D1F22] border border-[#D4AF37]/30 rounded max-h-40 overflow-auto shadow-lg">
                    {predictions.map((pred) => (
                      <button
                        key={pred.place_id}
                        onClick={() => handleSelectPlace(pred.place_id)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#D4AF37]/20 border-b border-[#D4AF37]/10 last:border-0"
                      >
                        {pred.description}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-[#D4AF37]/20 pt-3">
                <label className="text-xs text-[#D4AF37]/70 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  placeholder="123 Main St"
                  className="w-full bg-[#0D1F22] border border-[#D4AF37]/30 rounded px-3 py-2 text-sm focus:border-[#D4AF37] outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-xs text-[#D4AF37]/70 block mb-1">City</label>
                  <input
                    type="text"
                    value={localCity}
                    onChange={(e) => setLocalCity(e.target.value)}
                    placeholder="Denver"
                    className="w-full bg-[#0D1F22] border border-[#D4AF37]/30 rounded px-3 py-2 text-sm focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#D4AF37]/70 block mb-1">State</label>
                  <input
                    type="text"
                    value={localState}
                    onChange={(e) => setLocalState(e.target.value.toUpperCase())}
                    placeholder="CO"
                    maxLength={2}
                    className="w-full bg-[#0D1F22] border border-[#D4AF37]/30 rounded px-3 py-2 text-sm focus:border-[#D4AF37] outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#D4AF37]/70 block mb-1">ZIP</label>
                  <input
                    type="text"
                    value={localZip}
                    onChange={(e) => setLocalZip(e.target.value)}
                    placeholder="80202"
                    className="w-full bg-[#0D1F22] border border-[#D4AF37]/30 rounded px-3 py-2 text-sm focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            // Single field (phone, website)
            <div>
              <label className="text-xs text-[#D4AF37]/70 block mb-1">{label}</label>
              <input
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-[#0D1F22] border border-[#D4AF37]/30 rounded px-3 py-2 text-sm focus:border-[#D4AF37] outline-none"
                autoFocus
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-[#D4AF37] text-[#0D1F22] py-1.5 rounded text-sm font-medium hover:bg-[#E5C97B]"
            >
              Save
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 border border-[#D4AF37]/50 text-[#D4AF37] py-1.5 rounded text-sm hover:bg-[#D4AF37]/10"
            >
              Cancel
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// EDITABLE VIDEO EMBED
// Handles video display with URL editing in edit mode
// =============================================================================

function EditableVideoEmbed({ vimeoUrl }: { vimeoUrl: string | null | undefined }) {
  const { editable, onUpdate, showEditHints } = useEditor();
  const [isEditing, setIsEditing] = useState(false);
  const [localUrl, setLocalUrl] = useState(vimeoUrl || "");
  const videoId = vimeoUrl ? extractVimeoId(vimeoUrl) : null;

  const handleSave = () => {
    onUpdate("vimeoUrl", localUrl || null);
    setIsEditing(false);
  };

  // No video and not editable - show nothing
  if (!videoId && !editable) {
    return null;
  }

  // Editable mode with no video - show add placeholder
  if (!videoId && editable) {
    return (
      <div className="flex justify-center">
        <div className="relative">
          {/* Outer decorative frame */}
          <div className="absolute -inset-4 border border-[#D4AF37]/30" />
          <div className="absolute -inset-6 border border-[#D4AF37]/20" />

          {/* Corner ornaments */}
          <div className="absolute -top-8 -left-8 w-12 h-12 flex items-center justify-center">
            <div className="w-4 h-4 bg-[#D4AF37] rotate-45" />
          </div>
          <div className="absolute -top-8 -right-8 w-12 h-12 flex items-center justify-center">
            <div className="w-4 h-4 bg-[#D4AF37] rotate-45" />
          </div>
          <div className="absolute -bottom-8 -left-8 w-12 h-12 flex items-center justify-center">
            <div className="w-4 h-4 bg-[#D4AF37] rotate-45" />
          </div>
          <div className="absolute -bottom-8 -right-8 w-12 h-12 flex items-center justify-center">
            <div className="w-4 h-4 bg-[#D4AF37] rotate-45" />
          </div>

          {/* Placeholder container */}
          <div
            className="relative w-[260px] sm:w-[300px] border-2 border-dashed border-[#D4AF37]/30 bg-[#0D1F22] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#D4AF37]/60 transition-colors"
            style={{ aspectRatio: '9/16' }}
            onClick={() => setIsEditing(true)}
          >
            {isEditing ? (
              <div className="p-4 w-full space-y-3">
                <input
                  type="text"
                  value={localUrl}
                  onChange={(e) => setLocalUrl(e.target.value)}
                  placeholder="https://vimeo.com/..."
                  className="w-full bg-transparent border-b border-[#D4AF37]/50 focus:border-[#D4AF37] outline-none text-sm text-[#F5F1E6] px-2 py-1"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSave(); }}
                    className="flex-1 text-xs bg-[#D4AF37] text-[#0D1F22] py-1 px-2 hover:bg-[#E5C97B]"
                  >
                    Save
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsEditing(false); setLocalUrl(vimeoUrl || ""); }}
                    className="flex-1 text-xs border border-[#D4AF37]/50 text-[#D4AF37] py-1 px-2 hover:bg-[#D4AF37]/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-[#D4AF37]/60" />
                <span className="text-sm text-[#D4AF37]/60">Add Video URL</span>
                <span className="text-xs text-[#D4AF37]/40">Vimeo</span>
              </>
            )}
          </div>

          {/* Label */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]/70">Merchant Tracks</p>
          </div>
        </div>
      </div>
    );
  }

  // Has video
  return (
    <div className="flex justify-center">
      <div className="relative group">
        {/* Outer decorative frame */}
        <div className="absolute -inset-4 border border-[#D4AF37]/30" />
        <div className="absolute -inset-6 border border-[#D4AF37]/20" />

        {/* Corner ornaments */}
        <div className="absolute -top-8 -left-8 w-12 h-12 flex items-center justify-center">
          <div className="w-4 h-4 bg-[#D4AF37] rotate-45" />
        </div>
        <div className="absolute -top-8 -right-8 w-12 h-12 flex items-center justify-center">
          <div className="w-4 h-4 bg-[#D4AF37] rotate-45" />
        </div>
        <div className="absolute -bottom-8 -left-8 w-12 h-12 flex items-center justify-center">
          <div className="w-4 h-4 bg-[#D4AF37] rotate-45" />
        </div>
        <div className="absolute -bottom-8 -right-8 w-12 h-12 flex items-center justify-center">
          <div className="w-4 h-4 bg-[#D4AF37] rotate-45" />
        </div>

        {/* Video container */}
        <div
          className="relative w-[260px] sm:w-[300px] border-2 border-[#D4AF37] bg-black overflow-hidden"
          style={{ aspectRatio: '9/16' }}
        >
          <iframe
            src={`${getVimeoEmbedUrl(videoId!)}?background=0&autoplay=0&title=0&byline=0&portrait=0`}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Featured video"
          />

          {/* Edit overlay */}
          {editable && showEditHints && (
            <div
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              {isEditing ? (
                <div className="p-4 w-full space-y-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={localUrl}
                    onChange={(e) => setLocalUrl(e.target.value)}
                    placeholder="https://vimeo.com/..."
                    className="w-full bg-transparent border-b border-white/50 focus:border-white outline-none text-sm text-white px-2 py-1"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 text-xs bg-white text-black py-1 px-2 hover:bg-gray-200"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setIsEditing(false); setLocalUrl(vimeoUrl || ""); }}
                      className="flex-1 text-xs border border-white/50 text-white py-1 px-2 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <span className="text-white text-sm">Click to edit video URL</span>
              )}
            </div>
          )}
        </div>

        {/* Label */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]/70">Merchant Tracks</p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EDITABLE HOURS
// Handles business hours display with time picker popovers
// =============================================================================

interface Hours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

const DAYS: (keyof Hours)[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<keyof Hours, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

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
  // Try to parse display format "9:00 AM - 5:00 PM"
  const displayMatch = value.match(/^(.+?)\s*[-–]\s*(.+)$/);
  if (displayMatch) {
    return { isOpen: true, open: displayMatch[1].trim(), close: displayMatch[2].trim() };
  }
  return { isOpen: true, open: "9:00 AM", close: "5:00 PM" };
}

function formatHoursForStorage(isOpen: boolean, open: string, close: string): string {
  if (!isOpen) return "Closed";
  return `${open} - ${close}`;
}

function HoursEditorRow({
  day,
  label,
  value,
  onChange,
}: {
  day: keyof Hours;
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const { editable, showEditHints } = useEditor();
  const [isOpen, setIsOpen] = useState(false);
  const parsed = parseHoursValue(value);
  const [isOpenToday, setIsOpenToday] = useState(parsed.isOpen);
  const [openTime, setOpenTime] = useState(parsed.open);
  const [closeTime, setCloseTime] = useState(parsed.close);

  const handleSave = () => {
    onChange(formatHoursForStorage(isOpenToday, openTime, closeTime));
    setIsOpen(false);
  };

  // View mode
  if (!editable) {
    return (
      <div className="flex justify-between items-center py-2 border-b border-[#D4AF37]/10 last:border-0">
        <span className={`text-[#D4AF37] ${raleway.className}`}>{label}</span>
        <span className={`text-[#F5F1E6]/70 ${raleway.className}`}>{formatHoursDisplay(value)}</span>
      </div>
    );
  }

  // Edit mode with popover
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex justify-between items-center py-2 border-b border-[#D4AF37]/10 last:border-0 cursor-pointer group",
            showEditHints && "hover:bg-[#D4AF37]/10 rounded px-2 -mx-2"
          )}
        >
          <span className={`text-[#D4AF37] ${raleway.className}`}>{label}</span>
          <span className={`text-[#F5F1E6]/70 ${raleway.className} flex items-center gap-2`}>
            {formatHoursDisplay(value)}
            {showEditHints && <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 text-[#D4AF37]" />}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-[#1a2f33] border-[#D4AF37]/30 text-[#F5F1E6]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">{label}</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isOpenToday}
                onChange={(e) => setIsOpenToday(e.target.checked)}
                className="w-4 h-4 accent-[#D4AF37]"
              />
              <span className="text-sm">Open</span>
            </label>
          </div>

          {isOpenToday && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#D4AF37]/70 block mb-1">Opens</label>
                <select
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full bg-[#0D1F22] border border-[#D4AF37]/30 rounded px-2 py-1.5 text-sm focus:border-[#D4AF37] outline-none"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#D4AF37]/70 block mb-1">Closes</label>
                <select
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full bg-[#0D1F22] border border-[#D4AF37]/30 rounded px-2 py-1.5 text-sm focus:border-[#D4AF37] outline-none"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-[#D4AF37] text-[#0D1F22] py-1.5 rounded text-sm font-medium hover:bg-[#E5C97B]"
            >
              Save
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 border border-[#D4AF37]/50 text-[#D4AF37] py-1.5 rounded text-sm hover:bg-[#D4AF37]/10"
            >
              Cancel
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EditableHours({ hours }: { hours: Hours }) {
  const { onUpdate } = useEditor();

  const handleUpdateDay = (day: keyof Hours, value: string) => {
    const newHours = { ...hours, [day]: value };
    onUpdate("hours", newHours);
  };

  return (
    <div className="grid sm:grid-cols-2 gap-4 border border-[#D4AF37]/20 p-8">
      {DAYS.map((day) => (
        <HoursEditorRow
          key={day}
          day={day}
          label={DAY_LABELS[day]}
          value={hours[day]}
          onChange={(val) => handleUpdateDay(day, val)}
        />
      ))}
    </div>
  );
}

// =============================================================================
// EDITABLE SERVICES LIST
// Handles services display with edit/add/remove in edit mode
// =============================================================================

interface Service {
  name: string;
  description?: string;
  price?: string;
}

function EditableServicesList({ services }: { services: Service[] }) {
  const { editable, onUpdate, showEditHints } = useEditor();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = () => {
    const newServices = [...services, { name: "New Service", description: "", price: "" }];
    onUpdate("services", newServices);
    setEditingIndex(newServices.length - 1);
  };

  const handleRemove = (index: number) => {
    const newServices = services.filter((_, i) => i !== index);
    onUpdate("services", newServices);
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleUpdateService = (index: number, field: keyof Service, value: string) => {
    const newServices = services.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    onUpdate("services", newServices);
  };

  const handleReorder = (newServices: Service[]) => {
    onUpdate("services", newServices);
  };

  const renderServiceItem = (service: Service, idx: number) => (
    <div className={cn(
      "border border-[#D4AF37]/20 p-6 hover:border-[#D4AF37]/40 transition-colors relative group h-full bg-[#0D1F22]",
      editable && editingIndex !== idx && "cursor-grab"
    )}>
      {editable && editingIndex === idx ? (
        // Edit mode for this service
        <div className="space-y-3">
          <input
            type="text"
            value={service.name}
            onChange={(e) => handleUpdateService(idx, "name", e.target.value)}
            placeholder="Service name"
            className="w-full bg-transparent border-b border-[#D4AF37]/50 focus:border-[#D4AF37] outline-none text-lg text-[#D4AF37] font-medium"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          <input
            type="text"
            value={service.price || ""}
            onChange={(e) => handleUpdateService(idx, "price", e.target.value)}
            placeholder="Price (optional)"
            className="w-full bg-transparent border-b border-[#D4AF37]/50 focus:border-[#D4AF37] outline-none text-[#E5C97B]"
            onClick={(e) => e.stopPropagation()}
          />
          <textarea
            value={service.description || ""}
            onChange={(e) => handleUpdateService(idx, "description", e.target.value)}
            placeholder="Description (optional)"
            className="w-full bg-transparent border-b border-[#D4AF37]/50 focus:border-[#D4AF37] outline-none text-sm text-[#F5F1E6]/60 resize-none"
            rows={2}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setEditingIndex(null); }}
            className="text-xs text-[#D4AF37] hover:underline"
          >
            Done
          </button>
        </div>
      ) : (
        // Display mode
        <>
          {/* Drag handle indicator */}
          {editable && showEditHints && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
              <div className="bg-[#D4AF37]/80 rounded-full p-2">
                <GripVertical className="w-5 h-5 text-[#0D1F22]" />
              </div>
            </div>
          )}

          <div
            className="flex justify-between items-start mb-2 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); editable && setEditingIndex(idx); }}
          >
            <h3 className={`text-lg text-[#D4AF37] ${poiretOne.className}`}>{service.name}</h3>
            {service.price && (
              <span className={`text-[#E5C97B] ${raleway.className}`}>{service.price}</span>
            )}
          </div>
          {service.description && (
            <p
              className={`text-sm text-[#F5F1E6]/60 ${raleway.className} cursor-pointer`}
              onClick={(e) => { e.stopPropagation(); editable && setEditingIndex(idx); }}
            >
              {service.description}
            </p>
          )}

          {/* Edit mode: delete button */}
          {editable && showEditHints && (
            <button
              onClick={(e) => { e.stopPropagation(); handleRemove(idx); }}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <Trash2 className="w-3 h-3 text-white" />
            </button>
          )}
        </>
      )}
    </div>
  );

  // View mode - no drag and drop
  if (!editable) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service, idx) => (
          <div key={idx}>{renderServiceItem(service, idx)}</div>
        ))}
      </div>
    );
  }

  // Edit mode - with drag and drop
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <SortableGrid
        items={services}
        getItemId={(_, index) => `service-${index}`}
        onReorder={handleReorder}
        renderItem={renderServiceItem}
        className="contents"
      />

      {/* Add service placeholder */}
      <div
        className="border border-dashed border-[#D4AF37]/30 p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5 transition-colors"
        onClick={handleAdd}
      >
        <Plus className="w-6 h-6 text-[#D4AF37]/60" />
        <span className="text-sm text-[#D4AF37]/60">Add Service</span>
      </div>
    </div>
  );
}

// =============================================================================
// EDITABLE PHOTO GALLERY
// Handles photo display with edit/add/remove in edit mode
// =============================================================================

function EditablePhotoGallery({ photos, businessName }: { photos: string[]; businessName: string }) {
  const { editable, onUpdate, onPhotoUpload, showEditHints } = useEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1));
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, photos.length]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onPhotoUpload) return;

    setIsUploading(true);
    try {
      const url = await onPhotoUpload(file);
      onUpdate("photos", [...photos, url]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPhotos = photos.filter((_, i) => i !== index);
    onUpdate("photos", newPhotos);
  };

  const handleReorder = (newPhotos: string[]) => {
    onUpdate("photos", newPhotos);
  };

  const handlePhotoClick = (idx: number) => {
    if (!editable) {
      setLightboxIndex(idx);
    }
  };

  const renderPhotoItem = (photo: string, idx: number) => (
    <div
      className={cn(
        "relative aspect-square border-2 border-[#D4AF37]/30 overflow-hidden group",
        editable ? "cursor-grab" : "cursor-pointer"
      )}
      onClick={() => handlePhotoClick(idx)}
    >
      <img
        src={photo}
        alt={`${businessName} photo ${idx + 1}`}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      {/* Art deco corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37]" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37]" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]" />

      {/* Edit mode: drag indicator */}
      {editable && showEditHints && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 pointer-events-none">
          <div className="bg-black/60 rounded-full p-2">
            <GripVertical className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      {/* Edit mode: delete button */}
      {editable && showEditHints && (
        <button
          onClick={(e) => handleRemove(idx, e)}
          className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <Trash2 className="w-4 h-4 text-white" />
        </button>
      )}
    </div>
  );

  // Lightbox modal
  const lightbox = lightboxIndex !== null && (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={() => setLightboxIndex(null)}
    >
      {/* Close button */}
      <button
        onClick={() => setLightboxIndex(null)}
        className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white transition-colors z-10"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Previous button */}
      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1));
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-all z-10"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Next button */}
      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLightboxIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0));
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-all z-10"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Image */}
      <img
        src={photos[lightboxIndex]}
        alt={`${businessName} photo ${lightboxIndex + 1}`}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Image counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
        {lightboxIndex + 1} / {photos.length}
      </div>
    </div>
  );

  // View mode - no drag and drop
  if (!editable) {
    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, idx) => (
            <div key={idx}>{renderPhotoItem(photo, idx)}</div>
          ))}
        </div>
        {lightbox}
      </>
    );
  }

  // Edit mode - with drag and drop
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <SortableGrid
        items={photos}
        getItemId={(photo, index) => `photo-${index}-${photo.slice(-20)}`}
        onReorder={handleReorder}
        renderItem={renderPhotoItem}
        className="contents"
      />

      {/* Add photo placeholder */}
      <div
        className="relative aspect-square border-2 border-dashed border-[#D4AF37]/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <span className="text-sm text-[#D4AF37]/60">Uploading...</span>
        ) : (
          <>
            <Plus className="w-8 h-8 text-[#D4AF37]/60" />
            <span className="text-sm text-[#D4AF37]/60">Add Photo</span>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

// =============================================================================
// EDITABLE SOCIAL LINKS
// Handles social media links with inline URL editing
// =============================================================================

function EditableSocialLinks({
  instagramUrl,
  facebookUrl,
  tiktokUrl,
}: {
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
}) {
  const { editable, onUpdate, showEditHints } = useEditor();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState("");

  const startEditing = (field: string, currentValue: string | null | undefined) => {
    setEditingField(field);
    setLocalValue(currentValue || "");
  };

  const handleSave = (field: string) => {
    onUpdate(field, localValue || null);
    setEditingField(null);
  };

  const socialLinks = [
    { field: "instagramUrl", url: instagramUrl, icon: Instagram, label: "Instagram" },
    { field: "facebookUrl", url: facebookUrl, icon: Facebook, label: "Facebook" },
    {
      field: "tiktokUrl",
      url: tiktokUrl,
      label: "TikTok",
      customIcon: (
        <svg className="w-5 h-5 text-[#D4AF37]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
        </svg>
      ),
    },
  ];

  const hasAnySocial = instagramUrl || facebookUrl || tiktokUrl;

  if (!hasAnySocial && !editable) {
    return null;
  }

  return (
    <div className="border-t border-[#D4AF37]/20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-6">
          <span className={`text-sm text-[#F5F1E6]/50 ${raleway.className}`}>Follow Us</span>
          <div className="flex items-center gap-4">
            {socialLinks.map(({ field, url, icon: Icon, customIcon, label }) => {
              const isEditing = editingField === field;
              const hasValue = !!url;

              // In view mode, only show links that have values
              if (!editable && !hasValue) return null;

              return (
                <div key={field} className="relative">
                  {isEditing ? (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0D1F22] border border-[#D4AF37]/30 p-3 rounded shadow-lg z-10 w-64">
                      <input
                        type="text"
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        placeholder={`${label} URL...`}
                        className="w-full bg-transparent border-b border-[#D4AF37]/50 focus:border-[#D4AF37] outline-none text-sm text-[#F5F1E6] px-1 py-1"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSave(field)}
                          className="flex-1 text-xs bg-[#D4AF37] text-[#0D1F22] py-1 px-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingField(null)}
                          className="flex-1 text-xs border border-[#D4AF37]/50 text-[#D4AF37] py-1 px-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {hasValue ? (
                    <a
                      href={editable ? undefined : url!}
                      target={editable ? undefined : "_blank"}
                      rel={editable ? undefined : "noopener noreferrer"}
                      onClick={editable ? (e) => { e.preventDefault(); startEditing(field, url); } : undefined}
                      className={cn(
                        "w-12 h-12 border border-[#D4AF37]/30 flex items-center justify-center hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all",
                        editable && "cursor-pointer"
                      )}
                    >
                      {customIcon || (Icon && <Icon className="w-5 h-5 text-[#D4AF37]" />)}
                    </a>
                  ) : editable ? (
                    <button
                      onClick={() => startEditing(field, url)}
                      className="w-12 h-12 border border-dashed border-[#D4AF37]/30 flex items-center justify-center hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5 transition-all"
                    >
                      {customIcon || (Icon && <Icon className="w-5 h-5 text-[#D4AF37]/40" />)}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Seeded random so counts are stable across renders
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function formatReviewDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface MerchantPageProps {
  merchantId?: string;
  businessName: string;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  logoUrl?: string | null;
  categoryName?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  vimeoUrl?: string | null;
  googlePlaceId?: string | null;
  // Extended business info
  hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  } | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  photos?: string[] | null;
  services?: { name: string; description?: string; price?: string }[] | null;
  aboutStory?: string | null;
  reviews?: {
    id: string;
    content: string;
    rating: number | null;
    reviewerFirstName: string | null;
    reviewerLastName: string | null;
    reviewerPhotoUrl: string | null;
    createdAt: Date;
    photos: string[];
  }[];
}

export function ArtDecoDesign({
  merchantId,
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
  reviews: merchantReviews,
}: MerchantPageProps) {
  const [copied, setCopied] = useState(false);
  const [allReviews, setAllReviews] = useState(merchantReviews || []);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [lightboxPhoto, setLightboxPhoto] = useState<{ photos: string[]; index: number } | null>(null);

  useEffect(() => {
    if (!lightboxPhoto) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxPhoto(null);
      if (e.key === "ArrowLeft") setLightboxPhoto(prev => prev ? { ...prev, index: (prev.index - 1 + prev.photos.length) % prev.photos.length } : null);
      if (e.key === "ArrowRight") setLightboxPhoto(prev => prev ? { ...prev, index: (prev.index + 1) % prev.photos.length } : null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxPhoto]);
  const { isAuthenticated, member, user } = useUser();
  const { editable, onUpdate, showEditHints } = useEditor();
  const location = [city, state].filter(Boolean).join(", ");
  const fullAddress = formatFullAddress(streetAddress, city, state, zipCode);
  const videoId = vimeoUrl ? extractVimeoId(vimeoUrl) : null;
  const directionsUrl = getGoogleMapsDirectionsUrl(businessName, streetAddress, city, state, zipCode, googlePlaceId);

  const initials = businessName
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: businessName, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewContent.trim() || reviewRating === 0) {
      setReviewError("Please write a review and select a rating.");
      return;
    }
    setIsSubmitting(true);
    setReviewError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId, content: reviewContent, rating: reviewRating }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || "Failed to submit review.");
        return;
      }
      setAllReviews((prev) => [data.review, ...prev]);
      setReviewContent("");
      setReviewRating(0);
      setShowReviewForm(false);
    } catch {
      setReviewError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1F22] text-[#F5F1E6] overflow-x-hidden">
      {/* Art deco pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Gold lines */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

      {/* Header */}
      <header className="relative border-b border-[#D4AF37]/30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border-2 border-[#D4AF37] flex items-center justify-center rotate-45">
              <Gem className="w-3.5 h-3.5 text-[#D4AF37] -rotate-45" />
            </div>
            <span className="text-sm sm:text-base font-medium tracking-[0.15em] sm:tracking-[0.3em] uppercase text-[#D4AF37]/70 ml-1 sm:ml-2">Local City Places</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#D4AF37]/70 hover:text-[#D4AF37] transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </header>

      {/* Section Navigation */}
      <nav className="bg-[#0D1F22]/95 border-b border-[#D4AF37]/20 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-1 sm:gap-2 py-2 overflow-x-auto scrollbar-hide">
            {allReviews.length > 0 && (
              <a href="#reviews" className={`px-3 py-2 text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all whitespace-nowrap cursor-pointer ${raleway.className}`}>
                Reviews
              </a>
            )}
            {(googlePlaceId || city) && (
              <a href="#location" className={`px-3 py-2 text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all whitespace-nowrap cursor-pointer ${raleway.className}`}>
                Location
              </a>
            )}
            {aboutStory && (
              <a href="#story" className={`px-3 py-2 text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all whitespace-nowrap cursor-pointer ${raleway.className}`}>
                Story
              </a>
            )}
            {hours && Object.values(hours).some(Boolean) && (
              <a href="#hours" className={`px-3 py-2 text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all whitespace-nowrap cursor-pointer ${raleway.className}`}>
                Hours
              </a>
            )}
            {services && services.length > 0 && (
              <a href="#services" className={`px-3 py-2 text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all whitespace-nowrap cursor-pointer ${raleway.className}`}>
                Services
              </a>
            )}
            {photos && photos.length > 0 && (
              <a href="#gallery" className={`px-3 py-2 text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all whitespace-nowrap cursor-pointer ${raleway.className}`}>
                Gallery
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Review Photos Slider */}
      {(() => {
        const allReviewPhotos = allReviews.flatMap((r) => r.photos);
        if (allReviewPhotos.length === 0) return null;
        return (
          <div className="relative bg-black/30 overflow-hidden">
            <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory">
              {allReviewPhotos.map((photo, i) => (
                <div
                  key={i}
                  className="snap-start shrink-0 w-48 h-36 sm:w-64 sm:h-48 relative cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setLightboxPhoto({ photos: allReviewPhotos, index: i })}
                >
                  <img
                    src={photo}
                    alt=""
                    className="w-full h-full object-cover"
                    loading={i < 6 ? "eager" : "lazy"}
                  />
                </div>
              ))}
            </div>
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0D1F22] to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0D1F22] to-transparent pointer-events-none" />
          </div>
        );
      })()}

      {/* Contact Strip - Gold Bar */}
      <div className="bg-gradient-to-r from-[#D4AF37] via-[#E5C97B] to-[#D4AF37] text-[#0D1F22]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-10">
            <EditableContactField
              field="phone"
              value={phone}
              icon={<Phone className="w-5 h-5" />}
              label="Telephone"
              displayValue={phone ? formatPhoneNumber(phone) : undefined}
              placeholder="(555) 555-5555"
              href={phone ? `tel:${phone}` : undefined}
            />
            <EditableContactField
              field="website"
              value={website}
              icon={<Globe className="w-5 h-5" />}
              label="Website"
              displayValue={website?.replace(/^https?:\/\//, "")}
              placeholder="www.example.com"
              href={website ? (website.startsWith("http") ? website : `https://${website}`) : undefined}
              target="_blank"
            />
            <EditableContactField
              field="streetAddress"
              value={streetAddress}
              secondaryFields={{ city, state, zipCode, googlePlaceId }}
              icon={<MapPin className="w-5 h-5" />}
              label="Location"
              displayValue={fullAddress || location}
              placeholder="123 Main St"
              href={directionsUrl}
              target="_blank"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16">
          <div className="grid lg:grid-cols-[3fr_2fr] gap-12 items-center">
            {/* Left - Business Info */}
            <div className="text-center lg:text-left">
              {/* Logo with art deco frame */}
              {(logoUrl || editable) && (
                <div className="inline-block mb-8">
                  <div className="relative">
                    {/* Outer glow */}
                    <div className="absolute inset-0 bg-[#D4AF37]/20 blur-xl" />

                    {/* Diamond corner accents */}
                    <div className="absolute -top-3 -left-3 w-4 h-4 bg-[#D4AF37] rotate-45" />
                    <div className="absolute -top-3 -right-3 w-4 h-4 bg-[#D4AF37] rotate-45" />
                    <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-[#D4AF37] rotate-45" />
                    <div className="absolute -bottom-3 -right-3 w-4 h-4 bg-[#D4AF37] rotate-45" />

                    {/* Ornate frame lines */}
                    <div className="absolute -top-1 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                    <div className="absolute -bottom-1 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                    <div className="absolute -left-1 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-[#D4AF37] to-transparent" />
                    <div className="absolute -right-1 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-[#D4AF37] to-transparent" />

                    <EditableImage
                      field="logoUrl"
                      value={logoUrl}
                      alt={businessName}
                      className="relative w-32 h-32 bg-[#0D1F22] border-2 border-[#D4AF37] flex items-center justify-center overflow-hidden"
                      placeholderIcon={<Gem className="w-8 h-8 text-[#D4AF37]/60" />}
                      placeholderText="Add Logo"
                    />
                  </div>
                </div>
              )}

              {/* Category */}
              {/* Category name hidden for now */}

              {/* Business Name with Art Deco styling */}
              <div className="relative mb-8">
                {/* Decorative line above */}
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                  <div className="w-2 h-2 bg-[#D4AF37] rotate-45" />
                  <div className="w-16 h-px bg-gradient-to-r from-[#D4AF37] to-transparent" />
                </div>

                <EditableText
                  field="businessName"
                  value={businessName}
                  placeholder="Business Name"
                  as="h1"
                  className={`text-4xl sm:text-5xl lg:text-6xl font-light leading-tight bg-gradient-to-r from-[#F5F1E6] via-[#D4AF37] to-[#F5F1E6] bg-clip-text text-transparent ${poiretOne.className}`}
                  inputClassName="text-4xl sm:text-5xl lg:text-6xl bg-transparent text-[#F5F1E6]"
                />

                {/* Decorative line below */}
                <div className="flex items-center justify-center lg:justify-start gap-3 mt-4">
                  <div className="w-24 h-px bg-gradient-to-r from-[#D4AF37] to-transparent" />
                  <div className="w-2 h-2 bg-[#D4AF37] rotate-45" />
                  <div className="w-12 h-px bg-gradient-to-l from-[#D4AF37] to-transparent" />
                </div>
              </div>

              {/* Description */}
              {(description || editable) && (
                <EditableText
                  field="description"
                  value={description || ""}
                  placeholder="Add a short description of your business..."
                  as="p"
                  className={`text-lg text-[#F5F1E6]/70 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-10 ${raleway.className}`}
                  multiline
                />
              )}

              {/* CTAs */}
              <div className="grid grid-cols-2 gap-3 justify-center lg:justify-start">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#D4AF37] via-[#E5C97B] to-[#D4AF37] text-black font-bold tracking-wide cursor-pointer"
                  >
                    <Phone className="w-5 h-5" />
                    <span className={`${raleway.className} font-bold tracking-wide`}>Call Now</span>
                  </a>
                )}
                {website && (
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 px-6 py-4 border border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
                  >
                    <Globe className="w-5 h-5 text-[#D4AF37]" />
                    <span className={`${raleway.className} font-bold tracking-wide`}>Visit Website</span>
                  </a>
                )}
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 px-6 py-4 border border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
                >
                  <Navigation className="w-5 h-5 text-[#D4AF37]" />
                  <span className={`${raleway.className} font-bold tracking-wide`}>Directions</span>
                </a>
                {allReviews.length > 0 && (() => {
                  const rated = allReviews.filter((r) => r.rating != null);
                  const avg = rated.length > 0 ? Math.round(rated.reduce((sum, r) => sum + (r.rating || 0), 0) / rated.length * 10) / 10 : 0;
                  return (
                    <a
                      href="#reviews"
                      className="flex items-center justify-center gap-3 px-6 py-4 border border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
                    >
                      <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                      <span className={`${raleway.className} font-bold tracking-wide`}>{avg > 0 ? `${avg.toFixed(1)} ` : ""}Reviews ({allReviews.length})</span>
                    </a>
                  );
                })()}
              </div>
            </div>

            {/* Right - Vertical Video with Art Deco Frame */}
            {(videoId || editable) && (
              <EditableVideoEmbed vimeoUrl={vimeoUrl} />
            )}
          </div>
        </div>

        {/* Reviews Section */}
        {(allReviews.length > 0 || (isAuthenticated && member)) && (
          <>
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
              <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
              <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
            </div>

            <div id="reviews" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
              <div className="flex items-center gap-4 mb-8">
                <Star className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37]" />
                <h2 className={`text-2xl ${poiretOne.className}`}>Customer Reviews</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
                {isAuthenticated && member && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className={`px-4 py-2 border border-[#D4AF37]/50 text-[#D4AF37] text-xs tracking-[0.15em] uppercase hover:bg-[#D4AF37]/10 transition-colors ${raleway.className}`}
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {/* Write Review Form */}
              {showReviewForm && (
                <div className="border border-[#D4AF37]/30 p-6 mb-8 bg-[#D4AF37]/5">
                  <h3 className={`text-lg mb-4 ${poiretOne.className}`}>Write Your Review</h3>
                  <div className="flex items-center gap-1 mb-4">
                    <span className={`text-sm text-[#F5F1E6]/60 mr-2 ${raleway.className}`}>Rating:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setReviewRating(star)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={cn(
                            "w-6 h-6 transition-colors",
                            star <= (hoverRating || reviewRating) ? "text-[#D4AF37] fill-[#D4AF37]" : "text-[#D4AF37]/30"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Share your experience..."
                    rows={4}
                    className={`w-full bg-[#0D1F22] border border-[#D4AF37]/30 text-[#F5F1E6] p-4 text-sm focus:outline-none focus:border-[#D4AF37]/60 placeholder-[#F5F1E6]/30 resize-none ${raleway.className}`}
                  />
                  {reviewError && (
                    <p className={`text-red-400 text-sm mt-2 ${raleway.className}`}>{reviewError}</p>
                  )}
                  <div className="flex items-center justify-end gap-3 mt-4">
                    <button
                      onClick={() => { setShowReviewForm(false); setReviewError(""); }}
                      className={`px-4 py-2 text-xs tracking-[0.15em] uppercase text-[#F5F1E6]/50 hover:text-[#F5F1E6] transition-colors ${raleway.className}`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReview}
                      disabled={isSubmitting}
                      className={`px-6 py-2 bg-[#D4AF37] text-[#0D1F22] text-xs tracking-[0.15em] uppercase font-medium hover:bg-[#E5C97B] transition-colors disabled:opacity-50 ${raleway.className}`}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </div>
              )}

              {/* Overall Rating */}
              {allReviews.length > 0 && (() => {
                const rated = allReviews.filter((r) => r.rating != null);
                const avg = rated.length > 0 ? rated.reduce((sum, r) => sum + (r.rating || 0), 0) / rated.length : 0;
                const rounded = Math.round(avg * 10) / 10;
                return (
                  <div className="flex items-center gap-6 mb-8 p-6 border border-[#D4AF37]/20 bg-[#D4AF37]/5">
                    <div className="text-center">
                      <div className={`text-5xl font-light text-[#D4AF37] ${poiretOne.className}`}>{rounded.toFixed(1)}</div>
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={cn("w-4 h-4", star <= Math.round(avg) ? "text-[#D4AF37] fill-[#D4AF37]" : "text-[#D4AF37]/30")} />
                        ))}
                      </div>
                      <p className={`text-sm text-[#F5F1E6]/50 mt-1 ${raleway.className}`}>{allReviews.length} review{allReviews.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="h-16 w-px bg-[#D4AF37]/20" />
                    <div className={`flex-1 text-[#F5F1E6]/70 ${raleway.className}`}>
                      <p className="italic">&quot;{allReviews[0].content.length > 120 ? allReviews[0].content.slice(0, 120) + "..." : allReviews[0].content}&quot;</p>
                    </div>
                  </div>
                );
              })()}

              {/* Individual Reviews */}
              <div className="grid md:grid-cols-2 gap-6">
                {allReviews.map((review) => {
                  const firstName = review.reviewerFirstName || "";
                  const lastName = review.reviewerLastName || "";
                  const displayName = [firstName, lastName.charAt(0) ? `${lastName.charAt(0)}.` : ""].filter(Boolean).join(" ") || "Anonymous";
                  const reviewInitials = [firstName.charAt(0), lastName.charAt(0)].filter(Boolean).join("").toUpperCase() || "?";
                  const timeAgo = formatReviewDate(review.createdAt);

                  return (
                    <div key={review.id} className="border border-[#D4AF37]/20 p-6 hover:border-[#D4AF37]/40 transition-colors">
                      <div className="flex items-start gap-4 mb-4">
                        {review.reviewerPhotoUrl ? (
                          <img
                            src={review.reviewerPhotoUrl}
                            alt={displayName}
                            className="w-12 h-12 object-cover border border-[#D4AF37]/30"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center">
                            <span className={`text-[#D4AF37] font-medium ${raleway.className}`}>{reviewInitials}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium text-[#F5F1E6] ${raleway.className}`}>{displayName}</h4>
                            <span className={`text-base text-[#F5F1E6]/60 ${raleway.className}`}>{timeAgo}</span>
                          </div>
                          {review.rating && (
                            <div className="flex items-center gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    "w-3.5 h-3.5",
                                    star <= review.rating! ? "text-[#D4AF37] fill-[#D4AF37]" : "text-[#D4AF37]/30"
                                  )}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Quote className="w-5 h-5 text-[#D4AF37]/30 mb-2" />
                      <p className={`text-[#F5F1E6]/70 text-sm leading-relaxed ${raleway.className}`}>
                        {review.content}
                      </p>
                      {review.photos.length > 0 && (
                        <div className="flex gap-2 mt-4 overflow-x-auto">
                          {review.photos.map((photo, i) => (
                            <img
                              key={i}
                              src={photo}
                              alt={`Review photo ${i + 1}`}
                              className="w-32 h-32 object-cover border border-[#D4AF37]/20 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setLightboxPhoto({ photos: review.photos, index: i })}
                            />
                          ))}
                        </div>
                      )}
                      {/* Reactions */}
                      {(() => {
                        const seed = review.id.charCodeAt(0) * 31 + review.id.charCodeAt(1);
                        const thumbs = Math.floor(seededRandom(seed) * 4);
                        const hearts = Math.floor(seededRandom(seed + 10) * 4);
                        const claps = Math.floor(seededRandom(seed + 20) * 4);
                        const fires = Math.floor(seededRandom(seed + 30) * 4);
                        if (thumbs + hearts + claps + fires === 0) return null;
                        const reactions = [
                          { count: thumbs, icon: <ThumbsUp className="w-3.5 h-3.5" />, color: "text-[#D4AF37]" },
                          { count: hearts, icon: <Heart className="w-3.5 h-3.5" />, color: "text-red-400" },
                          { count: claps, icon: <span className="text-sm leading-none">👏</span>, color: "text-[#F5F1E6]" },
                          { count: fires, icon: <span className="text-sm leading-none">🔥</span>, color: "text-orange-400" },
                        ].filter(r => r.count > 0);
                        return (
                          <TooltipProvider>
                          <div className={`flex items-center gap-2 mt-4 pt-3 border-t border-[#D4AF37]/10 ${raleway.className}`}>
                            {reactions.map((r, i) => (
                              <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#D4AF37]/15 bg-[#D4AF37]/5 ${r.color}/80 hover:${r.color} hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all cursor-pointer text-xs`}>
                                    {r.icon}
                                    <span className="font-medium">{r.count}</span>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Log in to react</TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                          </TooltipProvider>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Map Section - only show if we have location data */}
        {(googlePlaceId || fullAddress) && (
          <>
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
              <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
              <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
            </div>
            <div id="location" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <h2 className={`text-2xl ${poiretOne.className}`}>
                    Our Location
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
                </div>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#D4AF37] hover:text-[#E5C97B] transition-colors cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  Get Directions
                </a>
              </div>
              {fullAddress && (
                <p className={`text-[#F5F1E6]/70 mb-6 ${raleway.className}`}>{fullAddress}</p>
              )}
              <div className="relative">
                {/* Art deco frame for map */}
                <div className="absolute -inset-2 border border-[#D4AF37]/30" />
                <GoogleMapEmbed
                  businessName={businessName}
                  streetAddress={streetAddress}
                  city={city}
                  state={state}
                  zipCode={zipCode}
                  googlePlaceId={googlePlaceId}
                  height="300px"
                  mapStyle="cool"
                />
              </div>
            </div>
          </>
        )}

        {/* About/Story Section */}
        {(aboutStory || editable) && (
          <>
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
              <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
              <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
            </div>
            <div id="story" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
              <div className="flex items-center gap-4 mb-8">
                <h2 className={`text-2xl ${poiretOne.className}`}>Our Story</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
              </div>
              <div className="border border-[#D4AF37]/20 p-8">
                <EditableText
                  field="aboutStory"
                  value={aboutStory || ""}
                  placeholder="Tell your story... What makes your business special?"
                  as="p"
                  className={`text-[#F5F1E6]/80 leading-relaxed whitespace-pre-line ${raleway.className}`}
                  multiline
                />
              </div>
            </div>
          </>
        )}

        {/* Hours Section */}
        {((hours && Object.values(hours).some(Boolean)) || editable) && (
          <>
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
              <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
              <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
            </div>
            <div id="hours" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
              <div className="flex items-center gap-4 mb-8">
                <Clock className="w-6 h-6 text-[#D4AF37]" />
                <h2 className={`text-2xl ${poiretOne.className}`}>Hours of Operation</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
              </div>
              <EditableHours hours={hours || {}} />
            </div>
          </>
        )}

        {/* Services Section */}
        {((services && services.length > 0) || editable) && (
          <>
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
              <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
              <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
            </div>
            <div id="services" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
              <div className="flex items-center gap-4 mb-8">
                <Sparkles className="w-6 h-6 text-[#D4AF37]" />
                <h2 className={`text-2xl ${poiretOne.className}`}>Our Services</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
              </div>
              <EditableServicesList services={services || []} />
            </div>
          </>
        )}

        {/* Photo Gallery Section */}
        {((photos && photos.length > 0) || editable) && (
          <>
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="w-32 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
              <div className="w-3 h-3 rotate-45 border border-[#D4AF37]/50" />
              <div className="w-32 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
            </div>
            <div id="gallery" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-16">
              <div className="flex items-center gap-4 mb-8">
                <ImageIcon className="w-6 h-6 text-[#D4AF37]" />
                <h2 className={`text-2xl ${poiretOne.className}`}>Gallery</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
              </div>
              <EditablePhotoGallery
                photos={photos || []}
                businessName={businessName}
              />
            </div>
          </>
        )}

{/* Reviews Section - will show when reviews data is available */}

        {/* Social Links */}
        <EditableSocialLinks
          instagramUrl={instagramUrl}
          facebookUrl={facebookUrl}
          tiktokUrl={tiktokUrl}
        />

        {/* Partner Section */}
        <div className="border-t border-[#D4AF37]/20">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center gap-4">
              <Gem className="w-6 h-6 text-[#D4AF37]" />
              <div className="text-center">
                <p className={`text-lg text-[#D4AF37] font-medium ${poiretOne.className}`}>
                  Exclusive Partner Establishment
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#D4AF37]/20 px-4 py-6">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-xs tracking-[0.2em] uppercase text-[#F5F1E6]/30">
              © Local City Places · Curated Excellence
            </p>
          </div>
        </footer>
      </div>

      {/* Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-[#0D1F22] to-transparent" />
        <div className="bg-[#0D1F22]/95 backdrop-blur-lg border-t border-[#D4AF37]/30 p-4">
          <div className="flex gap-3">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#D4AF37] to-[#E5C97B] text-[#0D1F22] font-medium"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
            )}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#D4AF37]/50"
              >
                <Globe className="w-4 h-4" />
                Website
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="h-20 lg:hidden" />


      {/* Photo Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10 cursor-pointer"
          >
            <X className="w-8 h-8" />
          </button>
          {lightboxPhoto.photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxPhoto({
                    photos: lightboxPhoto.photos,
                    index: (lightboxPhoto.index - 1 + lightboxPhoto.photos.length) % lightboxPhoto.photos.length,
                  });
                }}
                className="absolute left-4 text-white/70 hover:text-white z-10 cursor-pointer"
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxPhoto({
                    photos: lightboxPhoto.photos,
                    index: (lightboxPhoto.index + 1) % lightboxPhoto.photos.length,
                  });
                }}
                className="absolute right-4 text-white/70 hover:text-white z-10 cursor-pointer"
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </>
          )}
          <img
            src={lightboxPhoto.photos[lightboxPhoto.index]}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxPhoto.photos.length > 1 && (
            <p className="absolute bottom-4 text-white/50 text-sm">
              {lightboxPhoto.index + 1} / {lightboxPhoto.photos.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
