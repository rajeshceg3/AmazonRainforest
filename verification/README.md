# World verification

This repair replaces the stalled, malformed animal render with a lighter procedural illustration. It does not claim photographic realism, a surveyed location, live weather or field-guide species accuracy.

## Inventory

The previous scene had a forest floor, river, canopy, vines, rocks, water lilies, jaguar, river dolphin, sloth, macaw, frogs, hummingbirds and butterflies, plus dense rain, fireflies, falling leaves, clouds and post-processing. Its animal skeletons raised runtime errors and its initial phone scene stalled.

The new scene provides nine explicit views: river clearing, jaguar, dolphin, sloth, macaw, frog, hummingbird, butterfly and water lilies. Forest, river, canopy, vines and leaf litter form the shared habitat. High-density particle effects, lightning and remote environment lighting are not in this lighter path. The legacy implementations remain in source for future art work. This is an intentional performance/art tradeoff that requires visual review before merge.

## Executed checks

- 108 combinations: nine views x three widths (320/390/1440) x two control themes x normal/reduced motion.
- Real pointer drag followed by canonical Reset, and keyboard Home reset, in every combination.
- No horizontal overflow or page errors in those runs; controls/captions at least 14px.
- 125 actual glyph masks compared to the rendered backdrop. Minimum contrast 6.91:1. See `contrast.json`.
- Semantic entry button; sound stays off on entry. Actual 14-second output captured from the browser, off disposes the soundscape, and replay succeeds without delayed callback errors. Subjective listening quality is not yet signed off.
- Build and changed-file lint passed. The final phone note treatment was separately checked at 320px.

`check.cjs` runs the live Chromium interaction checks. `TEST_URL` targets a preview/live deployment; omit it to start the local production preview. `WIDTH` and `MOTION` select a CI matrix cell. The GitHub workflow publishes screenshots from every cell.

## Species notes

Jaguar, dolphin and sloth text was checked against:

- https://www.worldwildlife.org/species/jaguar
- https://www.worldwildlife.org/species/amazon-river-dolphin
- https://www.worldwildlife.org/species/sloth

Other creature and botanical notes describe the illustration rather than asserting an exact species or provenance.
