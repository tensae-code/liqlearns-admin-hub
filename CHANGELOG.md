# Changelog

## Unreleased

### Added

- Added TURN/ICE configuration helper at `src/lib/webrtcConfig.ts`. Supports VITE_TURN_URLS, VITE_TURN_USERNAME, VITE_TURN_CREDENTIAL environment variables.
- Exposed RTCPeerConnection and ICE connection states in the call context and UI to aid troubleshooting.
- Implemented a connecting timeout warning (Sonner toast) when calls stay in `connecting` state and no TURN servers are configured.

### Changed

- Switched hard-coded STUN servers to use `getIceServers()` across WebRTC components (CallContext and useWebRTC).
- PPTX parser now detects slide background images (not just inline shapes) and surfaces them as `ParsedSlide.backgroundImage`. Thumbnails and slide rendering use background images when present.
- Slide rendering now applies background images as CSS background (cover/center/no-repeat) and uses background color fallback.

### Tests

- Added unit tests for background-image extraction in `src/lib/__tests__/pptxParser.test.ts`.

### Notes

- Ensure `VITE_TURN_URLS` (comma-separated), `VITE_TURN_USERNAME`, and `VITE_TURN_CREDENTIAL` are set in your Vite environment for TURN support.
- The connecting-timeout warning requires `sonner` to be present and the `Toast` provider to be mounted.
