# API_CONTRACT.md — vad propia.node behöver bygga

Detta är specen för det read-only listings-API som `app.propia` (mobilappen)
förväntar sig. **Ingen kod i propia.node har ändrats** — det här dokumentet
är handoff-specen för när det API:et byggs där. `src/api/client.ts` i den
här appen är redan skrivet mot kontraktet nedan; mockdata (`src/api/mockData.ts`)
har exakt samma form.

Byggs i `propia.node` som nya filer under `app/api/v1/` (App Router route
handlers), enligt samma mönster som befintliga `app/api/leads/route.ts`.
Läser bara — rör inte skriv-vägen (wizard, review queue).

## Endpoints

### `GET /api/v1/listings`

Query-parametrar (alla optional):

| Param | Typ | Matchar mot `listings`-kolumn |
|---|---|---|
| `operation` | `venta \| alquiler \| alquiler_temporal` | `operation` |
| `propertyType` | se `PropertyType` i `src/types/listing.ts` | `property_type` |
| `location` | location `full_slug` | `location_id` (via join på `locations`) |
| `minPrice` / `maxPrice` | number (USD) | `price_usd` |
| `bedrooms` | number (min) | `bedrooms` |
| `page` | number, default 1, 20/sida | — |

Filtrerar alltid `status = 'published'` — aldrig draft/pending/removed.
Bör kunna återanvända `idx_search`-indexet rakt av (samma kolumnordning:
status, operation, property_type, location_id, price_usd).

Svar:

```ts
{
  items: ListingSummary[]; // se src/types/listing.ts
  page: number;
  pageSize: number;
  total: number;
}
```

### `GET /api/v1/listings/:publicId`

`publicId` = `listings.public_id` (samma id som redan används i
`/propiedad/{slug}-{public_id}`-urlerna på webben).

Svar: `ListingDetail` (se `src/types/listing.ts`) — inkluderar alla bilder
(från `listing_images`, sorterade på `position`), kontaktinfo för agent
eller agency (whichever finns), `descriptionEs`.

404 om listingen inte finns eller inte är `published`.

### `GET /api/v1/meta` (senare, ej blockerande för MVP)

Städer/barrion + antal (från `locations.listing_counts`) — driver
filter-UI:t i appen utan att appen behöver hårdkoda location-listan.

## Delade principer (från propia.node/ARCHITECTURE.md)

- **Bild-URL:er**: aldrig r2Key direkt — resolva till fulla CDN-URL:er
  (`img.propia.com.py/...`) i API-svaret, precis som webben redan gör via
  `src/lib/format.ts`.
- **Ingen ny hosting**: dessa routes läggs i samma Next.js-app, samma
  Node.js-slot på Hostinger. Ingen ny domän, ingen ny process.
- **Versionera**: `/api/v1/` låst kontrakt. Breaking changes → `/api/v2/`,
  aldrig ändra v1 under en publicerad appversion.
- **Cache**: `Cache-Control: public, max-age=300` på `/listings` och
  `/listings/:id` — objektdata ändras sällan, avlastar DB och delad process.
- **Rate limit**: samma process som webben (se propia.node ARCHITECTURE.md
  §1) — appens trafik får inte kunna påverka webbens prestanda.

## Status

⏳ Ej byggt i propia.node ännu. `app.propia` körs mot `src/api/mockData.ts`
tills detta finns. Se `src/api/client.ts` — `USE_MOCK` flippas till `false`
och `API_BASE` pekas mot `https://propia.com.py/api/v1` när endpoints är
live. Ingen skärm/komponent behöver ändras.
