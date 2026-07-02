# Windows / Web Setup

## Requirements

- Node.js 20 or newer.
- npm.
- A local browser on the same machine.

## Install

```bash
npm install
```

## Run The Web App

```bash
npm run dev
```

Open the local URL printed by Next.js. The app stores prototype data in browser `localStorage` and server-side lecture files under `data/lectures/` when API routes write data.

## Validate

```bash
npm run typecheck
npm run lint
npm run build
```

`npm run build` currently succeeds with a known Turbopack NFT warning from `src/app/api/export-obsidian/route.ts`. The warning is caused by local filesystem write support for Obsidian export.

## Local-First Notes

- No account is required.
- No cloud sync is implemented.
- Audio and lecture data stay on the local machine unless manually synced over LAN.
