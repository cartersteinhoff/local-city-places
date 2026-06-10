import { type NextRequest, NextResponse } from "next/server";

// US Census TIGERweb incorporated-place boundaries (public domain, no key).
const TIGERWEB_BASE =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer";

// Layer 4 = Incorporated Places, layer 5 = Census Designated Places
// (unincorporated communities merchants may enter as their city).
const PLACE_LAYERS = [4, 5];

const STATE_FIPS: Record<string, string> = {
  AL: "01",
  AK: "02",
  AZ: "04",
  AR: "05",
  CA: "06",
  CO: "08",
  CT: "09",
  DE: "10",
  DC: "11",
  FL: "12",
  GA: "13",
  HI: "15",
  ID: "16",
  IL: "17",
  IN: "18",
  IA: "19",
  KS: "20",
  KY: "21",
  LA: "22",
  ME: "23",
  MD: "24",
  MA: "25",
  MI: "26",
  MN: "27",
  MS: "28",
  MO: "29",
  MT: "30",
  NE: "31",
  NV: "32",
  NH: "33",
  NJ: "34",
  NM: "35",
  NY: "36",
  NC: "37",
  ND: "38",
  OH: "39",
  OK: "40",
  OR: "41",
  PA: "42",
  RI: "44",
  SC: "45",
  SD: "46",
  TN: "47",
  TX: "48",
  UT: "49",
  VT: "50",
  VA: "51",
  WA: "53",
  WV: "54",
  WI: "55",
  WY: "56",
};

interface GeoJsonFeature {
  attributes?: unknown;
  geometry?: {
    type: string;
    coordinates: unknown;
  };
}

async function queryLayer(
  layerId: number,
  city: string,
  stateFips: string,
): Promise<GeoJsonFeature | null> {
  const escapedCity = city.replace(/'/g, "''");
  const params = new URLSearchParams({
    where: `UPPER(BASENAME)=UPPER('${escapedCity}') AND STATE='${stateFips}'`,
    outFields: "BASENAME",
    returnGeometry: "true",
    outSR: "4326",
    // ~50m simplification keeps payloads small without visibly changing
    // the boundary at city zoom levels.
    maxAllowableOffset: "0.0005",
    f: "geojson",
  });

  const response = await fetch(`${TIGERWEB_BASE}/${layerId}/query?${params}`, {
    next: { revalidate: 60 * 60 * 24 * 30 },
  });
  if (!response.ok) return null;

  const data = (await response.json()) as { features?: GeoJsonFeature[] };

  return data.features?.[0] ?? null;
}

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city")?.trim();
  const state = request.nextUrl.searchParams.get("state")?.trim().toUpperCase();
  const stateFips = state ? STATE_FIPS[state] : undefined;

  if (!city || !stateFips) {
    return NextResponse.json(
      { error: "city and a valid two-letter state are required" },
      { status: 400 },
    );
  }

  try {
    for (const layerId of PLACE_LAYERS) {
      const feature = await queryLayer(layerId, city, stateFips);
      if (feature?.geometry?.type && feature.geometry.coordinates) {
        return NextResponse.json(
          { geometry: feature.geometry },
          {
            headers: {
              "Cache-Control": "public, max-age=86400, s-maxage=2592000",
            },
          },
        );
      }
    }

    return NextResponse.json({ error: "boundary not found" }, { status: 404 });
  } catch (error) {
    console.error("Failed to fetch city boundary:", error);
    return NextResponse.json(
      { error: "boundary lookup failed" },
      { status: 502 },
    );
  }
}
