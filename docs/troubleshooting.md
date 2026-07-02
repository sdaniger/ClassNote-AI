# Troubleshooting

## TypeScript Fails

Run:

```bash
npm run typecheck
npm run mobile:typecheck
```

Check whether the failing file belongs to the web app or `apps/mobile` workspace.

## Lint Fails

Run:

```bash
npm run lint
```

Fix unused imports first. The app uses service boundaries heavily, so unused prototype imports often indicate an unfinished integration.

## Build Warning About NFT List

If the warning points to `src/app/api/export-obsidian/route.ts`, this is currently expected. The build should still complete.

## Mobile Cannot Scan QR

- Confirm camera permission was granted.
- Confirm Windows/Web and mobile are on the same Wi-Fi.
- Restart the Windows/Web dev server and scan the new QR code because pairing tokens change on restart.

## Sync Request Is Rejected

- Re-pair with the current QR code.
- Check the local URL and port.
- Confirm no firewall is blocking local network access.

## Transcription Looks Fake

That is expected in the current prototype. Real Whisper integration is intentionally isolated behind transcription service files.
