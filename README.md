# lembayung-cover-studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/artharium/lembayung-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/artharium/lembayung-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Lembayung Cover Studio** — turn your photos and a caption into GTA 6-style
multi-panel poster cover art, in your browser, fully offline. Your photos never
leave your machine. Export the cover as a PNG in 1080 × 1080, 1080 × 1350 or
1920 × 1080 — or all three in one click.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests. All fonts are vendored under `app/fonts/`
under the SIL Open Font License (Anton, Oswald, Kaushan Script, Teko). All
sample photos are original AI-generated images; no Rockstar Games logo,
artwork or fonts are used anywhere.

## How it works

1. **Add photos** — drop, paste, upload, or use the 10 sample photos.
2. **Caption** — title, script subtitle and tagline, in striped-gradient,
   hollow-outline or painted-flat lettering.
3. **Export PNG** — one size, or all three at once.

The cover engine (`app/src/cover.js`) draws 6 layouts (hero mosaic,
hero + three, six grid, diagonal trio, seven mosaic, full bleed), 8 colour
grades (Lembayung teal-gold is the default), a Poster Ink painted look,
per-panel crop / zoom / flip / swap with face focus points, role tags with a
location-and-time line, a quote bar, billing block, seal and barcode.

## Screenshots

`shots.json` lists the four deterministic scenes (`?shot=`): three different
covers (LEMBAYUNG, MIDNIGHT FERRY, TIDE & TROUBLE) and the editor.

---

<sub>Entered on [make.fun](https://make.fun/?ref=y8wkdpk8&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
