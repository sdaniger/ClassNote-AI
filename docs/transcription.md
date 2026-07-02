# Transcription

## Current State

Transcription is implemented behind service boundaries and currently uses local mock output. This keeps the UI, storage, sync, and conflict flows testable without bundling large native models.

## Mobile Boundary

- `apps/mobile/src/services/transcription/mobileTranscription.ts`
- `apps/mobile/src/services/transcription/transcriptionModels.ts`
- `apps/mobile/src/services/transcription/transcriptStorage.ts`

Mobile transcripts are treated as `mobile_draft`.

## Windows Boundary

Windows/Web refinement is represented by the sync refinement route and service. The intended replacement is a local `faster-whisper` process that reads synced audio and writes `desktop_final` transcript JSON.

## Target Flow

1. Record on mobile.
2. Generate a fast draft transcript on device.
3. Sync to Windows on the same Wi-Fi.
4. Run higher accuracy Windows transcription.
5. Write `transcript.desktop_final.json` and update `transcript.json`.
6. Regenerate notes and Markdown.
7. Send the final result back to mobile.

## Privacy

No transcription request is sent to a cloud API in the current implementation.
