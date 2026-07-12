# Propia App – Arkitektur & Plan

> Mobilapp (iOS/Android) som visar **samma objekt som propia.com.py** – utan att bygga en ny plattform och utan att förbruka fler Node.js-slots på Hostinger än nödvändigt.

**Status:** Förslag. Antaganden om nuvarande stack (Node.js + databas på Hostinger) behöver verifieras mot den faktiska propia-koden.

---

## 1. Kortversionen

- **Appen behöver INGEN egen installation på Hostinger.** En mobilapp distribueras via App Store / Google Play och körs på användarens telefon. Det enda som behöver hostas är ett **API** – och det bygger vi in i den *befintliga* propia-appen. **0 nya Node.js-slots.**
- **Ingen ny domän krävs.** API:et nås via den befintliga domänen: `propia.com.py/api/v1/...`. (Vill du ha `api.propia.com.py` senare är en subdomän gratis på Hostinger och pekar på samma app.)
- **Samma objekt garanteras** genom att appen och webben läser från **samma databas via samma API** – en enda sanningskälla, ingen synk, ingen duplicering.

```
                    ┌─────────────────────────────┐
                    │  Hostinger (1 Node.js-slot)  │
                    │                             │
  propia.com.py ──▶ │  Befintlig webbapp          │
                    │   └── NYTT: /api/v1/*  ─────┼──▶ Samma databas
                    │        (JSON-endpoints)     │    (objekt, bilder,
                    └─────────────▲───────────────┘     mäklare)
                                  │ HTTPS/JSON
                    ┌─────────────┴───────────────┐
                    │  Mobilapp (Expo/React Native)│
                    │  iOS + Android, 1 kodbas     │
                    │  Hostas INTE på Hostinger    │
                    └─────────────────────────────┘
```

---

## 2. Svar på Hostinger-frågorna

### Behöver appen en egen installation?
Nej. Skilj på tre saker:

| Del | Var den körs | Kostar Node.js-slot? |
|---|---|---|
| Mobilappen (React Native/Expo) | Användarens telefon, via App Store/Play | Nej |
| API:et | Inuti befintliga propia-appen (`/api/v1`) | Nej (återanvänder befintlig slot) |
| Databasen | Där den redan finns | Nej |

Din 10-appars-gräns påverkas alltså **inte alls** av det här projektet. Enda scenariot där en ny slot behövs är om propia-webben *inte* är en Node.js-app du kan lägga endpoints i (t.ex. WordPress) – då byggs API:et som en separat liten Node.js-app (1 slot) som läser samma databas.

### Domän?
- `propia.com.py/api/v1/...` – ingen ny domän, inget nytt DNS, fungerar direkt.
- Alternativ senare: subdomänen `api.propia.com.py` (gratis, samma app). Bra om API:et någon gång flyttas utan att appen behöver uppdateras.
- App Store/Play kräver ingen domän – men **Universal Links/App Links** (öppna `propia.com.py/objekt/123` direkt i appen) kräver att två små verifieringsfiler läggs på webben: `/.well-known/apple-app-site-association` och `/.well-known/assetlinks.json`.

---

## 3. Arkitektur

### 3.1 API-lager (byggs i befintlig app)

Versionerat JSON-API, läs-endpoints först:

```
GET  /api/v1/listings              ?city=&type=&minPrice=&maxPrice=&beds=&page=&sort=
GET  /api/v1/listings/:id          Fullt objekt inkl. bildgalleri, mäklarkontakt
GET  /api/v1/listings/:id/similar  Liknande objekt (samma stad + pristintervall)
GET  /api/v1/meta                  Städer, objekttyper, prisintervall (för filter-UI)
POST /api/v1/leads                 Kontaktförfrågan från appen → mäklaren
```

Principer:
- **Versionera från dag 1** (`/v1/`). Publicerade appar uppdateras långsamt – du kan aldrig ändra ett API-svar utan att gamla appversioner går sönder. `v1` fryses, ändringar blir `v2`.
- **Paginera alltid** (t.ex. 20 objekt/sida) – skonar både Hostinger och mobilnätet.
- **Cache-headers** (`Cache-Control: public, max-age=300`) på listor + enkel in-memory-cache i Node. Objektdata ändras sällan; detta kapar 80–95 % av DB-frågorna.
- **CORS** behövs bara om en webbversion av appen görs; native-appar bryr sig inte om CORS.
- **Rate limiting** (`express-rate-limit` eller motsv.) så att en bugg i appen eller en scraper inte sänker webben – de delar ju samma process.

### 3.2 Mobilappen

**Rekommendation: Expo (React Native) + TypeScript.**

| Val | Motivering |
|---|---|
| Expo/React Native | 1 kodbas → iOS + Android. JavaScript – samma språk som er Node-stack. EAS bygger iOS-appen i molnet (ingen Mac krävs). OTA-uppdateringar: JS-fixar når användare utan App Store-granskning. |
| TanStack Query | Cache, retry, offline-tolerans för API-anrop – gratis robusthet. |
| Zustand/Context | Lättviktigt state (favoriter, filter). |
| `react-native-maps` | Kartvy – Zillows viktigaste vy. |
| Expo Notifications | Push (se Möjligheter). |

Skärmar i MVP:

```
Hem/Sök ──▶ Resultatlista ◀──▶ Kartvy
                │
                ▼
           Objektdetalj (galleri, fakta, karta, "Kontakta mäklare")
                │
           Favoriter (lokalt sparade först; konto senare)
```

### 3.3 Bilder
Appen använder samma bild-URL:er som webben. **Risk:** originalbilder på flera MB gör listvyn seg på mobilnät och äter Hostinger-bandbredd. **Lösning:** generera thumbnails (~400 px, WebP) vid uppladdning, eller lägg gratis-nivån av Cloudinary/Bunny som bildproxy framför befintliga URL:er (resize on-the-fly + CDN). Det avlastar dessutom Hostinger rejält.

---

## 4. Plan

### Fas 0 – Verifiera (några timmar)
1. Bekräfta propia-webbens stack (Node-ramverk? databas? var ligger bilderna?).
2. Kolla Hostinger-planens gränser: RAM/CPU per Node-app, bandbredd, "sover" appen vid inaktivitet?
3. Registrera Apple Developer ($99/år) och Google Play ($25 engångs) – **Apple-granskningen tar tid, starta direkt.**

### Fas 1 – API (≈1 vecka)
- `/api/v1/listings`, `/listings/:id`, `/meta` med paginering, cache, rate limit.
- Testa med curl/Postman. Webben påverkas inte – ren addition.

### Fas 2 – App-MVP (≈2–4 veckor)
- Expo-projekt: söklista → filter → objektdetalj → favoriter (lokalt) → kontakta mäklare (`POST /leads`, eller wa.me-länk till WhatsApp – i Paraguay är WhatsApp ofta den snabbaste vägen till en affär).
- Kartvy om tiden räcker, annars fas 3.
- Internbeta via TestFlight + Play Internal Testing.

### Fas 3 – Lansering (≈1 vecka + granskningstid)
- Ikoner, splash, store-texter (spanska primärt), skärmbilder.
- Apple-granskning: appen måste kännas som mer än "webben i en wrapper" – native kartvy, favoriter och push räcker gott.
- Universal Links/App Links-filerna på webben.

### Fas 4 – Differentiering (löpande)
- Push för sparade sökningar, konton, notiser vid prissänkning, mäklarinlogg.

---

## 5. Problem → Lösningar (förutsedda)

| # | Problem | Lösning |
|---|---|---|
| 1 | **Webben har inget API** (server-renderad HTML) | Endpoints läggs till i samma app – de läser DB direkt, rör inte renderingen. Worst case (ej Node): separat mini-API, 1 slot. |
| 2 | **Delad process**: apptrafik kan sega ner webben | Cache + rate limiting (3.1). Vid tillväxt: bryt ut API till egen slot – appen märker inget om `/api/v1`-kontraktet behålls (eller subdomän-pekning byts). |
| 3 | **Hostinger-Node "sover"** vid inaktivitet → långsam första request | Verifiera i fas 0. Motmedel: extern uptime-ping (UptimeRobot gratis) var 5:e minut. |
| 4 | **Gamla appversioner** när API:et ändras | Strikt versionering + Expo OTA-uppdateringar för JS-ändringar. |
| 5 | **Tunga bilder** på mobilnät | Thumbnails/WebP eller bildproxy-CDN (3.3). |
| 6 | **Apple avvisar "webbsida i app"** | Native karta, favoriter, push, offline-cache – tydligt app-mervärde. |
| 7 | **Scraping av API:et** (konkurrenter) | Rate limit + enkel app-nyckel i header. (Full skydd omöjligt – datat är ändå publikt på webben.) |
| 8 | **Ensam utvecklare / underhåll av två klienter** | Allt i JS/TS, delade typer för API-kontraktet (`shared/types.ts`), Expo minimerar native-strul. |

---

## 6. Möjligheter (det Zillow-läget faktiskt betyder)

1. **Push för sparade sökningar** – *den enskilt största fördelen mot webben.* "Ny lägenhet i Asunción under 150 000 USD" som notis inom minuter. Webben kan inte konkurrera med det; det är Zillows retention-motor.
2. **Direktkanal till köpare**: prissänkningar, "tillbaka på marknaden", nya bilder – varje notis är ett gratis återbesök.
3. **Mäklarvärde → intäkter**: leads från appen är mätbara ("12 leads via appen i juni") → grund för utvalda/boostade annonser, precis Idealistas modell.
4. **Data**: sökfilter + favoriter visar exakt vad marknaden efterfrågar per stad/prisklass – säljbart som marknadsinsikt och styr var ni jagar annonsörer.
5. **Synergi propia + inmobiliaria.com.py**: samma API kan mata båda varumärkena; appen kan bli kategori-appen för fastigheter i Paraguay – marknaden är liten nog att äga.
6. **WhatsApp-integration** som lead-kanal – låg friktion, hög konvertering i Paraguay, noll byggkostnad (`wa.me`-länkar).

---

## 7. Beslut som behöver tas

1. Bekräfta stacken bakom propia.com.py (avgör om API:et byggs i samma app eller som separat slot).
2. Expo/React Native OK som app-stack? (Rekommenderas; alternativ Flutter avviker från er JS-stack.)
3. Bildstrategi: thumbnails i egen kod eller Cloudinary/Bunny gratis-nivå?
4. Starta Apple Developer-registreringen nu.
