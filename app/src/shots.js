// Lembayung Cover Studio v2 — fixed scenes for screenshots.
// ?shot=cover draws the cover alone (body.shot-cover hides the editor);
// ?shot=editor shows the editor with a sample cover loaded.
// Params: photos (comma list of sample names), title, script, tagline,
// grade, layout, titleStyle, frame, quote, paper, vol. window.__shotReady
// is set once the cover is painted and the fonts are ready.
//
// The v2 default scene is the new cover A: centre-hero layout, warm
// Lembayung grade, banded striped title, fresh caption lines.
const DEFAULT_SCENE = {
  photos: 'woman-convertible,man-rooftop,friends-neon,woman-motorbike,man-boat,woman-beach,dog-owner',
  title: 'LEMBAYUNG',
  script: 'sunsets are for stealing',
  tagline: 'CHASE THE LIGHT • OUTRUN THE NIGHT',
  grade: 'lembayung',
  layout: 'center-hero',
  titleStyle: 'striped',
  frame: 'dark',
  quote: '"A SUNSET WORTH STEALING"',
  paper: 'THE GOLDEN HOUR POST',
  vol: 'VOL. 1',
};

function sceneFromQuery(query) {
  const scene = { ...DEFAULT_SCENE };
  for (const key of Object.keys(DEFAULT_SCENE)) {
    const value = query.get(key);
    if (value !== null && value !== '') scene[key] = value;
  }
  scene.photos = scene.photos.split(',');
  return scene;
}

export async function runShot(shot, query, applyScene) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await applyScene(sceneFromQuery(query));
  try { await document.fonts.ready; } catch (e) { void e; }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
