// Lembayung Cover Studio — the cover engine (canvas 2D).
// buildCover() draws a whole poster: panels, hero pop-out, grade, title,
// quote bar, role tags, billing block, seal and barcode. Title treatments:
// striped (solid Anton gradient), outline (hollow chrome), painted (flat).
import { GRADES, applyGrade, applyPosterInk } from './grades.js';
import { LAYOUTS, cropPanel } from './layouts.js';

export function buildCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const grade = GRADES[state.grade] || GRADES.lembayung;
  const look = state.look || {};
  ctx.clearRect(0, 0, W, H);
  const frame = state.frame === 'cream' ? '#f5eeda' : grade.frame;
  ctx.fillStyle = frame;
  ctx.fillRect(0, 0, W, H);
  const pad = W * 0.016;
  const panelArea = { x: pad, y: H * 0.07, w: W - pad * 2, h: H * 0.60 };
  const layout = LAYOUTS[state.layout] || LAYOUTS['hero-mosaic'];
  const panels = layout.panels;
  drawPanels(ctx, state, panels, panelArea, grade, look);
  cutoutHero(ctx, state, panels, panelArea, grade, look);
  if ((look.paint ?? 0) > 0) applyPosterInk(ctx, W, H, state.grade, (look.paint ?? 0) / 100);
  drawQuoteBar(ctx, state, W, H, grade);
  drawTitleBlock(ctx, state, W, H, grade, look);
  drawBillingBlock(ctx, state, W, H, grade);
  drawSeal(ctx, W, H, grade, look);
  drawBarcode(ctx, W, H);
  drawGrain(ctx, W, H, look.grain ?? 0.25);
  drawVignette(ctx, W, H);
  return canvas;
}

export function drawPanels(ctx, state, panels, area, grade, look) {
  panels.forEach((p, i) => {
    const photo = state.photos[state.assign[i]];
    if (!photo || !photo.img) return;
    const rect = {
      x: area.x + p.x * area.w, y: area.y + p.y * area.h,
      w: p.w * area.w, h: p.h * area.h,
    };
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

export function cutoutHero(ctx, state, panels, area, grade, look) {
  const hi = panels.findIndex((p) => p.hero);
  if (hi < 0) return;
  const photo = state.photos[state.assign[hi]];
  if (!photo || !photo.img) return;
  const p = panels[hi];
  const rect = {
    x: area.x + p.x * area.w, y: area.y + p.y * area.h,
    w: p.w * area.w, h: p.h * area.h,
  };
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = rect.w * 0.06;
  ctx.shadowOffsetY = rect.w * 0.02;
  const over = rect.h * 0.03;
  const big = { x: rect.x - rect.w * 0.015, y: rect.y - over, w: rect.w * 1.03, h: rect.h + over };
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
  if (state.showTags !== false) drawRoleTag(ctx, state, hi, big, grade);
}

export function exportAllSizes(state) {
  const sizes = [
    { w: 1080, h: 1080, name: 'cover-1080x1080.png' },
    { w: 1080, h: 1350, name: 'cover-1080x1350.png' },
    { w: 1920, h: 1080, name: 'cover-1920x1080.png' },
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
    }, i * 450);
  });
}

export function drawTitleStriped(ctx, text, x, y, size, grade) {
  ctx.save();
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#14060f';
  ctx.lineWidth = size * 0.16;
  ctx.strokeText(text, x, y);
  const grad = ctx.createLinearGradient(0, y - size * 0.55, 0, y + size * 0.55);
  const bands = 9;
  for (let i = 0; i <= bands; i++) {
    const t = i / bands;
    const c = i % 3 === 0 ? grade.titleA : i % 3 === 1 ? grade.titleB : grade.titleC;
    grad.addColorStop(t, i % 2 === 0 ? c : '#14060f');
  }
  ctx.fillStyle = grad;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawTitleOutline(ctx, text, x, y, size, grade) {
  ctx.save();
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.shadowColor = grade.titleC;
  ctx.shadowBlur = size * 0.12;
  ctx.strokeStyle = grade.titleA;
  ctx.lineWidth = size * 0.045;
  ctx.strokeText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(10,4,18,0.25)';
  ctx.fillText(text, x, y);
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

export function drawRoleTag(ctx, state, i, rect, grade) {
  const photo = state.photos[state.assign[i]];
  if (!photo) return;
  const fs = Math.max(11, rect.w * 0.045);
  const label = (photo.role || 'THE CREW').toUpperCase();
  ctx.save();
  ctx.font = `700 ${fs}px Oswald, sans-serif`;
  const w = ctx.measureText(label).width + fs * 1.1;
  const x = rect.x + rect.w * 0.03;
  const y = rect.y + rect.h - fs * 2.1;
  ctx.fillStyle = 'rgba(10,4,16,0.88)';
  ctx.fillRect(x, y, w, fs * 1.5);
  ctx.fillStyle = grade.titleC;
  ctx.fillRect(x, y, fs * 0.28, fs * 1.5);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + fs * 0.55, y + fs * 0.78);
  if (photo.sub) {
    ctx.font = `500 ${fs * 0.62}px Oswald, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(photo.sub.toUpperCase(), x + fs * 0.1, y - fs * 0.55);
  }
  ctx.restore();
}

export function drawQuoteBar(ctx, state, W, H, grade) {
  const q = state.quote || '"DUSK HAS NEVER LOOKED THIS GOOD"';
  const paper = state.paper || 'THE LEMBAYUNG GAZETTE';
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

export function drawBillingBlock(ctx, state, W, H, grade) {
  const cream = state.frame === 'cream';
  ctx.save();
  ctx.font = `500 ${Math.max(12, H * 0.0145)}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = cream ? '#5b4636' : 'rgba(255,247,230,0.92)';
  ctx.fillText('A LEMBAYUNG PICTURE  •  STARRING YOU  •  SHOT ON YOUR OWN CAMERA  •  NOTHING UPLOADED', W / 2, H * 0.955);
  ctx.fillStyle = cream ? '#92400e' : grade.titleC;
  ctx.font = `600 ${Math.max(12, H * 0.015)}px Teko, sans-serif`;
  ctx.fillText((state.tagline || 'FIVE FRIENDS  •  ONE COAST  •  NO WAY BACK').toUpperCase(), W / 2, H * 0.925);
  ctx.fillStyle = cream ? '#5b4636' : 'rgba(255,247,230,0.75)';
  ctx.font = `500 ${Math.max(11, H * 0.013)}px Oswald, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('COMING SOON', W * 0.095, H * 0.985);
  ctx.restore();
}

export function drawSeal(ctx, W, H, grade, look) {
  const r = Math.max(26, W * 0.038);
  const cx = W - r - W * 0.018, cy = H * 0.86;
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
  void look;
}

export function drawBarcode(ctx, W, H) {
  const bw = W * 0.055, bh = H * 0.032;
  const x = W * 0.016, y = H * 0.978 - bh;
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 4, y - 4, bw + 8, bh + 8);
  ctx.fillStyle = '#111';
  let px = x;
  let seed = 7;
  while (px < x + bw - 3) {
    seed = (seed * 37 + 11) % 97;
    const wdt = 1 + (seed % 3);
    if (seed % 2) ctx.fillRect(px, y, wdt, bh);
    px += wdt + 1 + (seed % 2);
  }
  ctx.restore();
}

export function drawGrain(ctx, W, H, amount) {
  if (amount <= 0) return;
  ctx.save();
  ctx.globalAlpha = 0.05 * amount * 4;
  let seed = 42;
  const n = Math.floor(W * H / 9000);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < n; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = (seed % 1000) / 1000 * W;
    seed = (seed * 16807) % 2147483647;
    const y = (seed % 1000) / 1000 * H;
    ctx.fillRect(x, y, 1.4, 1.4);
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
  const y = H * 0.795;
  let size = H * 0.115;
  ctx.font = `${size}px Anton, sans-serif`;
  while (ctx.measureText(title).width > W * 0.94 && size > 20) {
    size -= 4;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  if (state.titleStyle === 'outline') drawTitleOutline(ctx, title, W / 2, y, size, grade);
  else drawTitleStriped(ctx, title, W / 2, y, size, grade);
  drawHalftone(ctx, W * 0.05, y - size * 0.6, W * 0.9, size * 1.2, (look.halftone ?? 20) / 100);
  if (state.script) drawScriptSubtitle(ctx, state.script, W / 2, y + size * 0.72, size * 0.42, grade, state.frame === 'cream' ? '#92400e' : undefined);
}

function panelPath(ctx, rect, slant) {
  const s = (slant || 0) * rect.w;
  ctx.beginPath();
  ctx.moveTo(rect.x + s, rect.y);
  ctx.lineTo(rect.x + rect.w + s, rect.y);
  ctx.lineTo(rect.x + rect.w - s, rect.y + rect.h);
  ctx.lineTo(rect.x - s, rect.y + rect.h);
  ctx.closePath();
}

function applyGradeToRect(ctx, rect, slant, gradeId, strength) {
  ctx.save();
  panelPath(ctx, rect, slant);
  ctx.clip();
  const off = document.createElement('canvas');
  off.width = Math.max(2, Math.ceil(rect.w));
  off.height = Math.max(2, Math.ceil(rect.h));
  const octx = off.getContext('2d');
  octx.drawImage(ctx.canvas, rect.x, rect.y, rect.w, rect.h, 0, 0, off.width, off.height);
  applyGrade(octx, off.width, off.height, gradeId, strength);
  ctx.drawImage(off, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
