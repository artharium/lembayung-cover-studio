// Lembayung Cover Studio v2 — cover layouts.
//
// A layout is a set of panels in normalised coordinates (0..1 of the panel
// area, the strip above the title zone). Every panel is a rectangle with an
// optional `slant` (sheared edges, the diagonal GTA poster look) and an
// optional `hero` flag (the pop-out panel, drawn again on top with a drop
// shadow). `heroPlunge` lets a layout's hero sink below the panel area so
// the big title can overlap its lower edge, the way the winning covers do.
//
// Layouts in v2 (7): hero mosaic, hero + three, six grid, diagonal trio,
// seven mosaic, full bleed, and the new centre-hero — a tall hero in the
// middle, flanked by three stacked panels on each side.
function panel(x, y, w, h, opts = {}) {
  return { x, y, w, h, slant: opts.slant || 0, hero: !!opts.hero };
}

function defineLayouts() {
  return {
    'hero-mosaic': {
      name: 'Hero mosaic',
      panels: [
        panel(0.015, 0.0, 0.54, 1.0, { hero: true }),
        panel(0.565, 0.0, 0.205, 0.48),
        panel(0.78, 0.0, 0.205, 0.48),
        panel(0.565, 0.52, 0.205, 0.48),
        panel(0.78, 0.52, 0.205, 0.48),
      ],
    },
    'hero-three': {
      name: 'Hero + three',
      panels: [
        panel(0.015, 0.0, 0.58, 1.0, { slant: 0.02, hero: true }),
        panel(0.61, 0.0, 0.375, 0.31, { slant: -0.02 }),
        panel(0.61, 0.345, 0.375, 0.31, { slant: -0.02 }),
        panel(0.61, 0.69, 0.375, 0.31, { slant: -0.02 }),
      ],
    },
    'six-grid': {
      name: 'Six grid',
      panels: [
        panel(0.015, 0.0, 0.32, 0.48),
        panel(0.345, 0.0, 0.32, 0.48, { hero: true }),
        panel(0.675, 0.0, 0.31, 0.48),
        panel(0.015, 0.52, 0.32, 0.48),
        panel(0.345, 0.52, 0.32, 0.48),
        panel(0.675, 0.52, 0.31, 0.48),
      ],
    },
    'diagonal-trio': {
      name: 'Diagonal trio',
      panels: [
        panel(0.015, 0.0, 0.36, 1.0, { slant: 0.07, hero: true }),
        panel(0.345, 0.0, 0.36, 1.0, { slant: 0.07 }),
        panel(0.675, 0.0, 0.31, 1.0, { slant: 0.07 }),
      ],
    },
    'seven-mosaic': {
      name: 'Seven mosaic',
      panels: [
        panel(0.015, 0.0, 0.42, 0.62, { hero: true }),
        panel(0.445, 0.0, 0.27, 0.30),
        panel(0.725, 0.0, 0.26, 0.30),
        panel(0.445, 0.32, 0.27, 0.30),
        panel(0.725, 0.32, 0.26, 0.30),
        panel(0.015, 0.65, 0.485, 0.35),
        panel(0.51, 0.65, 0.475, 0.35),
      ],
    },
    'full-bleed': {
      name: 'Full bleed',
      panels: [panel(0.0, 0.0, 1.0, 1.0, { hero: true })],
    },
    'center-hero': {
      name: 'Centre hero',
      heroPlunge: 0.12,
      panels: [
        panel(0.26, 0.0, 0.48, 1.0, { hero: true }),
        panel(0.015, 0.0, 0.23, 0.32),
        panel(0.015, 0.34, 0.23, 0.32),
        panel(0.015, 0.68, 0.23, 0.32),
        panel(0.755, 0.0, 0.23, 0.32),
        panel(0.755, 0.34, 0.23, 0.32),
        panel(0.755, 0.68, 0.23, 0.32),
      ],
    },
  };
}

export const LAYOUTS = defineLayouts();
export const LAYOUT_IDS = Object.keys(LAYOUTS);

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

/** cropPanel: cover-fit an image into a panel rect, centred on a focus point.
 *  `crop` carries zoom, pan offsets, flip and the face-aware focus point
 *  (focusX/focusY in 0..1 of the image). The draw offset is clamped so the
 *  image always covers the panel, never showing the frame behind it. */
export function cropPanel(img, rect, crop) {
  const zoom = crop?.zoom || 1;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const cover = Math.max(rect.w / iw, rect.h / ih);
  const scale = cover * zoom;
  const pw = iw * scale;
  const ph = ih * scale;
  const fx = crop?.focusX ?? 0.5;
  const fy = crop?.focusY ?? 0.42;
  const centredX = rect.x + rect.w / 2 - fx * pw + (crop?.ox || 0);
  const centredY = rect.y + rect.h / 2 - fy * ph + (crop?.oy || 0);
  const dx = clamp(centredX, rect.x + rect.w - pw, rect.x);
  const dy = clamp(centredY, rect.y + rect.h - ph, rect.y);
  return { dx, dy, dw: pw, dh: ph, flip: !!crop?.flip };
}

/** fitZoomFor: the zoom that shows the WHOLE photo inside a panel rect
 *  (contain instead of cover). Always <= 1; used by the "Fit whole photo"
 *  button so an uploaded photo never loads with its face cropped off. */
export function fitZoomFor(img, rect) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const cover = Math.max(rect.w / iw, rect.h / ih);
  const contain = Math.min(rect.w / iw, rect.h / ih);
  return contain / cover;
}
