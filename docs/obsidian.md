# Obsidian Export

## Current State

The app can generate Markdown from lecture metadata, transcript segments, markers, summaries, study cards, and quizzes.

## Settings

- `Vault name`: used for Obsidian URI links.
- `Vault path`: used by local filesystem export APIs.
- `Default export folder`: folder inside the vault.
- `Markdown template`: placeholder for future template selection.
- `Export transcript full text`: includes full transcript text.
- `Export quiz`: includes generated quiz content.
- `Export markers`: includes lecture markers.

## Export Modes

- Download Markdown from the browser.
- Open an Obsidian URI.
- Write to a local vault path through the local API route.

## Known Warning

`npm run build` can print a Turbopack NFT warning for `src/app/api/export-obsidian/route.ts`. Build still succeeds. The route intentionally touches local filesystem APIs for vault export.
