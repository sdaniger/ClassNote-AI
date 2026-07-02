# Mobile Setup

## Requirements

- Expo tooling.
- iOS Simulator, Android Emulator, or a physical device.
- The mobile package under `apps/mobile`.

## Run

```bash
npm run mobile:start
```

## Validate

```bash
npm run mobile:typecheck
```

## Current Capabilities

- Records lecture audio with Expo AV.
- Stores lecture metadata with AsyncStorage.
- Stores audio and transcript files in Expo file storage.
- Supports QR-based LAN pairing with the Windows/Web app.
- Generates mock mobile draft transcripts and live insights locally.

## Native Build Notes

Expo Go can run the current prototype. Real native Whisper, background recording, and OS notifications require an Expo dev build or bare/native configuration.
