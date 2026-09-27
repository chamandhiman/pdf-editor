/**
 * Font metric tables and visual size compensation utilities.
 *
 * Different font families have distinct cap-heights, x-heights, ascenders,
 * and descenders relative to the em-square.
 * When substituting or falling back to another font family (e.g. Arial replacing
 * Helvetica, Times-Roman, or Oswald), compensating the rendered font-size
 * ensures replacement text has approximately the same visual height as the original.
 */

export const FONT_CAP_HEIGHTS: Record<string, number> = {
  // Standard Sans-Serif
  helvetica: 0.718,
  arial: 0.718,
  "sans-serif": 0.718,
  roboto: 0.711,
  "open sans": 0.727,
  lato: 0.722,
  montserrat: 0.700,
  poppins: 0.698,
  inter: 0.727,
  nunito: 0.705,
  raleway: 0.710,

  // Standard Serif
  times: 0.662,
  "times new roman": 0.662,
  "times-roman": 0.662,
  serif: 0.662,
  georgia: 0.693,
  merriweather: 0.743,
  "source serif 4": 0.686,

  // Monospace
  courier: 0.584,
  "courier new": 0.584,
  monospace: 0.584,
  consolas: 0.640,

  // Display / Condensed
  oswald: 0.810,
};

/**
 * Extract or compute the original font's visual cap-height metric (0.0 - 1.0)
 * from PDF.js font descriptor data or known font name.
 */
export function getOriginalFontMetric(embeddedFont?: any, fontName?: string | null): number {
  if (embeddedFont) {
    let cap = embeddedFont.capHeight;
    if (typeof cap === "number") {
      if (cap > 10) cap /= 1000;
      if (cap >= 0.45 && cap <= 1.0) return cap;
    }
    let asc = embeddedFont.ascent;
    if (typeof asc === "number") {
      if (asc > 10) asc /= 1000;
      if (asc >= 0.5 && asc <= 1.2) return asc * 0.85;
    }
    if (Array.isArray(embeddedFont.bbox) && embeddedFont.bbox.length >= 4) {
      let bboxH = embeddedFont.bbox[3] - embeddedFont.bbox[1];
      if (bboxH > 10) bboxH /= 1000;
      if (bboxH >= 0.5 && bboxH <= 1.5) return bboxH * 0.7;
    }
  }

  if (fontName) {
    const fLow = fontName.toLowerCase();
    for (const [key, val] of Object.entries(FONT_CAP_HEIGHTS)) {
      if (fLow.includes(key)) return val;
    }
    if (/times|serif|georgia|roman/i.test(fLow)) return 0.662;
    if (/courier|mono|consolas/i.test(fLow)) return 0.584;
  }

  return 0.718; // Default standard sans-serif (Helvetica/Arial)
}

/**
 * Determine the visual cap-height metric for the target CSS font-family string.
 */
export function getTargetFontMetric(fontFamily: string): number {
  const fLow = fontFamily.toLowerCase();
  for (const [key, val] of Object.entries(FONT_CAP_HEIGHTS)) {
    if (fLow.includes(key)) return val;
  }
  if (/serif/i.test(fLow)) return 0.662;
  if (/mono/i.test(fLow)) return 0.584;
  return 0.718;
}

/**
 * Calculate the visual size compensation ratio.
 *
 * Example:
 * Original: Helvetica (0.718), Target: Times New Roman (0.662)
 * Ratio = 0.718 / 0.662 = 1.085 (render Times slightly larger so visual height matches).
 *
 * Original: Times New Roman (0.662), Fallback: Arial (0.718)
 * Ratio = 0.662 / 0.718 = 0.922 (render Arial slightly smaller so visual height matches).
 */
export function calculateFontCompensation(
  origMetric: number,
  targetFontFamily: string,
  isOriginalFontActive: boolean = false,
): number {
  if (isOriginalFontActive) return 1.0;
  const targetMetric = getTargetFontMetric(targetFontFamily);
  if (!targetMetric || !origMetric) return 1.0;

  const ratio = origMetric / targetMetric;
  // Keep compensation within standard typographic boundaries (0.75x to 1.35x)
  return Math.max(0.75, Math.min(1.35, ratio));
}
