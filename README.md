# Cinofili · frontend

Next.js (App Router) + React 19 + Tailwind v4. Il browser parla solo con `/api/*`, che Next riscrive verso `${BACKEND_URL}/sub/api/*`; la sessione è il cookie httpOnly `cinofili_token` del backend.

## Avvio

```
cp .env.example .env        # BACKEND_URL=http://localhost:5000
npm install
npm run dev                 # http://localhost:3000
```

Serve il backend `cinofili-be` avviato (`yarn dev`).

## Deploy

- **Obbligatorie in build** (e all'avvio): `BACKEND_URL` (i rewrite di `/api` si fissano in build) e `NEXT_PUBLIC_SITE_URL` (URL pubblico: `metadataBase`, Open Graph, `sitemap.xml`, `robots.txt`; le `NEXT_PUBLIC_*` finiscono nel bundle in build). Con `NODE_ENV=production` (`next build`, `next start`) se ne manca una `next.config.ts` lancia un errore.
- Header di sicurezza da `next.config.ts` su ogni pagina: `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` (`no-referrer` su `/invite`), niente `X-Powered-By`. **HSTS** (`Strict-Transport-Security`) va attivato sul proxy di bordo che termina l'HTTPS.
- IP dei client e rate limit del backend:
  - Catena fidata obbligatoria: **reverse proxy di bordo** che **sovrascrive** `X-Forwarded-For` con l'indirizzo reale del client (nginx: `proxy_set_header X-Forwarded-For $remote_addr;`) → questo frontend → backend. Next inoltra l'`X-Forwarded-For` ricevuto così com'è (sia nel rewrite di `/api` sia nella pagina `/invite`, che lo passa a mano), senza aggiungere voci: senza un bordo che lo sovrascrive il client può scriverci quello che vuole.
  - Nel backend `TRUST_PROXY` è il numero di proxy fidati (hop count): con questa catena `TRUST_PROXY=1` (il backend fida il socket di Next e prende l'ultima voce di `X-Forwarded-For`, quella del bordo). Dettagli nel README del backend, sezione "Deploy".
  - Il backend **non deve mai essere raggiungibile pubblicamente** (rete privata, firewall o bind su localhost).
  - Vercel: il suo edge imposta `x-forwarded-for` con l'IP reale del client, quindi fa da proxy di bordo; verificare con una richiesta di prova quale IP vede il backend e impostare `TRUST_PROXY` di conseguenza.

## Comandi

- `npm run lint`, `npm run typecheck`, `npm run build` (serve anche `NEXT_PUBLIC_SITE_URL`, vedi Deploy)
- `npm run api:types`: rigenera `src/lib/api-types.d.ts` dall'OpenAPI del backend (`${BACKEND_URL:-http://localhost:5000}/docs/json`, disponibile fuori da production). Il file generato si committa. Le risposte si tipizzano con `operations["<operationId>"]` da lì, mai a mano.

## E2E (Playwright)

Una volta sola:

1. nel backend: crea il DB `cinofili_e2e`, `cp .env.e2e.example .env.e2e` con le credenziali locali, `yarn install && yarn build`;
2. qui: `npx playwright install chromium`.

Poi `npm run e2e`. Playwright avvia il backend (porta 5055, applica le migrazioni su `cinofili_e2e`) e `next dev` (porta 3055) e li riusa se sono già accesi. Ricompila il backend (`yarn build`) dopo averlo modificato. Ogni test parte da `seed(scenario)` (`e2e/helpers.ts`), che svuota e ricrea il DB e2e con `cinofili-be/scripts/e2e-seed.js`: gli scenari e i dati sono descritti in testa a quello script.

Gli e2e girano solo su Chromium con il viewport dell'iPhone 13 (`devices["iPhone 13"]`): WebKit/Safari non è coperto. Gli spec importano `test` ed `expect` da `e2e/helpers.ts`, non da `@playwright/test`: quel `test` dà a ogni test un `X-Forwarded-For` diverso, così i rate limit per IP del backend non si sommano. Il backend e2e ha `TRUST_PROXY=1`: Next è l'unico hop fra il test e il backend e inoltra l'`X-Forwarded-For` del test così com'è, quindi il backend legge proprio quel valore.

### Smoke di production

`npm run e2e:prod` (`playwright.prod.config.ts`, spec in `e2e-prod/`): fa `next build && next start` sulla porta 3056 con `BACKEND_URL=http://localhost:5055` e `NEXT_PUBLIC_SITE_URL=http://localhost:3056`, contro lo stesso backend e2e. Controlla home, login, redirect (proxy e `next` di `/login`), header di sicurezza e rewrite di `/api`. Non riusa un server già acceso sulla 3056: ogni giro ricompila.
