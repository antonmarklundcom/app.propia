# app.propia — Arkitektur & Plan

> Mobilapp (iOS/Android) som visar samma fastighetsobjekt som propia.com.py.
> Detta repo är mobilklienten. Produktionssidan/databasen ligger i det
> separata repot `propia.node` (Next.js + MySQL/Drizzle på Hostinger).

**v2 — uppdaterad efter att ha läst den faktiska `propia.node`-koden.**
Ersätter den första versionen av det här dokumentet, som byggde på
antaganden om stacken innan repona kopplades ihop i samma session.

---

## 1. Verkligt nuläge (2026-07-12)

- **propia.com.py är inte lanserad ännu.** `propia.node` har en aktiv
  produktionsincident (objektsidor 500:ar pga en migration som inte körts
  på prod) och olösta launch-blockers (domän ej pekad, R2 ej konfigurerad,
  finansieringsräntor placeholder). Se `propia.node/PLAN.md`.
- **Stacken i propia.node:** Next.js 15 (App Router) + TypeScript, Drizzle
  ORM mot MySQL 8 på Hostinger, bilder på Cloudflare R2, MapLibre+OSM för
  kartor, GHL som CRM/WhatsApp/OTP. Allt i en app, host-header routar olika
  varumärken (`middleware.ts`).
- **Inget publikt listings-API finns ännu.** `propia.node` har bara
  `app/api/leads/route.ts` (lead-webhook in). Att läsa listings utifrån
  (mobilappen) kräver nya endpoints — se `API_CONTRACT.md` i det här
  repot för specen.

Det här ändrar inget i sak jämfört med ursprungsplanen (ingen ny Node.js-
slot, ingen ny domän — se §2), men det betyder att **appen just nu byggs
mot mockdata** som är formad exakt som det riktiga API:et kommer se ut,
tills propia.node-sidan implementerar kontraktet.

---

## 2. Hostinger-frågorna (fortfarande giltiga svar)

- **Appen behöver ingen egen installation.** Mobilappen körs på
  användarens telefon via App Store/Google Play. Det som behöver hostas är
  bara ett par nya API-routes *i den befintliga propia.node-appen* — 0 nya
  Node.js-slots av din 10-gräns.
- **Ingen ny domän.** API:et nås via `propia.com.py/api/v1/...` — samma
  domän, samma app, samma process som webben.
- **Samma objekt garanteras** genom att båda klienterna (webb + app) läser
  från samma MySQL-databas via samma kod-bas — en sanningskälla.

```
┌─────────────────────────────────────────────┐
│  propia.node  (Next.js, 1 Node.js-slot)      │
│  ├─ webben (app/propiedad, app/[operacion])  │
│  ├─ app/api/leads/          (finns idag)     │
│  └─ app/api/v1/listings/    (ATT BYGGA)  ─────┼──▶ MySQL (listings, …)
└──────────────────────▲────────────────────────┘
                        │ HTTPS/JSON, /api/v1 (se API_CONTRACT.md)
┌───────────────────────┴────────────────────────┐
│  app.propia  (Expo/React Native, det här repot) │
│  Just nu: src/api/mockData.ts (samma form)      │
└──────────────────────────────────────────────────┘
```

---

## 3. Det här repots innehåll

```
app/                     Expo Router — index (lista), listing/[id] (detalj)
src/types/listing.ts     Typer speglar listings-tabellen i propia.node 1:1
src/api/client.ts        getListings/getListing — USE_MOCK-flagga för swap
src/api/mockData.ts      Mockdata i exakt samma form som riktiga API:et
src/components/          ListingCard m.fl.
src/lib/format.ts        es-PY prisformattering (speglar propia.node)
API_CONTRACT.md          Specen propia.node behöver implementera
```

Stack: **Expo (React Native) + TypeScript**, `expo-router` för navigation,
`@tanstack/react-query` för datahämtning/cache. Samma språk (TS) som
propia.node — delad mental modell, inga context-switches.

---

## 4. Plan

### Fas 0 — Klart i den här sessionen
- [x] Expo-scaffold: lista → objektdetalj → WhatsApp-kontakt.
- [x] Typer och mockdata som matchar `propia.node/src/db/schema.ts` exakt.
- [x] `API_CONTRACT.md` — spec för det API propia.node behöver bygga.

### Fas 1 — Parallellt spår i propia.node (separat, ej gjort här)
- [ ] **[propia.node]** Implementera `GET /api/v1/listings`,
      `/listings/:publicId` enligt `API_CONTRACT.md`.
- [ ] **[propia.node]** Lös den aktiva incidenten + launch-blockers (se
      `propia.node/PLAN.md`) — appen är beroende av att webben faktiskt har
      riktiga, publicerade listings att visa.

### Fas 2 — Koppla appen mot riktig data
- [ ] Flippa `USE_MOCK` → `false` i `src/api/client.ts`, sätt
      `EXPO_PUBLIC_API_BASE`.
- [ ] Verifiera mot en handfull riktiga listings.

### Fas 3 — MVP-komplettering
- [ ] Filter-UI (operation, typ, pris, sovrum) mot `/api/v1/listings`.
- [ ] Kartvy (`react-native-maps`, samma `lat`/`lng` som webben).
- [ ] Favoriter (lokalt först).
- [ ] Ikoner, splash, store-listing, TestFlight/Play Internal Testing.

### Fas 4 — Differentiering
- [ ] Push för sparade sökningar (se tidigare analys — appens största
      fördel mot webben).
- [ ] Konton/inloggning (kan återanvända `propia.node`s WhatsApp-OTP-flöde
      om ett auth-API exponeras på samma sätt som listings).

---

## 5. Problem → Lösningar

| # | Problem | Lösning |
|---|---|---|
| 1 | Appen har inget API att peka mot ännu | Byggd mot mockdata i exakt rätt form (§3); en rad ändras (`USE_MOCK`) när API:et finns. |
| 2 | propia.com.py är inte lanserad — riskerar tom app vid demo | Mockdata funkar som demo redan idag; koppla mot riktig data blir en separat, senare milstolpe. |
| 3 | Delad process i propia.node: apptrafik kan sega ner webben | Cache-headers + rate limit på `/api/v1/*` (se API_CONTRACT.md). |
| 4 | Gamla appversioner vid API-ändringar | `/api/v1/` fryst kontrakt, breaking changes → `/v2/`. |
| 5 | Tunga bilder på mobilnät | API:et returnerar redan R2/CDN-URL:er — samma bildpipeline som webben, ingen extra optimering krävs i appen. |
| 6 | Apple avvisar "webbsida i app" | Native lista/karta/favoriter/push — tydligt app-mervärde utöver webben. |

---

## 6. Möjligheter

Se tidigare analys (oförändrad): push för sparade sökningar är appens
största fördel mot webben, mätbara leads ger underlag för betald
boostning (à la Idealista), och samma API kan senare mata både propia och
inmobiliaria.com.py.

---

## 7. Beslut som återstår

1. **Vem/när byggs API:et i propia.node?** Separat arbete i det repot —
   inte gjort i den här sessionen (produktion, aktiv incident).
2. Ska appen visa mockdata i en intern demo redan nu, eller vänta på riktig
   data innan nästa steg (filter/karta)?
