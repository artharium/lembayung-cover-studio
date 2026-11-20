// Lembayung Cover Studio — fixed scenes for screenshots.
// ?shot=cover draws the cover alone (body.shot-cover hides the editor);
// ?shot=editor shows the editor with a sample cover loaded.
// Params: photos (comma list of sample names), title, script, tagline,
// grade, layout, titleStyle, frame, quote, paper, vol. window.__shotReady
// is set once the cover is painted and the fonts are ready.
export async function runShot(shot, query, applyScene) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const scene = {
    photos: (query.get('photos') || 'woman-convertible,man-rooftop,friends-neon,woman-motorbike,man-boat').split(','),
    title: query.get('title') || 'LEMBAYUNG',
    script: query.get('script') || 'dusk never waits',
    tagline: query.get('tagline') || 'FIVE FRIENDS • ONE COAST • NO WAY BACK',
    grade: query.get('grade') || 'lembayung',
    layout: query.get('layout') || 'hero-mosaic',
    titleStyle: query.get('titleStyle') || 'striped',
    frame: query.get('frame') || 'dark',
    quote: query.get('quote') || '"DUSK HAS NEVER LOOKED THIS GOOD"',
    paper: query.get('paper') || 'THE LEMBAYUNG GAZETTE',
    vol: query.get('vol') || 'VOL. 1',
  };
  await applyScene(scene);
  try { await document.fonts.ready; } catch (e) { void e; }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
