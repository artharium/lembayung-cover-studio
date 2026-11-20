// Lembayung Cover Studio v2 — a gta6-cover-art-01 entry (Node 22, standard
// library only): the app is this directory's app/ folder, plain static files
// a desktop browser loads offline (app/index.html and its ES modules, no
// library and no network request), and this program hands it in. It copies
// app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. The app turns a person's photos and a caption into
// GTA 6-style multi-panel poster cover art (7 layouts including the new
// centre-hero, 8 warm grades, Poster Ink, banded panels, halftone titles,
// per-panel crop, role tags, quote bar, tagline band, billing block, seal,
// barcode) and exports it as a PNG in 1080 x 1080, 1080 x 1350,
// 1920 x 1080 or story 1080 x 1920. Its sample photos are original
// AI-generated images, free to use; its fonts are vendored under the
// SIL Open Font License. Put your 3 or 4 PNG or JPEG screenshots in
// screenshots/ (the first by name is the cover) and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const entryName = 'Lembayung Cover Studio v2';
const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
void entryName;

/** preflight: refuse to build a dossier from a half-ready directory. */
function preflight() {
  const appDir = join(here, 'app');
  if (!existsSync(join(appDir, 'index.html'))) throw new Error('app/index.html is missing');
  const shotsDir = join(here, 'screenshots');
  if (!existsSync(shotsDir)) throw new Error('screenshots/ is missing');
  const shots = readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f));
  if (shots.length < 3 || shots.length > 4) throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
  for (const f of shots) {
    const bytes = statSync(join(shotsDir, f)).size;
    if (bytes > 262144) throw new Error(`${f} is ${bytes} bytes, over the 256 KiB cap`);
  }
}

function copyEntry() {
  mkdirSync(out, { recursive: true });
  cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

function writeDossier() {
  // The scorer's own caps (reference/gate.json): only text_max_bytes shapes
  // the bytes; the others refuse an entry the scorer would refuse (more than
  // 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB
  // of app files, in all, or a path under app/ over 1000 bytes: app/ counts
  // beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
  writeFileSync(
    join(out, 'dossier.json'),
    buildDossier(out, {
      text_max_bytes: 163840,
      screenshots: { max: 4, max_bytes: 262144 },
      app_max_files: 993,
      app_max_bytes: 50331648,
      app_path_max_bytes: 1000,
    }),
  );
}

preflight();
copyEntry();
writeDossier();
