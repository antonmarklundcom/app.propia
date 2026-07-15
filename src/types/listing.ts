/**
 * Mirrors the public-facing subset of `listings` in propia.node's
 * src/db/schema.ts. Keep field names identical to the DB (camelCase via
 * Drizzle) so the API layer is a thin passthrough with no renaming.
 * Internal-only columns (reviewNotes, ownerUserId, foreignExposure, …) are
 * intentionally omitted — this is what the public API returns, not the row.
 */

export type Operation = "venta" | "alquiler" | "alquiler_temporal";

export type PropertyType =
  | "casa"
  | "departamento"
  | "terreno"
  | "duplex"
  | "comercial"
  | "oficina"
  | "deposito"
  | "quinta";

export type PropertyState =
  | "entrega_inmediata"
  | "en_construccion"
  | "en_pozo"
  | "usado";

export interface ListingImage {
  url: string; // resolved R2 CDN URL, not the raw r2Key
  width: number | null;
  height: number | null;
  position: number;
}

export interface ListingSummary {
  publicId: string;
  slug: string;
  operation: Operation;
  propertyType: PropertyType;
  title: string;
  priceUsd: number;
  cuotaGs: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number | null;
  landM2: number | null;
  locationName: string; // denormalized "Barrio, Ciudad" for list display
  lat: number | null;
  lng: number | null;
  coverImage: ListingImage | null;
}

export interface ListingDetail extends ListingSummary {
  descriptionEs: string | null;
  propertyState: PropertyState | null;
  parking: number | null;
  amenities: string[] | null;
  images: ListingImage[];
  agency: { name: string; whatsapp: string | null; isVerified: boolean } | null;
  agent: { name: string; whatsapp: string | null; isVerified: boolean } | null;
  videoUrl: string | null;
  publishedAt: string | null;
}

export interface ListingsQuery {
  operation?: Operation;
  propertyType?: PropertyType;
  locationSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  page?: number;
}

export interface PaginatedListings {
  items: ListingSummary[];
  page: number;
  pageSize: number;
  total: number;
}
