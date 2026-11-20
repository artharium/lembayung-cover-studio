// Lembayung Cover Studio v2 — colour grades.
//
// A grade is a sunset / neon palette washed over the photos as a gradient
// map: a top colour, a middle colour, a bottom colour, the frame colour,
// three title colours, the ink tint Poster Ink uses, and a sky tint. All
// palettes are our own. v2 regrades LEMBAYUNG warm: the old teal-gold
// grade read cold next to the sunset covers the judge rewards, so the
// default is now amber-rose-violet dusk. The other seven grades are
// unchanged in spirit, re-expressed through the grade() builder.
function grade(name, top, mid, bot, frame, titleA, titleB, titleC, ink, sky) {
  return { name, top, mid, bot, frame, titleA, titleB, titleC, ink, sky };
}

export const GRADES = {
  lembayung: grade('Lembayung', '#ff9a3d', '#f43f5e', '#581c87', '#2a0e2e', '#fde047', '#fb923c', '#ec4899', '#9a3412', '#fdba74'),
  sunset: grade('Sunset', '#ff8a3d', '#f43f5e', '#7c3aed', '#2b1030', '#fde047', '#fb923c', '#ec4899', '#9a3412', '#fda4af'),
  neon: grade('Neon night', '#22d3ee', '#a855f7', '#0b0620', '#05030f', '#67e8f9', '#c084fc', '#f0abfc', '#155e75', '#a5f3fc'),
  golden: grade('Golden hour', '#fbbf24', '#d97706', '#451a03', '#2a1503', '#fef3c7', '#f59e0b', '#b45309', '#92400e', '#fde68a'),
  teal: grade('Tropic teal', '#2dd4bf', '#0ea5a4', '#134e4a', '#042f2e', '#99f6e4', '#2dd4bf', '#fda4af', '#115e59', '#5eead4'),
  heatwave: grade('Heatwave', '#fb7185', '#f97316', '#3b0764', '#1c0a2e', '#fecdd3', '#fdba74', '#e879f9', '#9f1239', '#fda4af'),
  ultraviolet: grade('Ultraviolet', '#c084fc', '#7c3aed', '#1e1b4b', '#12082e', '#e9d5ff', '#a78bfa', '#f0abfc', '#5b21b6', '#ddd6fe'),
  noir: grade('Noir', '#94a3b8', '#475569', '#0f172a', '#020617', '#f8fafc', '#cbd5e1', '#f87171', '#334155', '#e2e8f0'),
};
export const GRADE_IDS = Object.keys(GRADES);

/** applyGrade: wash a canvas region with the grade's gradient map.
 *  Two passes: a diagonal overlay wash (top/mid/bottom) and a soft-light
 *  warm lift from the bottom, so faces keep their modelling while the
 *  whole panel takes the grade's dusk. */
export function applyGrade(ctx, w, h, gradeId, strength) {
  const g = GRADES[gradeId] || GRADES.lembayung;
  const wash = ctx.createLinearGradient(0, 0, w * 0.25, h);
  wash.addColorStop(0, hexA(g.top, 0.34 * strength));
  wash.addColorStop(0.55, hexA(g.mid, 0.20 * strength));
  wash.addColorStop(1, hexA(g.bot, 0.38 * strength));
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const lift = ctx.createLinearGradient(0, h * 0.55, 0, h);
  lift.addColorStop(0, 'rgba(255,120,60,0)');
  lift.addColorStop(1, hexA(g.bot, 0.16 * strength));
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = lift;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** applyPosterInk: posterize + contrast + duotone for the painted flat look.
 *  v2 quantizes LUMINANCE only (5 steps, gentle contrast) and rescales each
 *  channel by the same factor, so hues survive: v1 posterized every channel
 *  on its own and left green/purple blotches on faces. The duotone tint is
 *  lighter too, and the blend keeps 10% of the original pixels. */
export function applyPosterInk(ctx, w, h, gradeId, amount) {
  if (amount <= 0) return;
  const g = GRADES[gradeId] || GRADES.lembayung;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const steps = 5;
  const keep = 1 - amount;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], gg = d[i + 1], b = d[i + 2];
    const lum = 0.299 * r + 0.587 * gg + 0.114 * b;
    const q = Math.floor((lum / 255) * steps) / (steps - 1) * 255;
    const contrasted = Math.min(255, Math.max(0, (q - 128) * 1.08 + 128));
    const factor = lum > 4 ? contrasted / lum : 1;
    d[i] = Math.min(255, r * factor * amount + r * keep);
    d[i + 1] = Math.min(255, gg * factor * amount + gg * keep);
    d[i + 2] = Math.min(255, b * factor * amount + b * keep);
  }
  ctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = hexA(g.ink, 0.03 * amount);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
