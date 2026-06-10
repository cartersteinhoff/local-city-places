"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface LatLng {
  lat(): number;
  lng(): number;
}

interface LatLngBounds {
  getNorthEast(): LatLng;
}

interface GeocoderResult {
  geometry: {
    location: LatLng;
    bounds?: LatLngBounds;
    viewport?: LatLngBounds;
  };
}

interface GoogleMapsApi {
  Geocoder: new () => {
    geocode(
      request: { address: string },
      callback: (results: GeocoderResult[] | null, status: string) => void,
    ): void;
  };
  Map: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => {
    fitBounds(bounds: unknown, padding?: number): void;
  };
  Circle: new (
    options: Record<string, unknown>,
  ) => {
    getBounds(): unknown;
  };
  Polygon: new (options: Record<string, unknown>) => unknown;
  LatLngBounds: new () => {
    extend(point: { lat: number; lng: number }): void;
    getCenter(): LatLng;
  };
  Marker: new (options: Record<string, unknown>) => unknown;
}

type PolygonCoordinates = number[][][];

interface CityBoundaryGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: PolygonCoordinates | PolygonCoordinates[];
}

async function fetchCityBoundary(
  city: string,
  state: string | null | undefined,
): Promise<CityBoundaryGeometry | null> {
  if (!state) return null;

  try {
    const params = new URLSearchParams({ city, state });
    const response = await fetch(`/api/geo/city-boundary?${params}`);
    if (!response.ok) return null;

    const data = (await response.json()) as {
      geometry?: CityBoundaryGeometry;
    };
    if (
      data.geometry?.type !== "Polygon" &&
      data.geometry?.type !== "MultiPolygon"
    ) {
      return null;
    }

    return data.geometry;
  } catch {
    return null;
  }
}

function boundaryToPaths(
  geometry: CityBoundaryGeometry,
): Array<Array<{ lat: number; lng: number }>> {
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates as PolygonCoordinates]
      : (geometry.coordinates as PolygonCoordinates[]);

  return polygons.flatMap((rings) =>
    rings.map((ring) => ring.map(([lng, lat]) => ({ lat, lng }))),
  );
}

function getMapsApi(): GoogleMapsApi | undefined {
  return (window as Window & { google?: { maps?: GoogleMapsApi } }).google
    ?.maps;
}

function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(b.lat() - a.lat());
  const dLng = toRad(b.lng() - a.lng());
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat())) *
      Math.cos(toRad(b.lat())) *
      Math.sin(dLng / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

// Tailwind orange-600, matching the app primary. The Maps API needs a
// literal color value rather than a CSS variable.
const perimeterColor = "#ea580c";

interface CityTerritoryMapProps {
  city: string | null | undefined;
  state: string | null | undefined;
  label?: string;
  className?: string;
}

export function CityTerritoryMap({
  city,
  state,
  label,
  className,
}: CityTerritoryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const marketLabel = [city, state].filter(Boolean).join(", ");

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!city || !apiKey) {
      setStatus("error");
      return;
    }

    let cancelled = false;

    const createMap = (maps: GoogleMapsApi, element: HTMLElement) =>
      new maps.Map(element, {
        zoom: 11,
        disableDefaultUI: true,
        gestureHandling: "none",
        keyboardShortcuts: false,
        clickableIcons: false,
      });

    // Fallback when no official boundary exists: geocode the city and draw
    // an approximate perimeter circle sized from its viewport.
    const drawApproximateCircle = (maps: GoogleMapsApi) => {
      const geocoder = new maps.Geocoder();
      const address = [city, state].filter(Boolean).join(", ");

      geocoder.geocode({ address }, (results, geocodeStatus) => {
        if (cancelled) return;
        const result = results?.[0];
        if (geocodeStatus !== "OK" || !result || !mapRef.current) {
          setStatus("error");
          return;
        }

        const center = result.geometry.location;
        const bounds = result.geometry.bounds || result.geometry.viewport;
        const map = createMap(maps, mapRef.current);

        const radius = bounds
          ? distanceMeters(center, bounds.getNorthEast()) * 0.55
          : 4000;

        const circle = new maps.Circle({
          map,
          center,
          radius,
          strokeColor: perimeterColor,
          strokeOpacity: 0.9,
          strokeWeight: 3,
          fillColor: perimeterColor,
          fillOpacity: 0.08,
        });

        new maps.Marker({ map, position: center, title: address });

        const circleBounds = circle.getBounds();
        if (circleBounds) {
          map.fitBounds(circleBounds, 24);
        }

        setStatus("ready");
      });
    };

    const init = async () => {
      const maps = getMapsApi();
      if (cancelled || !maps || !mapRef.current) {
        if (!cancelled) setStatus("error");
        return;
      }

      const boundary = await fetchCityBoundary(city, state);
      if (cancelled || !mapRef.current) return;

      if (!boundary) {
        drawApproximateCircle(maps);
        return;
      }

      const paths = boundaryToPaths(boundary);
      const bounds = new maps.LatLngBounds();
      for (const path of paths) {
        for (const point of path) {
          bounds.extend(point);
        }
      }

      const map = createMap(maps, mapRef.current);

      new maps.Polygon({
        map,
        paths,
        strokeColor: perimeterColor,
        strokeOpacity: 0.9,
        strokeWeight: 3,
        fillColor: perimeterColor,
        fillOpacity: 0.08,
      });

      new maps.Marker({
        map,
        position: bounds.getCenter(),
        title: [city, state].filter(Boolean).join(", "),
      });

      map.fitBounds(bounds, 24);
      setStatus("ready");
    };

    if (getMapsApi()) {
      init();
      return;
    }

    if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      document.head.appendChild(script);
    }

    const interval = setInterval(() => {
      if (getMapsApi()) {
        clearInterval(interval);
        init();
      }
    }, 200);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!getMapsApi()) {
        setStatus("error");
      }
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [city, state]);

  if (status === "error") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border bg-muted/40 p-6 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        {marketLabel
          ? `Map of ${marketLabel} is unavailable right now.`
          : "Add your city and state to see your market on the map."}
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden rounded-lg border", className)}
    >
      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-muted/60" />
      )}
      {label && (
        <span className="absolute left-2 top-2 z-10 rounded-md border bg-background/90 px-2.5 py-1 text-xs font-semibold">
          {label}
        </span>
      )}
      <div
        ref={mapRef}
        className="h-full w-full"
        role="img"
        aria-label={
          marketLabel
            ? `Map of ${marketLabel} with your locked market perimeter highlighted`
            : "Market territory map"
        }
      />
    </div>
  );
}
