# Verify AmazonRainforest
Amazon Rainforest Immersive Experience - accessible 360 low-poly scenes (vite + React + three.js).
## Launch
`npm install`, then `npm run dev` (or `npm run build && npm run preview`).
## Doctor
`python3 .cursor/skills/verify-amazon-rainforest/verify.py` - takes a few minutes (real Chromium scene runs).
## Drive
Builds with vite, then runs the repo's own verification/check.cjs in headless Chromium: real drag followed by canonical Reset per scene, keyboard/Home reset, opt-in sound/motion, 14px label floor, no horizontal overflow. Default matrix is 390px/dark with both motion preferences via VERIFY_WIDTH/VERIFY_THEMES; unset for the full matrix.
## Evidence
`.cursor/skills/verify-amazon-rainforest/evidence.json` plus pixel proofs under `verification/pixels/`.
## Cleanup
The check kills its preview server.
## Known boundaries
Subjective audio/visual quality unverified; contrast samples live in verification/contrast.json from a separate recorded run.
