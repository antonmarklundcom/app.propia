import type {
  ListingDetail,
  ListingsQuery,
  PaginatedListings,
} from "@/types/listing";
import { MOCK_LISTINGS, toSummary } from "./mockData";

/**
 * API_BASE points at propia.node once it ships GET /api/v1/listings and
 * /api/v1/listings/:publicId (see API_CONTRACT.md at repo root — that file
 * is the spec propia.node needs to implement; this client is written
 * against it already). Until then USE_MOCK stays true.
 *
 * Swap order when the real API lands: set API_BASE, flip USE_MOCK to
 * false. No screen or component changes needed — they only import
 * getListings/getListing from this file.
 */
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "https://propia.com.py/api/v1";
const USE_MOCK = true;

async function httpGetListings(query: ListingsQuery): Promise<PaginatedListings> {
  const params = new URLSearchParams();
  if (query.operation) params.set("operation", query.operation);
  if (query.propertyType) params.set("propertyType", query.propertyType);
  if (query.locationSlug) params.set("location", query.locationSlug);
  if (query.minPrice) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice) params.set("maxPrice", String(query.maxPrice));
  if (query.bedrooms) params.set("bedrooms", String(query.bedrooms));
  if (query.page) params.set("page", String(query.page));

  const res = await fetch(`${API_BASE}/listings?${params.toString()}`);
  if (!res.ok) throw new Error(`GET /listings failed: ${res.status}`);
  return res.json();
}

async function httpGetListing(publicId: string): Promise<ListingDetail> {
  const res = await fetch(`${API_BASE}/listings/${publicId}`);
  if (!res.ok) throw new Error(`GET /listings/${publicId} failed: ${res.status}`);
  return res.json();
}

function mockGetListings(query: ListingsQuery): PaginatedListings {
  let items = MOCK_LISTINGS;
  if (query.operation) items = items.filter((l) => l.operation === query.operation);
  if (query.propertyType) items = items.filter((l) => l.propertyType === query.propertyType);
  if (query.minPrice) items = items.filter((l) => l.priceUsd >= query.minPrice!);
  if (query.maxPrice) items = items.filter((l) => l.priceUsd <= query.maxPrice!);
  if (query.bedrooms) items = items.filter((l) => (l.bedrooms ?? 0) >= query.bedrooms!);

  return {
    items: items.map(toSummary),
    page: query.page ?? 1,
    pageSize: 20,
    total: items.length,
  };
}

function mockGetListing(publicId: string): ListingDetail {
  const listing = MOCK_LISTINGS.find((l) => l.publicId === publicId);
  if (!listing) throw new Error(`Listing ${publicId} not found`);
  return listing;
}

export async function getListings(query: ListingsQuery = {}): Promise<PaginatedListings> {
  if (USE_MOCK) return Promise.resolve(mockGetListings(query));
  return httpGetListings(query);
}

export async function getListing(publicId: string): Promise<ListingDetail> {
  if (USE_MOCK) return Promise.resolve(mockGetListing(publicId));
  return httpGetListing(publicId);
}
