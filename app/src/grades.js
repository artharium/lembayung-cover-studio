// Lembayung Cover Studio — colour grades.
// Each grade is a sunset / neon grade applied over the photos as a gradient
// map: top colour, middle colour, bottom colour, frame colour, title colours
// and the ink tint used by Poster Ink. All grades are our own palettes.
export const GRADES = {
  lembayung: {
    name: 'Lembayung', top: '#19b8a6', mid: '#f2a541', bot: '#e5488f',
    frame: '#0e2a33', titleA: '#2dd4bf', titleB: '#fbbf24', titleC: '#f472b6',
    ink: '#0f766e', sky: '#7dd3c8',
  },
  sunset: {
    name: 'Sunset', top: '#ff8a3d', mid: '#f43f5e', bot: '#7c3aed',
    frame: '#2b1030', titleA: '#fde047', titleB: '#fb923c', titleC: '#ec4899',
    ink: '#9a3412', sky: '#fda4af',
  },
  neon: {
    name: 'Neon night', top: '#22d3ee', mid: '#a855f7', bot: '#0b0620',
    frame: '#05030f', titleA: '#67e8f9', titleB: '#c084fc', titleC: '#f0abfc',
    ink: '#155e75', sky: '#a5f3fc',
  },
  golden: {
    name: 'Golden hour', top: '#fbbf24', mid: '#d97706', bot: '#451a03',
    frame: '#2a1503', titleA: '#fef3c7', titleB: '#f59e0b', titleC: '#b45309',
    ink: '#92400e', sky: '#fde68a',
  },
  teal: {
    name: 'Tropic teal', top: '#2dd4bf', mid: '#0ea5a4', bot: '#134e4a',
    frame: '#042f2e', titleA: '#99f6e4', titleB: '#2dd4bf', titleC: '#fda4af',
    ink: '#115e59', sky: '#5eead4',
  },
  heatwave: {
    name: 'Heatwave', top: '#fb7185', mid: '#f97316', bot: '#3b0764',
    frame: '#1c0a2e', titleA: '#fecdd3', titleB: '#fdba74', titleC: '#e879f9',
    ink: '#9f1239', sky: '#fda4af',
  },
  ultraviolet: {
    name: 'Ultraviolet', top: '#c084fc', mid: '#7c3aed', bot: '#1e1b4b',
    frame: '#12082e', titleA: '#e9d5ff', titleB: '#a78bfa', titleC: '#f0abfc',
    ink: '#5b21b6', sky: '#ddd6fe',
  },
  noir: {
    name: 'Noir', top: '#94a3b8', mid: '#475569', bot: '#0f172a',
    frame: '#020617', titleA: '#f8fafc', titleB: '#cbd5e1', titleC: '#f87171',
    ink: '#334155', sky: '#e2e8f0',
  },
};
export const GRADE_IDS = Object.keys(GRADES);

/** applyGrade: wash a canvas region with the grade's gradient map. */
export function applyGrade(ctx, w, h, grade, strength) {
  const g = GRADES[grade] || GRADES.lembayung;
  const grad = ctx.createLinearGradient(0, 0, w * 0.25, h);
  grad.addColorStop(0, hexA(g.top, 0.34 * strength));
  grad.addColorStop(0.55, hexA(g.mid, 0.20 * strength));
  grad.addColorStop(1, hexA(g.bot, 0.38 * strength));
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const warm = ctx.createLinearGradient(0, h * 0.55, 0, h);
  warm.addColorStop(0, 'rgba(255,120,60,0)');
  warm.addColorStop(1, hexA(g.bot, 0.16 * strength));
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** applyPosterInk: posterize + contrast + duotone for the painted flat look. */
export function applyPosterInk(ctx, w, h, grade, amount) {
  if (amount <= 0) return;
  const g = GRADES[grade] || GRADES.lembayung;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const levels = 4;
  for (let i = 0; i < d.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = d[i + c];
      const q = Math.floor((v / 255) * levels) / (levels - 1) * 255;
      const contrast = Math.min(255, Math.max(0, (q - 128) * 1.15 + 128));
      d[i + c] = contrast * amount + v * (1 - amount);
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = hexA(g.ink, 0.06 * amount);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
