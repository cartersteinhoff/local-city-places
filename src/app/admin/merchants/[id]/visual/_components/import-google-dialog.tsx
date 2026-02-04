"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Loader2, Check, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Hours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

interface ImportedData {
  businessName: string;
  googlePlaceId: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  website: string;
  hours: Hours;
}

interface ImportGoogleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ImportedData) => void;
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
    initGooglePlacesImport: () => void;
  }
}

export function ImportGoogleDialog({
  open,
  onOpenChange,
  onImport,
}: ImportGoogleDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<ImportedData | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const dummyDiv = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load Google Places script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error("Google Places API key not configured");
      return;
    }

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

    if (window.google?.maps?.places) {
      initServices();
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Script loading, wait for it
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          initServices();
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    window.initGooglePlacesImport = initServices;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlacesImport`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setInputValue("");
      setPredictions([]);
      setSelectedPlace(null);
    }
  }, [open]);

  const searchPlaces = useCallback((query: string) => {
    if (!autocompleteService.current || !query.trim()) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);

    autocompleteService.current.getPlacePredictions(
      {
        input: query,
        types: ["establishment"],
        componentRestrictions: { country: "us" },
      },
      (results: PlacePrediction[] | null, status: string) => {
        setIsLoading(false);
        if (status === "OK" && results) {
          setPredictions(results);
        } else {
          setPredictions([]);
        }
      }
    );
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedPlace(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);
  };

  const parseHours = (openingHours: any): Hours => {
    const defaultHours: Hours = {
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
      saturday: "",
      sunday: "",
    };

    if (!openingHours?.weekday_text) return defaultHours;

    const dayMap: Record<string, keyof Hours> = {
      Monday: "monday",
      Tuesday: "tuesday",
      Wednesday: "wednesday",
      Thursday: "thursday",
      Friday: "friday",
      Saturday: "saturday",
      Sunday: "sunday",
    };

    for (const text of openingHours.weekday_text) {
      // Format: "Monday: 9:00 AM – 5:00 PM" or "Monday: Closed"
      const colonIndex = text.indexOf(":");
      if (colonIndex === -1) continue;

      const day = text.substring(0, colonIndex).trim();
      const hours = text.substring(colonIndex + 1).trim();

      const key = dayMap[day];
      if (key) {
        defaultHours[key] = hours;
      }
    }

    return defaultHours;
  };

  const handleSelect = (prediction: PlacePrediction) => {
    setInputValue(prediction.structured_formatting.main_text);
    setPredictions([]);
    setIsFetchingDetails(true);

    if (placesService.current) {
      placesService.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: [
            "name",
            "formatted_address",
            "address_components",
            "formatted_phone_number",
            "website",
            "opening_hours",
          ],
        },
        (place: any, status: string) => {
          setIsFetchingDetails(false);
          if (status === "OK" && place) {
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

            const streetAddress = [streetNumber, route].filter(Boolean).join(" ");
            const hours = parseHours(place.opening_hours);

            setSelectedPlace({
              businessName: place.name || prediction.structured_formatting.main_text,
              googlePlaceId: prediction.place_id,
              streetAddress,
              city,
              state,
              zipCode,
              phone: place.formatted_phone_number || "",
              website: place.website || "",
              hours,
            });
          }
        }
      );
    }
  };

  const handleImport = () => {
    if (selectedPlace) {
      onImport(selectedPlace);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Import from Google Places
          </DialogTitle>
          <DialogDescription>
            Search for your business to auto-fill name, address, phone, website, and hours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Search for your business..."
              className="pl-10"
              disabled={!isScriptLoaded}
              autoFocus
            />
            {(isLoading || isFetchingDetails) && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {!isScriptLoaded && (
            <p className="text-sm text-muted-foreground">Loading Google Places...</p>
          )}

          {/* Predictions List */}
          {predictions.length > 0 && !selectedPlace && (
            <div className="border rounded-md divide-y max-h-60 overflow-auto">
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

          {/* Selected Place Preview */}
          {selectedPlace && (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{selectedPlace.businessName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {[selectedPlace.streetAddress, selectedPlace.city, selectedPlace.state, selectedPlace.zipCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
                <Check className="w-5 h-5 text-green-500" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectedPlace.phone && (
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    {selectedPlace.phone}
                  </div>
                )}
                {selectedPlace.website && (
                  <div className="truncate">
                    <span className="text-muted-foreground">Website:</span>{" "}
                    {selectedPlace.website.replace(/^https?:\/\//, "")}
                  </div>
                )}
              </div>

              {Object.values(selectedPlace.hours).some(h => h) && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Hours found:</span>{" "}
                  <Check className="w-3 h-3 inline text-green-500" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!selectedPlace}>
            Import Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
