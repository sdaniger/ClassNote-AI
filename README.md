# ClassNote AI

Local-first lecture recording and study assistant prototype for Windows/Web and Expo mobile.

## Quick Start

```bash
npm install
npm run dev
```

Mobile:

```bash
npm run mobile:start
```

Validation:

```bash
npm run typecheck
npm run mobile:typecheck
npm run lint
npm run build
```

## Documentation

- [Windows / Web setup](docs/setup-windows.md)
- [Mobile setup](docs/setup-mobile.md)
- [Transcription architecture](docs/transcription.md)
- [Obsidian export](docs/obsidian.md)
- [Local LAN sync](docs/sync.md)
- [Troubleshooting](docs/troubleshooting.md)

## Privacy Model

- No cloud sync.
- No accounts.
- No external transcription or LLM API calls in the current implementation.
- Audio and lecture data are local unless manually synced over LAN.

## Mobile Local Transcription

The mobile app is under `apps/mobile` and is designed for Expo + React Native.

Current implementation:

- Records lecture audio on device with Expo AV.
- Saves audio under `DocumentDirectory/lectures/{lectureId}/audio/lecture.m4a`.
- Saves transcript JSON under `DocumentDirectory/lectures/{lectureId}/transcript/transcript.json`.
- Keeps mobile transcription as `mobile_draft`.
- Does not send audio to any cloud API.

### whisper.rn / whisper.cpp Setup

The transcription service boundary is implemented in:

- `apps/mobile/src/services/transcription/mobileTranscription.ts`
- `apps/mobile/src/services/transcription/transcriptionModels.ts`
- `apps/mobile/src/services/transcription/transcriptStorage.ts`

The current backend is a mock local implementation so the Expo managed UI and storage flow can be tested immediately. For real on-device transcription, replace the mock section in `transcribeLectureOnDevice` with `whisper.rn` or another whisper.cpp React Native binding.

Typical setup for a native Whisper module:

1. Install the native package, for example `whisper.rn`, in `apps/mobile`.
2. Create an Expo dev build because native Whisper modules do not run in Expo Go.
3. Place model files such as `ggml-tiny.bin`, `ggml-base.bin`, or `ggml-small.bin` in the app bundle or download them to app storage.
4. Map model choices in `transcriptionModels.ts` to the actual model file paths.
5. Call the native transcribe function inside `transcribeLectureOnDevice` and convert results to `TranscriptSegment[]`.

### Model Guidance

- `tiny`: fastest, best for long lectures and low-end devices.
- `base`: default balance for mobile draft transcription.
- `small`: better draft quality, slower and more memory intensive.

### Platform Notes

- iOS requires microphone permission and a dev build for native Whisper modules.
- Android requires `RECORD_AUDIO` and may require ABI-specific native libraries.
- Large models can cause memory pressure. If transcription fails, retry with `tiny`.
- Mobile transcripts are draft quality. Windows sync should later run a higher-accuracy desktop model and update status to `desktop_final`.

## Local LAN Sync

ClassNote sync is local-first. Lecture audio is not uploaded to cloud services.

Current implementation:

- Windows/Web side exposes local sync APIs under `/api/sync/*`.
- Pairing uses a startup-generated `pairingToken`.
- Mobile scans the QR payload from the Windows sync screen.
- Mobile sends lecture metadata, audio, transcript, and markers to the Windows server on the same Wi-Fi.
- Windows stores received lectures under `data/lectures/{lectureId}/`.

### Usage

1. Open the Windows/Web sync screen.
2. Press `サーバー起動`.
3. Confirm the QR code and local URL are shown.
4. Open the mobile app sync screen.
5. Allow camera access and scan the QR code.
6. Select an unsynced lecture or press `すべて同期`.
7. Confirm the received lecture appears on the Windows sync screen.
8. If the lecture is `mobile_draft`, use `Windowsで高精度再文字起こし` as the next processing step.

### Security Notes

- Requests without the current `pairingToken` are rejected.
- The token changes when the Windows server process restarts.
- File and lecture IDs are sanitized before writing to disk.
- This is intended for same-Wi-Fi local network use only.
- Cloud sync, accounts, QR conflict handling, and multi-Windows conflict resolution are not implemented yet.

## Windows Refinement And Conflict Resolution

After a mobile lecture is synced to Windows, Windows can turn the mobile draft into a higher quality final version.

### High Accuracy Flow

1. Record a lecture on mobile.
2. Run lightweight on-device mobile transcription.
3. Sync the lecture to Windows over the same Wi-Fi.
4. On the Windows sync screen, press `Windowsで高精度再文字起こし` for `mobile_draft` lectures.
5. Windows backs up `transcript.mobile_draft.json` and writes `transcript.desktop_final.json` plus the latest `transcript.json`.
6. Windows regenerates `lecture-note.desktop_final.json`, `lecture-note.json`, and `lecture-note.md`.
7. On mobile, open the sync screen and check for Windows updates.
8. Receive the `desktop_final` transcript and notes back to the phone.

The current implementation uses a local mock refinement backend. It is structured so the existing or future `faster-whisper` process can replace the mock refinement step without changing the mobile sync UI.

### Conflict Resolution

A conflict can happen when both mobile and Windows changed the same lecture after the last sync.

- Prefer Windows when the transcript or generated notes were refined on Windows.
- Prefer mobile when only title, course, or markers were edited on the phone.
- If unsure, the UI asks: `どちらを最新版にしますか？` and offers Windows or mobile.

Each lecture keeps a lightweight version history with:

- `version`
- `lastSyncedAt`
- `lastModifiedDevice`
- `versions[]`

This is not a full diff merge system. Advanced field-by-field merging and multi-device conflict resolution are intentionally left for a later stage.
