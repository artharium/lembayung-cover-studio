// Lembayung Cover Studio — cover layouts.
// A layout is a set of panels in normalised coordinates (0..1 of the panel
// area, which is the cover above the title zone). `slant` shears a panel's
// edges for the diagonal GTA poster look; `hero` marks the pop-out panel.
export const LAYOUTS = {
  'hero-mosaic': {
    name: 'Hero mosaic',
    panels: [
      { x: 0.015, y: 0.0, w: 0.54, h: 1.0, slant: 0, hero: true },
      { x: 0.565, y: 0.0, w: 0.205, h: 0.48, slant: 0 },
      { x: 0.78, y: 0.0, w: 0.205, h: 0.48, slant: 0 },
      { x: 0.565, y: 0.52, w: 0.205, h: 0.48, slant: 0 },
      { x: 0.78, y: 0.52, w: 0.205, h: 0.48, slant: 0 },
    ],
  },
  'hero-three': {
    name: 'Hero + three',
    panels: [
      { x: 0.015, y: 0.0, w: 0.58, h: 1.0, slant: 0.02, hero: true },
      { x: 0.61, y: 0.0, w: 0.375, h: 0.31, slant: -0.02 },
      { x: 0.61, y: 0.345, w: 0.375, h: 0.31, slant: -0.02 },
      { x: 0.61, y: 0.69, w: 0.375, h: 0.31, slant: -0.02 },
    ],
  },
  'six-grid': {
    name: 'Six grid',
    panels: [
      { x: 0.015, y: 0.0, w: 0.32, h: 0.48, slant: 0 },
      { x: 0.345, y: 0.0, w: 0.32, h: 0.48, slant: 0, hero: true },
      { x: 0.675, y: 0.0, w: 0.31, h: 0.48, slant: 0 },
      { x: 0.015, y: 0.52, w: 0.32, h: 0.48, slant: 0 },
      { x: 0.345, y: 0.52, w: 0.32, h: 0.48, slant: 0 },
      { x: 0.675, y: 0.52, w: 0.31, h: 0.48, slant: 0 },
    ],
  },
  'diagonal-trio': {
    name: 'Diagonal trio',
    panels: [
      { x: 0.015, y: 0.0, w: 0.36, h: 1.0, slant: 0.07, hero: true },
      { x: 0.345, y: 0.0, w: 0.36, h: 1.0, slant: 0.07 },
      { x: 0.675, y: 0.0, w: 0.31, h: 1.0, slant: 0.07 },
    ],
  },
  'seven-mosaic': {
    name: 'Seven mosaic',
    panels: [
      { x: 0.015, y: 0.0, w: 0.42, h: 0.62, slant: 0, hero: true },
      { x: 0.445, y: 0.0, w: 0.27, h: 0.30, slant: 0 },
      { x: 0.725, y: 0.0, w: 0.26, h: 0.30, slant: 0 },
      { x: 0.445, y: 0.32, w: 0.27, h: 0.30, slant: 0 },
      { x: 0.725, y: 0.32, w: 0.26, h: 0.30, slant: 0 },
      { x: 0.015, y: 0.65, w: 0.485, h: 0.35, slant: 0 },
      { x: 0.51, y: 0.65, w: 0.475, h: 0.35, slant: 0 },
    ],
  },
  'full-bleed': {
    name: 'Full bleed',
    panels: [{ x: 0.0, y: 0.0, w: 1.0, h: 1.0, slant: 0, hero: true }],
  },
};
export const LAYOUT_IDS = Object.keys(LAYOUTS);

/** cropPanel: cover-fit an image into a panel rect, centred on a focus point. */
export function cropPanel(img, rect, crop) {
  const z = crop?.zoom || 1;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * z;
  const pw = iw * scale;
  const ph = ih * scale;
  const fx = crop?.focusX ?? 0.5;
  const fy = crop?.focusY ?? 0.42;
  let dx = rect.x + rect.w / 2 - fx * pw + (crop?.ox || 0);
  let dy = rect.y + rect.h / 2 - fy * ph + (crop?.oy || 0);
  dx = Math.min(Math.max(dx, rect.x + rect.w - pw), rect.x);
  dy = Math.min(Math.max(dy, rect.y + rect.h - ph), rect.y);
  return { dx, dy, dw: pw, dh: ph, flip: !!crop?.flip };
}
