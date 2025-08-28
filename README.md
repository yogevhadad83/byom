# BYOM Monorepo

This repo contains a BYOM SDK and a React chat app that uses it.

## Getting Started

```bash
npm install
npm run dev
```

The dev script builds the SDK in watch mode and starts the Vite dev server for the app at http://localhost:5173.

The chat app calls the BYOM API using a Vite env var `VITE_BYOM_API_BASE` and (in dev/preview) proxies `/api` to `SAAS_BASE_URL`:
Set in `apps/byom-chat/.env`:

```
VITE_BYOM_API_BASE=/api # or full URL like https://byom-api.onrender.com
VITE_SUPABASE_URL=... # your Supabase Project URL
VITE_SUPABASE_ANON_KEY=... # your Supabase anon key

# For dev/preview proxy (Node server and Vite dev proxy):
SAAS_BASE_URL=https://byom-api.onrender.com
```

## Build

```bash
npm run build
```

## Preview

For a production-style preview (e.g., on Render), run:

```bash
npm start
```

This builds the packages and starts the Node server with Socket.IO.

## Type Checking and Linting

```bash
npm run typecheck
npm run lint
```

## Publishing the SDK

```bash
cd packages/byom-sdk
npm version patch
npm publish --access public
```

## Using the SDK in Your App

```tsx
import { BYOMProvider, useBYOM } from "@byom/sdk";

// Wrap your app
<BYOMProvider baseUrl={import.meta.env.SAAS_BASE_URL} getAccessToken={async () => (await supabase.auth.getSession()).data.session?.access_token ?? null}>
  <App />
</BYOMProvider>;

// Register a provider and invoke
const { registerProvider, invoke } = useBYOM();
```
