"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PlaceDetails {
  name: string;
  placeId: string;
  formattedAddress?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  website?: string;
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (name: string, placeId: string, details?: PlaceDetails) => void;
  placeholder?: string;
  error?: string;
  types?: string[];
  fetchDetails?: boolean;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = "Search for a store...",
  error,
  types = ["grocery_or_supermarket", "supermarket"],
  fetchDetails = false,
}: GooglePlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dummyDiv = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load Google Places script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error("Google Places API key not configured");
      return;
    }

    // Create dummy div for PlacesService (required by Google API)
    if (!dummyDiv.current) {
      dummyDiv.current = document.createElement("div");
    }

    const initServices = () => {
      setIsScriptLoaded(true);
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      if (dummyDiv.current) {
        placesService.current = new window.google.maps.places.PlacesService(dummyDiv.current);
      }
    };

    // Check if already loaded
    if (window.google?.maps?.places) {
      initServices();
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      window.initGooglePlaces = initServices;
      return;
    }

    // Load script
    window.initGooglePlaces = initServices;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup not needed as script should persist
    };
  }, []);

  // Update input when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchPlaces = useCallback(
    (query: string) => {
      if (!autocompleteService.current || !query.trim()) {
        setPredictions([]);
        return;
      }

      setIsLoading(true);

      autocompleteService.current.getPlacePredictions(
        {
          input: query,
          types: types,
          componentRestrictions: { country: "us" },
        },
        (results: PlacePrediction[] | null, status: string) => {
          setIsLoading(false);
          if (status === "OK" && results) {
            setPredictions(results);
            setIsOpen(true);
          } else {
            setPredictions([]);
          }
        }
      );
    },
    [types]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear previous selection
    if (value && newValue !== value) {
      onChange("", "");
    }

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);
  };

  const handleSelect = (prediction: PlacePrediction) => {
    setInputValue(prediction.structured_formatting.main_text);
    setIsOpen(false);
    setPredictions([]);

    if (fetchDetails && placesService.current) {
      setIsLoading(true);
      placesService.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ["name", "formatted_address", "address_components", "formatted_phone_number", "website"],
        },
        (place: any, status: string) => {
          setIsLoading(false);
          if (status === "OK" && place) {
            // Extract address components
            let streetNumber = "";
            let route = "";
            let city = "";
            let state = "";
            let zipCode = "";
            if (place.address_components) {
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
            }

            // Build street address from components
            const streetAddress = [streetNumber, route].filter(Boolean).join(" ");

            const details: PlaceDetails = {
              name: place.name || prediction.structured_formatting.main_text,
              placeId: prediction.place_id,
              formattedAddress: place.formatted_address,
              streetAddress,
              city,
              state,
              zipCode,
              phone: place.formatted_phone_number,
              website: place.website,
            };
            onChange(prediction.description, prediction.place_id, details);
          } else {
            onChange(prediction.description, prediction.place_id);
          }
        }
      );
    } else {
      onChange(prediction.description, prediction.place_id);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={cn("pl-10", error && "border-destructive")}
          disabled={!isScriptLoaded}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {!isScriptLoaded && (
        <p className="text-xs text-muted-foreground mt-1">Loading Google Places...</p>
      )}

      {isOpen && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelect(prediction)}
              className="w-full px-3 py-2 text-left hover:bg-muted flex items-start gap-3 transition-colors"
            >
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {prediction.structured_formatting.main_text}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {prediction.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
