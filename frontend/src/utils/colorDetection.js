/**
 * Rubik's cube sticker color detection using the browser Canvas 2D API.
 *
 * Detection pipeline
 * ------------------
 * 1. CROP  - Draw only the center-square portion of the native video frame.
 *            This matches "object-fit: cover" in CSS: the shorter dimension
 *            fills the container and the longer dimension is trimmed equally on
 *            both sides. Without this step the canvas coordinates do not match
 *            what the user actually sees on screen.
 *
 * 2. LOCATE - The caller passes "overlayRect", the normalized [0,1] position of
 *             the scanner overlay square on the displayed video. This directly
 *             identifies the 9-cell cube face region in canvas coordinates.
 *
 * 3. SEGMENT - Divide the face region into a 3x3 grid of equal cells.
 *              Each cell is then inset by CELL_INSET (20%) on every edge so we
 *              sample the sticker interior and avoid the dark plastic border
 *              (grout) between stickers.
 *
 * 4. SAMPLE  - Read every pixel in each inset region. Pixels below MIN_VALUE
 *              brightness are plastic border contamination and are discarded.
 *              The remaining pixels are converted to HSV.
 *
 * 5. MEDIAN  - Take the median HSV value from the surviving pixels. A median is
 *              far more robust than a mean: a few noisy pixels cannot shift the
 *              result the way they can with an average.
 *
 * 6. CLASSIFY - Apply threshold rules in HSV space. HSV separates hue from
 *               brightness, which makes orange/red/yellow discrimination much
 *               more reliable than the RGB Euclidean distance approach.
 */

// How much of each cell edge to discard before sampling.
// 0.20 = skip the outer 20% on every side, sample only the inner 60%.
const CELL_INSET = 0.20;

// Pixels with HSV value (brightness) below this are considered black plastic
// border and are excluded from the sample.
const MIN_VALUE_THRESHOLD = 0.15;

// ------------------------------------------------------------------
// Color space conversion
// ------------------------------------------------------------------

/**
 * Convert an RGB triplet (each 0-255) to HSV { h: 0-360, s: 0-1, v: 0-1 }.
 * HSV is used because hue cleanly separates the six cube colors and is
 * invariant to moderate changes in lighting brightness.
 */
const rgbToHsv = (r, g, b) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  const v = max;
  const s = max === 0 ? 0 : delta / max;
  let h = 0;

  if (delta > 0) {
    if (max === rn)      h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * (((bn - rn) / delta) + 2);
    else                 h = 60 * (((rn - gn) / delta) + 4);
    if (h < 0) h += 360;
  }

  return { h, s, v };
};

// ------------------------------------------------------------------
// Color classification
// ------------------------------------------------------------------

/**
 * Classify a median HSV value into one of the six Rubik's cube sticker codes.
 *
 * Rule order matters:
 *   - White is identified first by low saturation (achromatic), before hue is
 *     checked, because under some lighting white can drift toward any hue.
 *   - Red is checked last among chromatic colors because its hue wraps around
 *     0 degrees and could otherwise collide with orange.
 */
const classifyHsv = ({ h, s, v }) => {
  // White: achromatic (low saturation) and reasonably bright
  if (s < 0.25 && v > 0.60) return 'W';

  // For all other colors, require sufficient saturation to avoid
  // misidentifying grey/shadow as a chromatic color.
  if (s > 0.35) {
    if (h >= 40  && h < 75)  return 'Y'; // Yellow:  40-75 deg
    if (h >= 15  && h < 40)  return 'O'; // Orange:  15-40 deg
    if (h >= 75  && h < 165) return 'G'; // Green:   75-165 deg
    if (h >= 165 && h < 290) return 'B'; // Blue:   165-290 deg
    // Red wraps around 0 degrees (< 15 or > 330)
    if (h < 15 || h >= 330)  return 'R';
  }

  // Fallback: nearest reference color by weighted HSV distance
  return fallbackClassify(h, s, v);
};

// Reference HSV values for the six standard Rubik's cube sticker colors.
// Used only when the threshold rules above are inconclusive.
const REFERENCE_COLORS = [
  { name: 'W', h: 0,   s: 0.00, v: 1.00 },
  { name: 'Y', h: 60,  s: 0.95, v: 1.00 },
  { name: 'O', h: 22,  s: 1.00, v: 1.00 },
  { name: 'R', h: 355, s: 0.90, v: 0.75 },
  { name: 'G', h: 145, s: 1.00, v: 0.60 },
  { name: 'B', h: 220, s: 1.00, v: 0.70 },
];

const fallbackClassify = (h, s, v) => {
  let best = REFERENCE_COLORS[0].name;
  let bestDist = Infinity;

  for (const ref of REFERENCE_COLORS) {
    // Hue is circular, so compute the shorter angular distance and normalize to [0,1]
    const dh = Math.min(Math.abs(h - ref.h), 360 - Math.abs(h - ref.h)) / 180;
    const ds = Math.abs(s - ref.s);
    const dv = Math.abs(v - ref.v);
    // Weight hue twice as heavily as saturation and value
    const dist = dh * 2 + ds + dv;
    if (dist < bestDist) { bestDist = dist; best = ref.name; }
  }

  return best;
};

// ------------------------------------------------------------------
// Video frame preparation
// ------------------------------------------------------------------

/**
 * Draw the center-square region of the native video onto a new canvas.
 *
 * The webcam typically delivers a non-square resolution (e.g. 1280x720).
 * The CSS "object-fit: cover" inside the square video-wrapper crops equally
 * from both sides of the longer dimension so only the center square is shown.
 * This function replicates that crop in canvas space so that normalized
 * overlay coordinates map correctly to actual pixel positions.
 *
 * @returns {{ ctx: CanvasRenderingContext2D, size: number }} The canvas context
 *   and edge length of the resulting square canvas.
 */
const drawVideoSquare = (video) => {
  const vw = video.videoWidth;
  const vh = video.videoHeight;

  // The shorter dimension is what fills the square container; the longer
  // dimension is trimmed equally from both sides.
  const size = Math.min(vw, vh);
  const srcX = (vw - size) / 2;
  const srcY = (vh - size) / 2;

  const canvas = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  // Source rect: center square of native video.
  // Destination rect: full canvas.
  ctx.drawImage(video, srcX, srcY, size, size, 0, 0, size, size);

  return { ctx, size };
};

// ------------------------------------------------------------------
// Per-cell sampling
// ------------------------------------------------------------------

/**
 * Sample a cell's color by reading every pixel in its inset interior region,
 * discarding dark border pixels, converting to HSV, and returning the median.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cellX  - Left edge of the cell in canvas pixels.
 * @param {number} cellY  - Top edge of the cell in canvas pixels.
 * @param {number} cellW  - Cell width in canvas pixels.
 * @param {number} cellH  - Cell height in canvas pixels.
 * @returns {{ h, s, v }} Median HSV of the sticker interior.
 */
const sampleCellMedianHsv = (ctx, cellX, cellY, cellW, cellH) => {
  // Inset from the cell edges to avoid sampling the plastic border between stickers.
  const insetX = cellW * CELL_INSET;
  const insetY = cellH * CELL_INSET;
  const sx = Math.round(cellX + insetX);
  const sy = Math.round(cellY + insetY);
  const sw = Math.max(1, Math.round(cellW - insetX * 2));
  const sh = Math.max(1, Math.round(cellH - insetY * 2));

  const { data } = ctx.getImageData(sx, sy, sw, sh);
  const hsvList = [];

  for (let i = 0; i < data.length; i += 4) {
    const hsv = rgbToHsv(data[i], data[i + 1], data[i + 2]);
    // Discard very dark pixels (black plastic border contamination)
    if (hsv.v >= MIN_VALUE_THRESHOLD) {
      hsvList.push(hsv);
    }
  }

  if (hsvList.length === 0) {
    // All pixels were dark - return black-ish so it falls to the fallback
    return { h: 0, s: 0, v: 0 };
  }

  // Sort by hue, then by descending value as a tiebreaker, and take the middle entry.
  // A median is more robust than a mean: outlier pixels from reflections or noise
  // cannot shift the result.
  hsvList.sort((a, b) => a.h - b.h || b.v - a.v);
  return hsvList[Math.floor(hsvList.length / 2)];
};

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------

/**
 * Extract the 9 sticker colors from a live video frame.
 *
 * @param {HTMLVideoElement} video - The webcam video element.
 * @param {Object|null} overlayRect  - The cube face region in normalized [0,1]
 *   coordinates relative to the displayed video square: { x, y, width, height }.
 *   Defaults to { x:0.10, y:0.10, width:0.80, height:0.80 }, which matches the
 *   CSS scanner-overlay "padding: 10%".
 * @returns {string[]} Array of 9 color codes (W/Y/G/B/R/O) in row-major order,
 *   or 'E' entries if the video is not ready.
 */
export const extractColorsFromVideo = (video, overlayRect = null) => {
  // readyState 2 (HAVE_CURRENT_DATA) or higher means at least one frame is available
  if (!video || video.readyState < 2) return Array(9).fill('E');

  const { ctx, size } = drawVideoSquare(video);
  if (!ctx) return Array(9).fill('E');

  // Default rect matches the CSS padding: 10% on the scanner-overlay
  const r = overlayRect ?? { x: 0.10, y: 0.10, width: 0.80, height: 0.80 };

  // Convert normalized overlay position to canvas pixel coordinates
  const faceX = r.x     * size;
  const faceY = r.y     * size;
  const cellW = (r.width  * size) / 3;
  const cellH = (r.height * size) / 3;

  const colors = [];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cx = faceX + col * cellW;
      const cy = faceY + row * cellH;
      const medianHsv = sampleCellMedianHsv(ctx, cx, cy, cellW, cellH);
      colors.push(classifyHsv(medianHsv));
    }
  }

  return colors;
};
