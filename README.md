# Cinofili · frontend

Next.js (App Router) + React 19 + Tailwind v4. Il browser parla solo con `/api/*`, che Next riscrive verso `${BACKEND_URL}/sub/api/*`; la sessione è il cookie httpOnly `cinofili_token` del backend.

## Avvio

```
cp .env.example .env        # BACKEND_URL=http://localhost:5000
npm install
npm run dev                 # http://localhost:3000
```

Serve il backend `cinofili-be` avviato (`yarn dev`). `BACKEND_URL` va impostato anche per `npm run build`: i rewrite di `/api` si fissano in build.

In production il backend gira dietro questo frontend con `TRUST_PROXY=true`, così i rate limit per IP vedono l'IP del browser (il rewrite inoltra `X-Forwarded-For`). Il backend **non deve essere raggiungibile direttamente**: chi lo chiamasse con un `X-Forwarded-For` falso aggirerebbe i rate limit.

## Comandi

- `npm run lint`, `npm run typecheck`, `npm run build`
- `npm run api:types`: rigenera `src/lib/api-types.d.ts` dall'OpenAPI del backend (`${BACKEND_URL:-http://localhost:5000}/docs/json`, disponibile fuori da production). Il file generato si committa. Le risposte si tipizzano con `operations["<operationId>"]` da lì, mai a mano.

## E2E (Playwright)

Una volta sola:

1. nel backend: crea il DB `cinofili_e2e`, `cp .env.e2e.example .env.e2e` con le credenziali locali, `yarn install && yarn build`;
2. qui: `npx playwright install chromium`.

Poi `npm run e2e`. Playwright avvia il backend (porta 5055, applica le migrazioni su `cinofili_e2e`) e `next dev` (porta 3055) e li riusa se sono già accesi. Ricompila il backend (`yarn build`) dopo averlo modificato. Ogni test parte da `seed(scenario)` (`e2e/helpers.ts`), che svuota e ricrea il DB e2e con `cinofili-be/scripts/e2e-seed.js`: gli scenari e i dati sono descritti in testa a quello script.

Gli e2e girano solo su Chromium con il viewport dell'iPhone 13 (`devices["iPhone 13"]`): WebKit/Safari non è coperto. Gli spec importano `test` ed `expect` da `e2e/helpers.ts`, non da `@playwright/test`: quel `test` dà a ogni test un `X-Forwarded-For` diverso, così i rate limit per IP del backend (avviato con `TRUST_PROXY=true`) non si sommano.
