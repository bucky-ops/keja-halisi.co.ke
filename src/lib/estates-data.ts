// KEJA HALISI — canonical estates data (single tracked import)
// Shared catalog config for the whole app: boroughs, sub-counties, estates,
// Sheng alias map, price buckets, beds + amenity vocabularies, main roads.
// Import ESTATES_DATA from here — NEVER re-read or duplicate the JSON elsewhere.
// NOTE: src/lib/estates.json is the tracked canonical copy (md5-identical to the
// original upload/Estates.json, which stays untracked). Keeps Vercel builds green.

import rawJson from "./estates.json";

export interface PriceBucket {
  id: string; // "0-7k" | "7-10k" | ... | "70k+"
  label: string; // "15k - 20k"
  min: number;
  max: number;
}

export interface BedVocab {
  id: string; // "bedsitter" | "1BR" | "2BR" | "3BR"
  label: string; // "Bedsitter" | "1BR" ...
  aliases: string[];
}

export interface AmenityVocab {
  id: string; // "water" | "parking" | "security" | "tokens" | "fibre" | "no_fee"
  label: string;
  keywords: string[];
  isTrustFilter?: boolean;
}

export interface EstateRow {
  name: string;
  subCounty: string;
  borough: string;
  lat: number;
  lng: number;
  mainRoad: string;
  mainRoadLat: number;
  mainRoadLng: number;
  priceRange: string;
  avgPrice: Record<string, number>;
}

export interface BoroughRow {
  id: string;
  name: string;
  subCounties: string[];
}

export interface SubCountyRow {
  name: string;
  borough: string;
  boroughId: string;
}

export interface MainRoad {
  name: string;
  lat: number;
  lng: number;
}

export interface EstatesData {
  version: string;
  description: string;
  generated_for: string;
  boroughs: BoroughRow[];
  subCounties: SubCountyRow[];
  estates: EstateRow[];
  aliasMap: Record<string, string>; // "kile" -> "Kileleshwa"
  priceBuckets: PriceBucket[];
  beds: BedVocab[];
  amenities: AmenityVocab[];
  mainRoads: MainRoad[];
}

export const ESTATES_DATA = rawJson as unknown as EstatesData;

export const ALIAS_MAP: Record<string, string> = ESTATES_DATA.aliasMap;
export const PRICE_BUCKETS: PriceBucket[] = ESTATES_DATA.priceBuckets;
export const BEDS_VOCAB: BedVocab[] = ESTATES_DATA.beds;
export const AMENITIES_VOCAB: AmenityVocab[] = ESTATES_DATA.amenities;
export const ESTATE_ROWS: EstateRow[] = ESTATES_DATA.estates;
