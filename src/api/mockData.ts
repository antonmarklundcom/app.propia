import type { ListingDetail, ListingSummary } from "@/types/listing";

/**
 * Stand-in for propia.node's not-yet-built /api/v1/listings endpoints
 * (see API_CONTRACT.md). Shapes match ListingSummary/ListingDetail exactly
 * so swapping mockClient for httpClient in src/api/client.ts is a one-line
 * change once propia.node ships the real routes — no screen code changes.
 */

const IMG = (seed: string, w = 800, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const MOCK_LISTINGS: ListingDetail[] = [
  {
    publicId: "a1b2c3d4e5",
    slug: "casa-3-dormitorios-recoleta",
    operation: "venta",
    propertyType: "casa",
    title: "Casa 3 dormitorios en Recoleta",
    priceUsd: 185000,
    cuotaGs: 6_450_000,
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 210,
    landM2: 360,
    locationName: "Recoleta, Asunción",
    lat: -25.2916,
    lng: -57.5738,
    coverImage: { url: IMG("casa1"), width: 800, height: 600, position: 0 },
    descriptionEs:
      "Amplia casa a estrenar en Recoleta, a metros de Avda. España. Cocina integrada, quincho y parrilla.",
    propertyState: "usado",
    parking: 2,
    amenities: ["piscina", "seguridad_24h", "quincho"],
    images: [
      { url: IMG("casa1"), width: 800, height: 600, position: 0 },
      { url: IMG("casa1b"), width: 800, height: 600, position: 1 },
    ],
    agency: { name: "Inmobiliaria del Sol", whatsapp: "+595981000001", isVerified: true },
    agent: null,
    videoUrl: null,
    publishedAt: "2026-06-20T10:00:00Z",
  },
  {
    publicId: "f6g7h8i9j0",
    slug: "departamento-2-dormitorios-carmelitas",
    operation: "alquiler",
    propertyType: "departamento",
    title: "Departamento 2 dormitorios en Carmelitas",
    priceUsd: 900,
    cuotaGs: null,
    bedrooms: 2,
    bathrooms: 1,
    areaM2: 85,
    landM2: null,
    locationName: "Carmelitas, Asunción",
    lat: -25.2969,
    lng: -57.5921,
    coverImage: { url: IMG("depto1"), width: 800, height: 600, position: 0 },
    descriptionEs: "Departamento luminoso, amoblado, en edificio con seguridad y gimnasio.",
    propertyState: "entrega_inmediata",
    parking: 1,
    amenities: ["gimnasio", "seguridad_24h"],
    images: [{ url: IMG("depto1"), width: 800, height: 600, position: 0 }],
    agency: null,
    agent: { name: "María Benítez", whatsapp: "+595981000002", isVerified: true },
    videoUrl: null,
    publishedAt: "2026-07-01T10:00:00Z",
  },
  {
    publicId: "k1l2m3n4o5",
    slug: "terreno-lambare",
    operation: "venta",
    propertyType: "terreno",
    title: "Terreno 500 m² en Lambaré",
    priceUsd: 45000,
    cuotaGs: null,
    bedrooms: null,
    bathrooms: null,
    areaM2: null,
    landM2: 500,
    locationName: "Lambaré",
    lat: -25.3453,
    lng: -57.6062,
    coverImage: { url: IMG("terreno1"), width: 800, height: 600, position: 0 },
    descriptionEs: "Terreno plano, esquina, con todos los servicios.",
    propertyState: null,
    parking: null,
    amenities: null,
    images: [{ url: IMG("terreno1"), width: 800, height: 600, position: 0 }],
    agency: { name: "Tierras PY", whatsapp: "+595981000003", isVerified: false },
    agent: null,
    videoUrl: null,
    publishedAt: "2026-06-28T10:00:00Z",
  },
];

export function toSummary(l: ListingDetail): ListingSummary {
  const {
    publicId,
    slug,
    operation,
    propertyType,
    title,
    priceUsd,
    cuotaGs,
    bedrooms,
    bathrooms,
    areaM2,
    landM2,
    locationName,
    lat,
    lng,
    coverImage,
  } = l;
  return {
    publicId,
    slug,
    operation,
    propertyType,
    title,
    priceUsd,
    cuotaGs,
    bedrooms,
    bathrooms,
    areaM2,
    landM2,
    locationName,
    lat,
    lng,
    coverImage,
  };
}
