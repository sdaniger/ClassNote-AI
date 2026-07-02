# Local LAN Sync

## Scope

Sync is local-first and same-Wi-Fi only. There are no accounts, cloud buckets, hosted databases, or external sync providers.

## Windows/Web APIs

- `GET /api/sync/health`
- `POST /api/sync/pair`
- `GET /api/sync/lectures`
- `POST /api/sync/lectures`
- `POST /api/sync/lectures/[id]/files`
- `POST /api/sync/lectures/[id]/refine`
- `POST /api/sync/lectures/[id]/updates`

## Pairing

The Windows/Web sync screen generates a local QR payload with the base URL and a startup pairing token. Mobile scans this payload and sends sync requests with the token.

## Conflict Guidance

- Prefer Windows for `desktop_final` transcript and regenerated notes.
- Prefer mobile for local title/course/marker edits when no desktop refinement happened.
- If both sides changed important fields, ask the user to choose.

## Storage

Received lectures are stored under `data/lectures/{lectureId}/` on the Windows/Web side.
