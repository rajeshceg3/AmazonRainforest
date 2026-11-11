# Feature map - AmazonRainforest

| Feature | Entry point | Proven by |
| --- | --- | --- |
| Procedural 360 rainforest scenes | `src/`, region selector | verification/check.cjs: per-scene drag/reset + keyboard reset, real Chromium |
| Accessible controls (opt-in sound/motion, theme, 14px floor, no overflow) | `index.html` controls | verification/check.cjs assertions |
| Production build | `vite.config.*` | `npm run build` in verify skill |

The automated proof lives in `.cursor/skills/verify-amazon-rainforest/`.
