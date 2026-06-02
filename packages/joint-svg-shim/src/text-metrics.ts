/**
 * Server-side text measurement for the SVG shim.
 *
 * jsdom implements no text layout, so `getBBox`/`getComputedTextLength` report 0
 * — which collapses everything sized from text (most visibly link-label
 * backgrounds). We measure with a real Canvas 2D context from **`@napi-rs/canvas`**
 * (Skia, prebuilt binaries — no native compilation, works in Node and Bun),
 * giving exact, font-matched widths that scale with font size and match the
 * browser's rendering.
 *
 * `@napi-rs/canvas` ships as a dependency, so metrics are pixel-exact by default.
 * The coarse average-glyph fallback below only runs in the unlikely case it can't
 * be loaded (e.g. an unsupported platform), purely so labels are not broken.
 */
// cspell:ignore napi
import { getNodeRequire } from './node-require';

/** Average glyph advance as a fraction of font size — used only without canvas. */
const AVERAGE_GLYPH_WIDTH_RATIO = 0.6;
// Vertical fallback metrics (fractions of font size) when canvas is unavailable —
// a typical sans-serif font box (ascent + descent ≈ 1.2em).
const FALLBACK_ASCENT_RATIO = 0.92;
const FALLBACK_DESCENT_RATIO = 0.28;
const DEFAULT_FONT_FAMILY = 'sans-serif';

/** Canvas `TextMetrics`, narrowed to the fields we read. */
interface CanvasTextMetrics {
  width: number;
  fontBoundingBoxAscent?: number;
  fontBoundingBoxDescent?: number;
}

/** A Canvas 2D context, narrowed to the text-measuring surface we use. */
interface MeasuringContext {
  font: string;
  measureText: (text: string) => CanvasTextMetrics;
}

/** Minimal `@napi-rs/canvas` surface we use (avoids a hard type dependency). */
interface CanvasModule {
  createCanvas: (width: number, height: number) => { getContext: (id: '2d') => MeasuringContext | null };
}

// `undefined` = not probed; `null` = probed, no canvas package available.
let measuringContext: MeasuringContext | null | undefined;

/** Lazily resolves a real Canvas 2D measuring context, or `null` when unavailable. */
function getMeasuringContext(): MeasuringContext | null {
  if (measuringContext !== undefined) {
    return measuringContext;
  }
  measuringContext = null;
  try {
    const canvas = getNodeRequire()('@napi-rs/canvas') as CanvasModule;
    const context = canvas.createCanvas(1, 1).getContext('2d');
    if (context && typeof context.measureText === 'function') {
      measuringContext = context;
    }
  } catch {
    measuringContext = null;
  }
  return measuringContext;
}

/** Options for {@link measureText}. */
export interface TextMeasureOptions {
  /** Font size in px. */
  readonly fontSize: number;
  /** Whether the text is bold (font-weight ≥ 600). @default false */
  readonly bold?: boolean;
  /** The text's CSS font-family — measured against the same font the browser uses. */
  readonly fontFamily?: string;
}

/** A text run's box: width plus the font ascent/descent above/below the baseline. */
export interface TextBox {
  /** Rendered width in px. */
  readonly width: number;
  /** Distance from the baseline to the box top (px). */
  readonly ascent: number;
  /** Distance from the baseline to the box bottom (px). */
  readonly descent: number;
}

/**
 * Measures a string's rendered box (width + vertical extent). Exact (font-matched)
 * via `@napi-rs/canvas` when installed; otherwise a coarse estimate. The vertical
 * metrics let `getBBox` match the browser, which positions text from the baseline
 * (not a symmetric box).
 * @param text - the string to measure.
 * @param options - font size, weight, and family.
 * @returns the text box (zero width for empty text).
 */
export function measureText(text: string, options: TextMeasureOptions): TextBox {
  const { fontSize, bold = false, fontFamily = DEFAULT_FONT_FAMILY } = options;
  const fallbackAscent = fontSize * FALLBACK_ASCENT_RATIO;
  const fallbackDescent = fontSize * FALLBACK_DESCENT_RATIO;
  if (text.length === 0) {
    // Empty text occupies no box at all — no width and no vertical extent.
    return { width: 0, ascent: 0, descent: 0 };
  }
  const context = getMeasuringContext();
  if (context) {
    context.font = `${bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
    const metrics = context.measureText(text);
    if (metrics.width > 0) {
      return {
        width: metrics.width,
        ascent: metrics.fontBoundingBoxAscent ?? fallbackAscent,
        descent: metrics.fontBoundingBoxDescent ?? fallbackDescent,
      };
    }
  }
  return { width: text.length * fontSize * AVERAGE_GLYPH_WIDTH_RATIO, ascent: fallbackAscent, descent: fallbackDescent };
}

