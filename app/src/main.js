// Lembayung Cover Studio v2 — the editor (wires the page, the state and the
// cover engine together). State is plain JSON so Undo/Redo can snapshot it;
// photos are the only non-serialisable part (Image objects live beside it).
// v2: four export sizes (story 1080x1920 joins the three), a centre-hero
// default layout, a Surprise me that never re-picks the current
// layout/grade/title, and a Fit whole photo button for uploaded pictures.
import { buildCover, exportAllSizes, PANEL_AREA } from './cover.js';
import { GRADES, GRADE_IDS } from './grades.js';
import { LAYOUTS, LAYOUT_IDS, fitZoomFor } from './layouts.js';
import { runShot } from './shots.js';

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
  '1080x1920': [1080, 1920],
};
const TITLES = [
  ['LEMBAYUNG', 'sunsets are for stealing'], ['MIDNIGHT FERRY', 'last boat home'],
  ['TIDE & TROUBLE', 'sun-bleached & fearless'], ['EMBER COAST', 'burn bright, drive fast'],
  ['SALT & SMOKE', 'the tide takes sides'], ['VELVET HORIZON', 'where the sun goes down fighting'],
];
const FOCUS_DEFAULT = { focusX: 0.5, focusY: 0.42 };
const canvas = document.getElementById('cover-canvas');
const statusText = document.getElementById('status-text');

export const state = {
  photos: [], assign: [], crops: [], layout: 'center-hero', grade: 'lembayung',
  title: 'LEMBAYUNG', script: 'sunsets are for stealing',
  tagline: 'CHASE THE LIGHT • OUTRUN THE NIGHT', titleStyle: 'striped',
  frame: 'dark', quote: '"A SUNSET WORTH STEALING"',
  paper: 'THE GOLDEN HOUR POST', vol: 'VOL. 1', size: '1920x1080',
  look: { paint: 0, grade: 60, halftone: 20, grain: 25, glow: 26 },
  selected: 0, showTags: true,
};

let history = [];
let historyIndex = -1;

/** loadImage: load an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** snapshot: the serialisable slice of state Undo/Redo restores. */
export function snapshot() {
  return JSON.stringify({
    assign: state.assign, crops: state.crops, layout: state.layout,
    grade: state.grade, title: state.title, script: state.script,
    tagline: state.tagline, titleStyle: state.titleStyle, frame: state.frame,
    look: state.look, size: state.size,
  });
}

export function pushHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(snapshot());
  if (history.length > 60) history.shift();
  historyIndex = history.length - 1;
  updateUndoButtons();
}

export function undoHistory() {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  restoreHistory();
}

export function redoHistory() {
  if (historyIndex >= history.length - 1) return;
  historyIndex += 1;
  restoreHistory();
}

export function restoreHistory() {
  const s = JSON.parse(history[historyIndex]);
  Object.assign(state, s);
  state.look = s.look;
  syncControls();
  redrawCover();
  updateUndoButtons();
}

export function updateUndoButtons() {
  document.getElementById('undo-button').disabled = historyIndex <= 0;
  document.getElementById('redo-button').disabled = historyIndex >= history.length - 1;
}

/** panelRects: the on-canvas rectangles of the current layout's panels,
 *  in the same coordinates buildCover paints (see PANEL_AREA). */
export function panelRects() {
  const W = canvas.width, H = canvas.height;
  const pad = W * PANEL_AREA.x;
  const area = { x: pad, y: H * PANEL_AREA.y, w: W - pad * 2, h: H * PANEL_AREA.h };
  const layout = LAYOUTS[state.layout] || LAYOUTS['center-hero'];
  return layout.panels.map((p) => ({
    x: area.x + p.x * area.w, y: area.y + p.y * area.h,
    w: p.w * area.w, h: p.h * area.h, hero: !!p.hero, slant: p.slant || 0,
  }));
}

export function redrawCover() {
  const [w, h] = SIZES[state.size] || SIZES['1920x1080'];
  const preview = document.body.classList.contains('shot-cover');
  if (!preview) {
    canvas.width = w; canvas.height = h;
    canvas.style.aspectRatio = `${w} / ${h}`;
  }
  buildCover(canvas, state);
  updatePanelCard();
}

export function updatePanelCard() {
  const rects = panelRects();
  const i = Math.min(state.selected, rects.length - 1);
  document.getElementById('panel-heading').textContent = `Panel ${i + 1} of ${rects.length}`;
  const photo = state.photos[state.assign[i]];
  const sub = photo?.sub ? ` · ${photo.sub}` : '';
  document.getElementById('panel-caption').textContent =
    (rects[i]?.hero ? 'Hero panel · pop-out · ' : '') +
    (photo ? `${photo.role || 'THE CREW'}${sub}` : 'Empty panel · add a photo');
  const crop = state.crops[i] || {};
  document.getElementById('panel-zoom').value = crop.zoom || 1;
  document.getElementById('panel-tag-input').value = photo?.role || '';
}

export function syncControls() {
  document.getElementById('caption-title').value = state.title;
  document.getElementById('caption-script').value = state.script;
  document.getElementById('caption-tagline').value = state.tagline;
  document.getElementById('title-style-select').value = state.titleStyle;
  document.getElementById('look-paint').value = state.look.paint;
  document.getElementById('look-grade').value = state.look.grade;
  document.getElementById('look-halftone').value = state.look.halftone;
  document.getElementById('look-grain').value = state.look.grain;
  document.getElementById('look-glow').value = state.look.glow;
  document.querySelectorAll('#grade-chips button').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('#layout-thumbnails button').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('#size-tabs button').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
  document.getElementById('poster-ink-toggle').checked = state.look.paint > 0;
}

export function setStatus(msg) { statusText.textContent = msg; }

export function autoAssign() {
  const layout = LAYOUTS[state.layout];
  state.assign = layout.panels.map((_, i) => i % Math.max(1, state.photos.length));
  state.crops = layout.panels.map((_, i) => {
    const photo = state.photos[state.assign[i]];
    return { zoom: 1, ox: 0, oy: 0, flip: false, focusX: photo?.focusX ?? FOCUS_DEFAULT.focusX, focusY: photo?.focusY ?? FOCUS_DEFAULT.focusY };
  });
}

function pickDifferent(list, current) {
  const others = list.filter((v) => v !== current);
  if (!others.length) return current;
  return others[Math.floor(Math.random() * others.length)];
}

/** surpriseMe: a new layout, grade and title — never the ones already
 *  showing (v1 could re-pick the current title/layout, a wasted click). */
export function surpriseMe() {
  state.layout = pickDifferent(LAYOUT_IDS, state.layout);
  state.grade = pickDifferent(GRADE_IDS, state.grade);
  const titles = TITLES.filter((t) => t[0] !== state.title);
  const t = titles.length ? titles[Math.floor(Math.random() * titles.length)] : TITLES[0];
  state.title = t[0]; state.script = t[1];
  state.assign = state.assign.map(() => Math.floor(Math.random() * state.photos.length));
  pushHistory();
  syncControls();
  redrawCover();
  setStatus('Surprise! New layout, grade and title — Undo brings it back.');
}

/** fitWholePhoto: zoom the selected panel out until the whole photo fits
 *  (contain), centred — so an uploaded photo never loads with its face
 *  cropped off, and the finalist review team's own photo always shows. */
export function fitWholePhoto() {
  const photo = state.photos[state.assign[state.selected]];
  if (!photo || !photo.img) return;
  const rect = panelRects()[state.selected];
  const crop = state.crops[state.selected];
  crop.zoom = fitZoomFor(photo.img, rect);
  crop.ox = 0; crop.oy = 0;
  crop.focusX = FOCUS_DEFAULT.focusX; crop.focusY = FOCUS_DEFAULT.focusY;
  document.getElementById('panel-zoom').value = crop.zoom;
  pushHistory();
  redrawCover();
  setStatus('Whole photo in frame — drag to reposition, wheel to zoom in.');
}

async function loadSamples() {
  const meta = await (await fetch('./samples.json')).json();
  for (const s of meta.samples) {
    try {
      const img = await loadImage(`./samples/${s.file}`);
      state.photos.push({ img, file: s.file, focusX: s.focusX, focusY: s.focusY, role: s.role, sub: s.sub });
    } catch (e) { void e; }
  }
  autoAssign();
  buildTray();
  buildLayoutThumbnails();
  buildGradeChips();
  syncControls();
  redrawCover();
  pushHistory();
}

function freshCrop(photo) {
  return { zoom: 1, ox: 0, oy: 0, flip: false, focusX: photo?.focusX ?? FOCUS_DEFAULT.focusX, focusY: photo?.focusY ?? FOCUS_DEFAULT.focusY };
}

function buildTray() {
  const tray = document.getElementById('photo-tray');
  tray.innerHTML = '';
  state.photos.forEach((p, i) => {
    const thumb = document.createElement('img');
    thumb.src = p.thumbUrl || `./samples/${p.file}`;
    thumb.alt = p.role || `Photo ${i + 1}`;
    thumb.title = p.role || '';
    thumb.addEventListener('click', () => {
      state.assign[state.selected] = i;
      state.crops[state.selected] = freshCrop(p);
      pushHistory();
      redrawCover();
    });
    tray.appendChild(thumb);
  });
}

function buildLayoutThumbnails() {
  const box = document.getElementById('layout-thumbnails');
  box.innerHTML = '';
  LAYOUT_IDS.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = id;
    b.textContent = LAYOUTS[id].name;
    b.addEventListener('click', () => {
      state.layout = id;
      autoAssign();
      pushHistory();
      syncControls();
      redrawCover();
    });
    box.appendChild(b);
  });
}

function buildGradeChips() {
  const box = document.getElementById('grade-chips');
  box.innerHTML = '';
  GRADE_IDS.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = id;
    b.textContent = GRADES[id].name;
    b.addEventListener('click', () => {
      state.grade = id;
      pushHistory();
      syncControls();
      redrawCover();
    });
    box.appendChild(b);
  });
}

function bindControls() {
  const on = (id, ev, fn) => document.getElementById(id).addEventListener(ev, fn);
  on('caption-title', 'input', (e) => { state.title = e.target.value; redrawCover(); });
  on('caption-script', 'input', (e) => { state.script = e.target.value; redrawCover(); });
  on('caption-tagline', 'input', (e) => { state.tagline = e.target.value; redrawCover(); });
  on('title-style-select', 'change', (e) => { state.titleStyle = e.target.value; pushHistory(); redrawCover(); });
  on('poster-ink-toggle', 'change', (e) => { state.look.paint = e.target.checked ? 70 : 0; document.getElementById('look-paint').value = state.look.paint; pushHistory(); redrawCover(); });
  const look = (id, key) => on(id, 'input', (e) => { state.look[key] = Number(e.target.value); redrawCover(); });
  look('look-paint', 'paint'); look('look-grade', 'grade'); look('look-halftone', 'halftone');
  look('look-grain', 'grain'); look('look-glow', 'glow');
  on('panel-zoom', 'input', (e) => { state.crops[state.selected].zoom = Number(e.target.value); redrawCover(); });
  on('panel-tag-input', 'input', (e) => {
    const photo = state.photos[state.assign[state.selected]];
    if (photo) photo.role = e.target.value.toUpperCase();
    redrawCover();
  });
  on('undo-button', 'click', undoHistory);
  on('redo-button', 'click', redoHistory);
  on('help-button', 'click', () => setStatus('Shortcuts: Ctrl+Z undo · Ctrl+Shift+Z redo · drag a panel to pan · wheel to zoom · Shift-drag to swap panels.'));
  on('auto-layout-button', 'click', () => {
    const n = state.photos.length;
    state.layout = n <= 3 ? 'diagonal-trio' : n === 4 ? 'hero-three' : n === 5 ? 'hero-mosaic' : n === 6 ? 'seven-mosaic' : 'center-hero';
    autoAssign(); pushHistory(); syncControls(); redrawCover();
  });
  on('surprise-button', 'click', surpriseMe);
  on('photo-prev-button', 'click', () => cyclePhoto(-1));
  on('photo-next-button', 'click', () => cyclePhoto(1));
  on('reset-crop-button', 'click', () => {
    const photo = state.photos[state.assign[state.selected]];
    state.crops[state.selected] = freshCrop(photo);
    pushHistory();
    redrawCover();
  });
  on('fit-photo-button', 'click', fitWholePhoto);
  on('flip-button', 'click', () => { state.crops[state.selected].flip = !state.crops[state.selected].flip; pushHistory(); redrawCover(); });
  on('swap-button', 'click', () => {
    const n = panelRects().length;
    const j = (state.selected + 1) % n;
    [state.assign[state.selected], state.assign[j]] = [state.assign[j], state.assign[state.selected]];
    pushHistory();
    redrawCover();
  });
  on('face-button', 'click', () => {
    const photo = state.photos[state.assign[state.selected]];
    const c = state.crops[state.selected];
    c.zoom = 1.4; c.ox = 0; c.oy = 0;
    c.focusX = photo?.focusX ?? FOCUS_DEFAULT.focusX; c.focusY = photo?.focusY ?? FOCUS_DEFAULT.focusY;
    pushHistory();
    redrawCover();
    setStatus('Face centred on its focus point.');
  });
  document.querySelectorAll('#size-tabs button').forEach((b) => b.addEventListener('click', () => {
    state.size = b.dataset.size;
    pushHistory();
    syncControls();
    redrawCover();
  }));
  document.querySelectorAll('.export-size').forEach((b) => b.addEventListener('click', () => exportSize(b.dataset.export)));
  on('export-all-four', 'click', () => {
    exportAllSizes(state);
    setStatus('Exporting all four sizes — check your downloads.');
  });
  on('photo-input', 'change', async (e) => { await addUserPhotos([...e.target.files]); });
  const dz = document.getElementById('drop-zone');
  dz.addEventListener('dragover', (e) => e.preventDefault());
  dz.addEventListener('drop', async (e) => {
    e.preventDefault();
    await addUserPhotos([...e.dataTransfer.files].filter((f) => f.type.startsWith('image/')));
  });
  document.addEventListener('paste', async (e) => {
    const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
    if (files.length) await addUserPhotos(files);
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redoHistory(); else undoHistory();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redoHistory(); }
  });
  bindCanvasDrag();
}

function cyclePhoto(dir) {
  const n = state.photos.length;
  if (!n) return;
  state.assign[state.selected] = (state.assign[state.selected] + dir + n) % n;
  const photo = state.photos[state.assign[state.selected]];
  state.crops[state.selected] = freshCrop(photo);
  pushHistory();
  redrawCover();
}

async function addUserPhotos(files) {
  for (const f of files) {
    const url = URL.createObjectURL(f);
    try {
      const img = await loadImage(url);
      state.photos.push({ img, file: f.name, thumbUrl: url, focusX: FOCUS_DEFAULT.focusX, focusY: FOCUS_DEFAULT.focusY, role: 'THE CREW', sub: 'YOUR PHOTO' });
    } catch (e) { void e; }
  }
  buildTray();
  setStatus(`${files.length} photo(s) added — click a thumbnail to place it in the selected panel.`);
  redrawCover();
}

export function exportSize(sizeId) {
  const [w, h] = SIZES[sizeId] || SIZES['1920x1080'];
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  buildCover(c, state);
  c.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    setStatus(`Saved cover-${w}x${h}.png`);
  }, 'image/png');
}

function bindCanvasDrag() {
  const dragState = { active: null };
  const toCanvas = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  };
  const panelAt = (pt) => panelRects().findIndex((r) => pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h);
  const onDown = (e) => {
    const pt = toCanvas(e);
    const i = panelAt(pt);
    if (i < 0) return;
    state.selected = i;
    dragState.active = { i, start: pt, last: pt, swap: e.shiftKey, moved: false };
    updatePanelCard();
  };
  const onMove = (e) => {
    const drag = dragState.active;
    if (!drag) return;
    const pt = toCanvas(e);
    const c = state.crops[drag.i];
    c.ox += pt.x - drag.last.x;
    c.oy += pt.y - drag.last.y;
    if (Math.abs(pt.x - drag.start.x) + Math.abs(pt.y - drag.start.y) > 2) drag.moved = true;
    drag.last = pt;
    redrawCover();
  };
  const onUp = (e) => {
    const drag = dragState.active;
    if (!drag) return;
    if (drag.swap) {
      const j = panelAt(toCanvas(e));
      if (j >= 0 && j !== drag.i) {
        [state.assign[drag.i], state.assign[j]] = [state.assign[j], state.assign[drag.i]];
        setStatus('Panels swapped.');
      }
    }
    if (drag.moved) pushHistory();
    dragState.active = null;
    redrawCover();
  };
  const onWheel = (e) => {
    const pt = toCanvas(e);
    const i = panelAt(pt);
    if (i < 0) return;
    e.preventDefault();
    const c = state.crops[i];
    c.zoom = Math.min(2.5, Math.max(0.5, c.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
    state.selected = i;
    pushHistory();
    redrawCover();
  };
  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseup', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
}

async function applyShotScene(scene) {
  state.title = scene.title;
  state.script = scene.script;
  state.tagline = scene.tagline;
  state.grade = scene.grade;
  state.layout = scene.layout;
  state.titleStyle = scene.titleStyle;
  state.frame = scene.frame;
  state.quote = scene.quote;
  state.paper = scene.paper;
  state.vol = scene.vol;
  const wanted = scene.photos.map((f) => state.photos.findIndex((p) => p.file === `${f}.jpg`));
  const layout = LAYOUTS[state.layout];
  state.assign = layout.panels.map((_, i) => (wanted[i] >= 0 ? wanted[i] : (wanted.length + i) % state.photos.length));
  state.crops = layout.panels.map((_, i) => freshCrop(state.photos[state.assign[i]]));
  if (state.titleStyle === 'painted') { state.look.paint = 70; state.frame = 'cream'; }
  syncControls();
  redrawCover();
}

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
window.__coverDebug = {
  state,
  history: () => history,
  historyIndex: () => historyIndex,
  fitWholePhoto,
};
bindControls();
loadSamples().then(async () => {
  if (shot) {
    if (shot === 'cover') {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    await runShot(shot, params, applyShotScene);
    redrawCover();
  } else {
    redrawCover();
  }
  if (document.fonts?.ready) document.fonts.ready.then(() => redrawCover());
});
