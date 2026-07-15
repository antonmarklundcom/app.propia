# propia — mobilapp

iOS/Android-app som visar samma fastighetsobjekt som propia.com.py. Läs
`ARCHITECTURE.md` innan du bygger vidare — den beskriver hur det här repot
förhåller sig till `propia.node` (webben/databasen).

## Stack

Expo (React Native) · TypeScript · expo-router · @tanstack/react-query

## Lokal utveckling

```bash
npm install
npm run start          # Expo dev server — skanna QR med Expo Go, eller kör i simulator
npm run ios            # kräver Xcode/simulator
npm run android        # kräver Android Studio/emulator
npm run typecheck
```

Appen körs just nu mot mockdata (`src/api/mockData.ts`) — inget riktigt
API finns än i `propia.node`. Se `API_CONTRACT.md` för specen och
`src/api/client.ts` för hur swappen till riktig data görs (en flagga).

## Repo-karta

```
ARCHITECTURE.md       kontrakt/plan för hela mobilapp-initiativet
API_CONTRACT.md        spec propia.node behöver implementera
app/                   Expo Router-skärmar
src/types/listing.ts   typer speglar propia.node/src/db/schema.ts
src/api/                datalager (mock idag, HTTP när API:et finns)
src/components/         delade UI-komponenter
src/lib/format.ts       es-PY formattering
```
