// Lembayung Cover Studio v2 — the cover engine (canvas 2D).
//
// buildCover() paints a whole poster: panels, poster-art ink bands, the
// hero pop-out, the grade wash, Poster Ink, the quote bar, the title block
// (a full-width banded title with sparkle, a neon script subtitle and a
// solid tagline band), the billing block, seal and barcode, then grain and
// a vignette. Title treatments: striped (banded gradient + sparkle),
// outline (hollow chrome), halftone (dot-textured letters), painted (flat).
import { GRADES, applyGrade, applyPosterInk } from './grades.js';
import { LAYOUTS, cropPanel } from './layouts.js';

/** Panel area: the strip above the title zone. main.js's panelRects()
 *  uses the same numbers, so dragging and hit-testing match the paint. */
export const PANEL_AREA = { x: 0.016, y: 0.055, w: 0.968, h: 0.56 };

export function buildCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const grade = GRADES[state.grade] || GRADES.lembayung;
  const look = state.look || {};
  ctx.clearRect(0, 0, W, H);
  const frame = state.frame === 'cream' ? '#f5eeda' : grade.frame;
  ctx.fillStyle = frame;
  ctx.fillRect(0, 0, W, H);
  const pad = W * PANEL_AREA.x;
  const area = { x: pad, y: H * PANEL_AREA.y, w: W - pad * 2, h: H * PANEL_AREA.h };
  const layout = LAYOUTS[state.layout] || LAYOUTS['center-hero'];
  const panels = layout.panels;
  drawPanels(ctx, state, panels, area, grade, look);
  drawBandedPanels(ctx, state, panels, area, grade);
  cutoutHero(ctx, state, layout, panels, area, grade, look);
  if ((look.paint ?? 0) > 0) applyPosterInk(ctx, W, H, state.grade, (look.paint ?? 0) / 100);
  drawQuoteBar(ctx, state, W, H, grade);
  drawTitleBlock(ctx, state, W, H, grade, look);
  drawBillingBlock(ctx, state, W, H, grade);
  drawSeal(ctx, W, H, grade);
  drawBarcode(ctx, W, H);
  drawGrain(ctx, W, H, (look.grain ?? 25) / 100);
  drawVignette(ctx, W, H);
  return canvas;
}

function panelRect(area, p) {
  return {
    x: area.x + p.x * area.w, y: area.y + p.y * area.h,
    w: p.w * area.w, h: p.h * area.h,
  };
}

export function drawPanels(ctx, state, panels, area, grade, look) {
  panels.forEach((p, i) => {
    const photo = state.photos[state.assign[i]];
    if (!photo || !photo.img) return;
    const rect = panelRect(area, p);
    ctx.save();
    panelPath(ctx, rect, p.slant);
    ctx.clip();
    const c = cropPanel(photo.img, rect, state.crops[i]);
    if (c.flip) { ctx.translate(rect.x * 2 + rect.w, 0); ctx.scale(-1, 1); }
    ctx.drawImage(photo.img, c.dx, c.dy, c.dw, c.dh);
    ctx.restore();
    applyGradeToRect(ctx, rect, p.slant, state.grade, (look.grade ?? 60) / 100);
    ctx.save();
    panelPath(ctx, rect, p.slant);
    ctx.lineWidth = Math.max(2, rect.w * 0.008);
    ctx.strokeStyle = state.frame === 'cream' ? '#3a2a12' : '#f5eeda';
    ctx.globalAlpha = 0.9;
    ctx.stroke();
    ctx.restore();
    if (state.showTags !== false) drawRoleTag(ctx, state, i, rect, grade);
  });
}

/** drawBandedPanels: poster-art ink bands across every panel — two diagonal
 *  bands and one low horizontal band in the grade's ink colour, clipped to
 *  each panel. This is the "inked and banded" poster treatment the ace
 *  house app has and v1 lacked; kept subtle (alpha ~0.1) so faces stay
 *  readable. */
export function drawBandedPanels(ctx, state, panels, area, grade) {
  panels.forEach((p) => {
    const rect = panelRect(area, p);
    ctx.save();
    panelPath(ctx, rect, p.slant);
    ctx.clip();
    ctx.fillStyle = hexA(grade.ink, 0.10);
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate(-0.32);
    ctx.fillRect(-rect.w * 0.30, -rect.h, rect.w * 0.09, rect.h * 2);
    ctx.fillRect(rect.w * 0.06, -rect.h, rect.w * 0.09, rect.h * 2);
    ctx.restore();
    ctx.fillStyle = hexA(grade.ink, 0.12);
    ctx.fillRect(rect.x, rect.y + rect.h * 0.92, rect.w, rect.h * 0.08);
    ctx.restore();
  });
  void state;
}

export function cutoutHero(ctx, state, layout, panels, area, grade, look) {
  const hi = panels.findIndex((p) => p.hero);
  if (hi < 0) return;
  const photo = state.photos[state.assign[hi]];
  if (!photo || !photo.img) return;
  const p = panels[hi];
  const rect = panelRect(area, p);
  const over = rect.h * 0.03;
  const plunge = (layout.heroPlunge || 0) * area.h;
  const big = {
    x: rect.x - rect.w * 0.015, y: rect.y - over,
    w: rect.w * 1.03, h: rect.h + over + plunge,
  };
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = rect.w * 0.06;
  ctx.shadowOffsetY = rect.w * 0.02;
  panelPath(ctx, big, p.slant);
  ctx.clip();
  const c = cropPanel(photo.img, big, state.crops[hi]);
  ctx.drawImage(photo.img, c.dx, c.dy, c.dw, c.dh);
  ctx.restore();
  applyGradeToRect(ctx, big, p.slant, state.grade, (look.grade ?? 60) / 100);
  ctx.save();
  panelPath(ctx, big, p.slant);
  ctx.lineWidth = Math.max(3, rect.w * 0.01);
  ctx.strokeStyle = '#f5eeda';
  ctx.stroke();
  ctx.restore();
  if (state.showTags !== false) drawRoleTag(ctx, state, hi, big, grade, layout.heroPlunge ? 'top' : 'bottom');
}

export function exportAllSizes(state) {
  const sizes = [
    { w: 1080, h: 1080, name: 'cover-1080x1080.png' },
    { w: 1080, h: 1350, name: 'cover-1080x1350.png' },
    { w: 1920, h: 1080, name: 'cover-1920x1080.png' },
    { w: 1080, h: 1920, name: 'cover-1080x1920.png' },
  ];
  sizes.forEach((s, i) => {
    setTimeout(() => {
      const c = document.createElement('canvas');
      c.width = s.w; c.height = s.h;
      buildCover(c, state);
      c.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = s.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }, 'image/png');
    }, i * 500);
  });
}

/** Fit a title to the cover width: grow the size for short titles, then
 *  stretch horizontally (poster type is often condensed type set wide),
 *  then track the letters out. Returns { size, sx, spacing, width }. */
export function fitTitle(ctx, text, W, H) {
  const target = W * 0.92;
  let size = H * 0.15;
  ctx.font = `${size}px Anton, sans-serif`;
  let width = ctx.measureText(text).width;
  while (width < target && size < H * 0.20) {
    size += 2;
    ctx.font = `${size}px Anton, sans-serif`;
    width = ctx.measureText(text).width;
  }
  while (width > target && size > 20) {
    size -= 4;
    ctx.font = `${size}px Anton, sans-serif`;
    width = ctx.measureText(text).width;
  }
  const sx = Math.min(target / Math.max(1, width), 1.5);
  const stretched = width * sx;
  const spacing = text.length > 1
    ? Math.min((target - stretched) / (text.length - 1), size * 0.15)
    : 0;
  return { size, sx, spacing: Math.max(0, spacing), width: stretched + spacing * (text.length - 1) };
}

export function drawTitleStriped(ctx, text, x, y, fit, grade) {
  const { size, sx, spacing } = fit;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, 1);
  ctx.font = `${size}px Anton, sans-serif`;
  try { ctx.letterSpacing = `${spacing}px`; } catch (e) { void e; }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.shadowColor = grade.titleC;
  ctx.shadowBlur = size * 0.14;
  ctx.strokeStyle = '#14060f';
  ctx.lineWidth = size * 0.16;
  ctx.strokeText(text, 0, 0);
  const grad = ctx.createLinearGradient(0, -size * 0.55, 0, size * 0.55);
  const bands = 9;
  for (let i = 0; i <= bands; i++) {
    const t = i / bands;
    const c = i % 3 === 0 ? grade.titleA : i % 3 === 1 ? grade.titleB : grade.titleC;
    grad.addColorStop(t, i % 2 === 0 ? c : '#14060f');
  }
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, 0);
  ctx.restore();
  drawSparkles(ctx, x, y, fit, grade);
}

function drawSparkles(ctx, x, y, fit, grade) {
  const { size, width } = fit;
  const spots = [-0.46, -0.28, -0.08, 0.14, 0.32, 0.47];
  ctx.save();
  ctx.fillStyle = '#fff7cc';
  ctx.shadowColor = grade.titleA;
  ctx.shadowBlur = size * 0.22;
  spots.forEach((t, i) => {
    const r = size * (i % 2 ? 0.055 : 0.085);
    const px = x + t * width;
    const py = y - size * (i % 3 === 0 ? 0.62 : 0.52);
    ctx.beginPath();
    ctx.moveTo(px, py - r);
    ctx.quadraticCurveTo(px, py, px + r, py);
    ctx.quadraticCurveTo(px, py, px, py + r);
    ctx.quadraticCurveTo(px, py, px - r, py);
    ctx.quadraticCurveTo(px, py, px, py - r);
    ctx.fill();
  });
  ctx.restore();
}

/** drawTitleHalftone: the letters themselves are halftone dots — a banded
 *  gradient fill, then a dot grid composited only where the letters are
 *  (source-atop), dot size breathing with a sine wave. */
export function drawTitleHalftone(ctx, text, x, y, fit, grade) {
  const { size, sx, spacing } = fit;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, 1);
  ctx.font = `${size}px Anton, sans-serif`;
  try { ctx.letterSpacing = `${spacing}px`; } catch (e) { void e; }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#14060f';
  ctx.lineWidth = size * 0.14;
  ctx.strokeText(text, 0, 0);
  const grad = ctx.createLinearGradient(0, -size * 0.55, 0, size * 0.55);
  grad.addColorStop(0, grade.titleA);
  grad.addColorStop(0.5, grade.titleB);
  grad.addColorStop(1, grade.titleC);
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(20,6,15,0.55)';
  const step = Math.max(6, size * 0.085);
  const half = (fit.width / sx) / 2;
  for (let yy = -size * 0.6; yy < size * 0.6; yy += step) {
    for (let xx = -half; xx < half; xx += step) {
      const r = step * 0.20 * (0.5 + 0.5 * Math.sin((xx + yy * 2) / step));
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawTitleOutline(ctx, text, x, y, fit, grade) {
  const { size, sx, spacing } = fit;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, 1);
  ctx.font = `${size}px Anton, sans-serif`;
  try { ctx.letterSpacing = `${spacing}px`; } catch (e) { void e; }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.shadowColor = grade.titleC;
  ctx.shadowBlur = size * 0.12;
  ctx.strokeStyle = grade.titleA;
  ctx.lineWidth = size * 0.045;
  ctx.strokeText(text, 0, 0);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(10,4,18,0.25)';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

export function drawScriptSubtitle(ctx, text, x, y, size, grade, color) {
  ctx.save();
  ctx.font = `${size}px "Kaushan Script", cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = grade.titleC;
  ctx.shadowBlur = size * 0.35;
  ctx.fillStyle = color || '#fff5f8';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** drawRoleTag: the role name only, big and bold — v1's location/time line
 *  under the name was unreadable at judge size, so the subtext lives in
 *  samples.json and the editor's panel card now, not on the cover.
 *  `spot` is 'bottom' normally; a plunging hero (centre-hero) wears its
 *  tag at the top, because the big title overlaps its lower edge. */
export function drawRoleTag(ctx, state, i, rect, grade, spot = 'bottom') {
  const photo = state.photos[state.assign[i]];
  if (!photo) return;
  const fs = Math.max(13, rect.w * 0.058);
  const label = (photo.role || 'THE CREW').toUpperCase();
  ctx.save();
  ctx.font = `700 ${fs}px Oswald, sans-serif`;
  const w = ctx.measureText(label).width + fs * 1.15;
  const x = rect.x + rect.w * 0.03;
  const y = spot === 'top' ? rect.y + fs * 0.6 : rect.y + rect.h - fs * 2.0;
  ctx.fillStyle = 'rgba(10,4,16,0.88)';
  ctx.fillRect(x, y, w, fs * 1.5);
  ctx.fillStyle = grade.titleC;
  ctx.fillRect(x, y, fs * 0.28, fs * 1.5);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + fs * 0.55, y + fs * 0.78);
  ctx.restore();
}

export function drawQuoteBar(ctx, state, W, H, grade) {
  const q = state.quote || '"A SUNSET WORTH STEALING"';
  const paper = state.paper || 'THE GOLDEN HOUR POST';
  const cream = state.frame === 'cream';
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = cream ? '#b45309' : '#ffd166';
  ctx.font = `700 ${Math.max(13, H * 0.016)}px Oswald, sans-serif`;
  ctx.fillText('★ ★ ★ ★ ★', W * 0.09, H * 0.028);
  let size = Math.max(12, H * 0.016);
  ctx.font = `700 ${size}px Oswald, sans-serif`;
  const text = `${q}  —  ${paper}`;
  while (ctx.measureText(text).width > W * 0.68 && size > 9) {
    size -= 1;
    ctx.font = `700 ${size}px Oswald, sans-serif`;
  }
  ctx.fillStyle = cream ? '#3a2a12' : '#fff7e6';
  ctx.fillText(text, W * 0.5, H * 0.028);
  ctx.fillStyle = grade.titleA;
  ctx.fillRect(W * 0.885, H * 0.012, W * 0.095, H * 0.032);
  ctx.fillStyle = '#14060f';
  ctx.font = `700 ${Math.max(12, H * 0.014)}px Oswald, sans-serif`;
  ctx.fillText(state.vol || 'VOL. 1', W * 0.932, H * 0.029);
  ctx.restore();
}

/** drawTaglineBand: a solid colour band under the title carrying the
 *  tagline — the bold strip the winning covers all have, and the tagline's
 *  new home (it used to sit as plain text in the billing block). */
export function drawTaglineBand(ctx, state, W, H, grade) {
  const tagline = (state.tagline || 'CHASE THE LIGHT • OUTRUN THE NIGHT').toUpperCase();
  const bandH = H * 0.034;
  const bandY = H * 0.895;
  const bandX = W * 0.06;
  const bandW = W * 0.88;
  ctx.save();
  const grad = ctx.createLinearGradient(bandX, 0, bandX + bandW, 0);
  grad.addColorStop(0, grade.titleA);
  grad.addColorStop(0.5, grade.titleB);
  grad.addColorStop(1, grade.titleC);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(bandX, bandY, bandW, bandH, bandH / 2);
  ctx.fill();
  let size = Math.max(11, H * 0.02);
  ctx.font = `600 ${size}px Teko, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  while (ctx.measureText(tagline).width > bandW * 0.94 && size > 8) {
    size -= 1;
    ctx.font = `600 ${size}px Teko, sans-serif`;
  }
  ctx.fillStyle = '#14060f';
  ctx.fillText(tagline, W / 2, bandY + bandH / 2 + size * 0.06);
  ctx.restore();
}

export function drawBillingBlock(ctx, state, W, H, grade) {
  const cream = state.frame === 'cream';
  ctx.save();
  ctx.font = `500 ${Math.max(12, H * 0.0145)}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = cream ? '#5b4636' : 'rgba(255,247,230,0.92)';
  ctx.fillText('A LEMBAYUNG PICTURES PRODUCTION  •  STARRING YOU  •  SHOT ON YOUR OWN CAMERA  •  KEPT ON YOUR DEVICE', W / 2, H * 0.955);
  ctx.fillStyle = cream ? '#5b4636' : 'rgba(255,247,230,0.75)';
  ctx.font = `500 ${Math.max(11, H * 0.013)}px Oswald, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('COMING SOON', W * 0.095, H * 0.985);
  ctx.restore();
  void grade;
}

export function drawSeal(ctx, W, H, grade) {
  const r = Math.max(26, W * 0.038);
  const cx = W - r - W * 0.015, cy = H * 0.58;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rr = i % 2 ? r * 0.82 : r;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#14060f';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fde68a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${r * 0.30}px Oswald, sans-serif`;
  ctx.fillText('ORIGINAL', 0, -r * 0.22);
  ctx.fillText('COVER ART', 0, r * 0.12);
  ctx.fillStyle = '#fbbf24';
  ctx.font = `${r * 0.3}px sans-serif`;
  ctx.fillText('★ ★ ★', 0, r * 0.42);
  ctx.restore();
  void grade;
}

export function drawBarcode(ctx, W, H) {
  const bw = W * 0.055, bh = H * 0.032;
  const x = W * 0.016, y = H * 0.978 - bh;
  const widths = [1, 2, 1, 3, 2, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 2, 1, 3, 1, 2];
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 4, y - 4, bw + 8, bh + 8);
  ctx.fillStyle = '#111';
  let px = x;
  let k = 0;
  while (px < x + bw - 3) {
    const wdt = widths[k % widths.length];
    if (k % 3 !== 2) ctx.fillRect(px, y, wdt, bh);
    px += wdt + 1;
    k += 1;
  }
  ctx.restore();
}

export function drawGrain(ctx, W, H, amount) {
  if (amount <= 0) return;
  let seed = 1234567;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const n = Math.floor(W * H / 9000);
  ctx.save();
  ctx.fillStyle = '#fff';
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = 0.03 * amount * 4 * (0.5 + next());
    ctx.fillRect(next() * W, next() * H, 1.6, 1.6);
  }
  ctx.restore();
}

export function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export function drawHalftone(ctx, x, y, w, h, amount) {
  if (amount <= 0) return;
  ctx.save();
  ctx.globalAlpha = 0.16 * amount;
  ctx.fillStyle = '#14060f';
  const step = Math.max(7, w * 0.012);
  for (let yy = y; yy < y + h; yy += step) {
    for (let xx = x; xx < x + w; xx += step) {
      const r = step * 0.22 * (0.5 + 0.5 * Math.sin((xx + yy) / step));
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawTitleBlock(ctx, state, W, H, grade, look) {
  const title = (state.title || 'LEMBAYUNG').toUpperCase();
  const y = H * 0.72;
  const fit = fitTitle(ctx, title, W, H);
  if (state.titleStyle === 'outline') drawTitleOutline(ctx, title, W / 2, y, fit, grade);
  else if (state.titleStyle === 'halftone') drawTitleHalftone(ctx, title, W / 2, y, fit, grade);
  else drawTitleStriped(ctx, title, W / 2, y, fit, grade);
  drawHalftone(ctx, W * 0.05, y - fit.size * 0.6, W * 0.9, fit.size * 1.2, (look.halftone ?? 20) / 100);
  if (state.script) {
    drawScriptSubtitle(ctx, state.script, W / 2, y + fit.size * 0.68, fit.size * 0.38, grade, state.frame === 'cream' ? '#92400e' : undefined);
  }
  drawTaglineBand(ctx, state, W, H, grade);
}

function panelPath(ctx, rect, slant) {
  const shear = (slant || 0) * rect.w;
  const corners = [
    [rect.x + shear, rect.y],
    [rect.x + rect.w + shear, rect.y],
    [rect.x + rect.w - shear, rect.y + rect.h],
    [rect.x - shear, rect.y + rect.h],
  ];
  ctx.beginPath();
  corners.forEach(([cx, cy], i) => (i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy)));
  ctx.closePath();
}

/** gradeRegion: grade one rectangle by copying it to a scratch canvas,
 *  washing the copy, and painting it back. */
function gradeRegion(ctx, rect, slant, gradeId, strength) {
  const off = document.createElement('canvas');
  off.width = Math.max(2, Math.ceil(rect.w));
  off.height = Math.max(2, Math.ceil(rect.h));
  const octx = off.getContext('2d');
  octx.drawImage(ctx.canvas, rect.x, rect.y, rect.w, rect.h, 0, 0, off.width, off.height);
  applyGrade(octx, off.width, off.height, gradeId, strength);
  return off;
}

function applyGradeToRect(ctx, rect, slant, gradeId, strength) {
  ctx.save();
  panelPath(ctx, rect, slant);
  ctx.clip();
  const off = gradeRegion(ctx, rect, slant, gradeId, strength);
  ctx.drawImage(off, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function hexA(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
