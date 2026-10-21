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
- IP dei client e rate limit del backend (deploy senza Vercel):
  - Catena fidata obbligatoria: **reverse proxy di bordo** che **sovrascrive** `X-Forwarded-For` con l'indirizzo reale del client (nginx: `proxy_set_header X-Forwarded-For $remote_addr;`) → questo frontend → backend. Next inoltra l'`X-Forwarded-For` ricevuto così com'è (sia nel rewrite di `/api` sia nella pagina `/invite`, che lo passa a mano), senza aggiungere voci: senza un bordo che lo sovrascrive il client può scriverci quello che vuole.
  - Nel backend `TRUST_PROXY` è il numero di proxy fidati (hop count): con questa catena `TRUST_PROXY=1` (il backend fida il socket di Next e prende l'ultima voce di `X-Forwarded-For`, quella del bordo). Dettagli nel README del backend, sezione "Deploy".

## Deploy Vercel

Il frontend gira su Vercel, il backend è pubblico ma risponde solo a chi conosce `ORIGIN_SECRET` (403 `ORIGIN_FORBIDDEN` altrimenti; vedi il README del backend).

- **Variabili d'ambiente**, sia per **Production** sia per **Preview** (Project Settings → Environment Variables):
  - `BACKEND_URL`: URL pubblico del backend, senza `/` finale (es. `https://api.example.com`);
  - `NEXT_PUBLIC_SITE_URL`: URL pubblico del sito;
  - `ORIGIN_SECRET`: lo stesso valore del backend (`openssl rand -hex 32`). Mai con il prefisso `NEXT_PUBLIC_`: deve restare lato server.
  - Se una manca, `vercel.json` lascia `$BACKEND_URL` / `$ORIGIN_SECRET` scritti alla lettera e le chiamate a `/api` falliscono.
- **`/api/*` dal browser**: in `vercel.json` una regola `routes` lo inoltra all'edge verso `${BACKEND_URL}/sub/api/$1` e, con un `transforms` `request.headers` `set`, aggiunge `x-origin-secret` (come nella doc Vercel "Restricting your origin to Vercel traffic"; `set` sovrascrive un header mandato dal client). Il blocco `headers` di `vercel.json` (stessa sorgente `/api/(.*)`, come nella doc "Disabling caching for rewrites to external origins") risponde con `x-vercel-enable-rewrite-caching: 0`: le risposte del backend non finiscono mai nella cache del CDN (il backend manda anche `Cache-Control: no-store`). Le `routes` di `vercel.json` vengono prima del routing di Next: su Vercel il rewrite `/api` di `next.config.ts` non viene usato, resta per lo sviluppo locale e per `next start`.
- **Chiamate dal server**: partono dalle funzioni di Vercel direttamente verso `BACKEND_URL` e aggiungono `x-origin-secret` con `originHeaders()` (`src/lib/api-server.ts`). Sono tutte qui; una nuova chiamata dal server deve usare `apiServer` o `originHeaders()`:
  - `apiServer()` in `src/lib/api-server.ts` (tutte le pagine dell'app e il layout);
  - `hasSession()` in `src/app/(public)/login/page.tsx` (`/auth/me`, per il redirect di chi ha già la sessione);
  - la pagina `src/app/(public)/invite/page.tsx` (`/invitations/token/:token`).
- **Regione delle funzioni** vicina al backend (Project Settings → Functions → Function Region, es. `fra1` per un backend a Francoforte): ogni pagina dell'app fa una o più chiamate al backend dal server.
- **Backend**: `TRUST_PROXY=1` (l'edge di Vercel sovrascrive `x-forwarded-for` con l'IP reale del client), `CLIENT_URL` = dominio pubblico del sito, `ORIGIN_SECRET` uguale a quello del frontend.
- Dopo il primo deploy, con una Preview:
  - `curl -i https://<preview>/api/auth/me` → 401 JSON del backend (non 403: il segreto arriva), senza header di cache del CDN (`x-vercel-cache` assente o `MISS`);
  - `curl -i "https://<preview>/api/movies/search?q=alien&page=1"` con la sessione → i parametri della query arrivano al backend;
  - `curl -i -H "x-origin-secret: x" ${BACKEND_URL}/sub/api/auth/me` → 403: chi salta Vercel resta fuori;
  - nei log del backend, l'IP delle richieste da `/api` è quello del client.

## Comandi

- `npm run lint`, `npm run typecheck`, `npm run build` (serve anche `NEXT_PUBLIC_SITE_URL`, vedi Deploy)
- `npm run api:types`: rigenera `src/lib/api-types.d.ts` dall'OpenAPI del backend (`${BACKEND_URL:-http://localhost:5000}/docs/json`, disponibile fuori da production). Il file generato si committa. Le risposte si tipizzano con `operations["<operationId>"]` da lì, mai a mano.

## E2E (Playwright)

Una volta sola:

1. nel backend: crea il DB `cinofili_e2e`, `cp .env.e2e.example .env.e2e` con le credenziali locali, `yarn install && yarn build`;
2. qui: `npx playwright install chromium`.

Poi `npm run e2e`. Playwright avvia il backend (porta 5055, applica le migrazioni su `cinofili_e2e`) e `next dev` (porta 3055) e li riusa se sono già accesi. Il `next dev` degli e2e scrive in `.next-e2e` (`NEXT_DIST_DIR`): Next 16 non avvia un secondo `next dev` sulla stessa cartella, così gli e2e girano anche con `npm run dev` acceso. Ricompila il backend (`yarn build`) dopo averlo modificato. Ogni test parte da `seed(scenario)` (`e2e/helpers.ts`), che svuota e ricrea il DB e2e con `cinofili-be/scripts/e2e-seed.js`: gli scenari e i dati sono descritti in testa a quello script.

Gli e2e girano solo su Chromium con il viewport dell'iPhone 13 (`devices["iPhone 13"]`): WebKit/Safari non è coperto. Gli spec importano `test` ed `expect` da `e2e/helpers.ts`, non da `@playwright/test`: quel `test` dà a ogni test un `X-Forwarded-For` diverso, così i rate limit per IP del backend non si sommano. Il backend e2e ha `TRUST_PROXY=1`: Next è l'unico hop fra il test e il backend e inoltra l'`X-Forwarded-For` del test così com'è, quindi il backend legge proprio quel valore.

### Smoke di production

`npm run e2e:prod` (`playwright.prod.config.ts`, spec in `e2e-prod/`): fa `next build && next start` sulla porta 3056 con `BACKEND_URL=http://localhost:5055` e `NEXT_PUBLIC_SITE_URL=http://localhost:3056`, contro lo stesso backend e2e. Controlla home, login, redirect (proxy e `next` di `/login`), header di sicurezza, rewrite di `/api` e che `ORIGIN_SECRET` (impostato per la build) non compaia nei file statici del client. Non riusa un server già acceso sulla 3056: ogni giro ricompila.
