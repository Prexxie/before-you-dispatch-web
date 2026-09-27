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
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_URL at the API
yarn dev
```

Open http://localhost:3000. The API's `CORS_ORIGIN` must include this origin.

## Routes

| Route              | Who       | What                                     |
| ------------------ | --------- | ---------------------------------------- |
| `/vendor`          | Vendor    | Create order form and delivery dashboard |
| `/confirm/[token]` | Customer  | "Are you ready?", then pin and landmark  |
| `/rider/[token]`   | Rider     | Delivery details and outcome             |

## Scripts

| Script       | What it does                     |
| ------------ | -------------------------------- |
| `yarn dev`   | Starts the dev server on :3000   |
| `yarn build` | Production build                 |
| `yarn start` | Serves the production build      |
| `yarn lint`  | Runs ESLint                      |

## Environment variables

| Variable              | Purpose                                                     |
| --------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of the API, e.g. `http://localhost:4000` locally   |
