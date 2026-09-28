# before-you-dispatch-web

Frontend for **Before You Dispatch**: the vendor dashboard, the customer confirmation page, and the rider page (three views, one app). See [CLAUDE.md](CLAUDE.md) for full product context and scope.

Stack: Next.js (App Router), TypeScript, Tailwind CSS. Talks to [before-you-dispatch-api](../before-you-dispatch-api); the endpoints it calls are documented in that repo's `API.md`.

## Requirements

- Node.js 20 or newer
- Yarn 1.x (`npm install -g yarn`)
- The API running locally (see its README), or a deployed API URL

## Setup

```bash
git clone <repo-url> before-you-dispatch-web
cd before-you-dispatch-web
yarn install
cp .env.local.example .env.local   # point API_URL at the API
yarn dev
```

Open http://localhost:3000.

The browser never calls the API directly: it calls `/api/...` on this app, and `next.config.ts` forwards those requests to `API_URL`. So the app and the API share one address (no CORS in the browser, one tunnel for phone testing).

## Test on a real phone (ngrok)

Phones only share their location with `https://` pages, so test the customer and rider pages through an ngrok tunnel:

```bash
# with the API (yarn dev in before-you-dispatch-api) and this app (yarn dev) running
ngrok http 3000
```

Open the `https://….ngrok-free.app` address ngrok prints, on your laptop, and create orders from there: the customer and rider links are built from the address you're on, so they'll use the tunnel too. Send a link to your phone and open it. ngrok's free plan shows a one-time "You are about to visit" page first; tap **Visit Site**.

Stop the tunnel (Ctrl+C) when you're done: while it runs, anyone with the address can reach your local app.

## Routes

| Route                 | Who      | What                                         |
| --------------------- | -------- | -------------------------------------------- |
| `/vendor`             | Vendor   | Dashboard of today's orders                  |
| `/vendor/orders/new`  | Vendor   | Create order form                            |
| `/vendor/orders/[id]` | Vendor   | One order: customer link, then rider link    |
| `/confirm/[token]`    | Customer | "Are you ready?", then pin and landmark      |
| `/rider/[token]`      | Rider    | Delivery details and outcome                 |

## Scripts

| Script       | What it does                     |
| ------------ | -------------------------------- |
| `yarn dev`   | Starts the dev server on :3000   |
| `yarn build` | Production build                 |
| `yarn start` | Serves the production build      |
| `yarn lint`  | Runs ESLint                      |

## Environment variables

| Variable  | Purpose                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------- |
| `API_URL` | Base URL of the API, e.g. `http://localhost:4000` locally. Server-side only (read by `next.config.ts`). The old name `NEXT_PUBLIC_API_URL` still works. |
