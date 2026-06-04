/**
 * Server-side text bounding-box estimation for the SVG shim.
 *
 * `getBBox`/`getComputedTextLength` measure text via `./text-metrics` (exact with
 * `@napi-rs/canvas`, else estimated), honoring the consumer theme's class fonts
 * (`./text-style-resolver`), so text-sized geometry — link-label backgrounds
 * especially — matches the browser. Non-text nodes get an empty box, since
 * element/link positions come from the JointJS model.
 */
import { measureText } from './text-metrics';
import { resolveTextStyle } from './text-style-resolver';

const DEFAULT_FONT_SIZE = 16;
const BOLD_WEIGHT_THRESHOLD = 600;
const TEXT_TAGS = new Set(['text', 'tspan', 'textPath']);
// cspell:ignore bbox svgdom
const ZERO_BOX = { x: 0, y: 0, width: 0, height: 0 };
// Trailing CSS unit of a `dy` value (e.g. `px`, `ex`, `%`), after the number.
const DY_UNIT = /[\d.]\s*([a-z%]+)\s*$/i;

/** The subset of a text element the metric reader needs. */
export interface TextMetricsNode {
  readonly localName?: string;
  readonly textContent?: string | null;
  readonly getAttribute?: (name: string) => string | null;
  readonly style?: { fontSize?: string; fontFamily?: string; textAnchor?: string; fontWeight?: string };
  /** First child element — the `<tspan>` whose `dy` shifts the baseline. */
  readonly firstElementChild?: { getAttribute?: (name: string) => string | null } | null;
}

/** Reads an inline-style font value as a string, or `''` when absent. */
function inlineStyle(node: TextMetricsNode, property: 'fontSize' | 'fontFamily' | 'fontWeight'): string {
  const value = node.style?.[property];
  return typeof value === 'string' ? value : '';
}

// Effective value precedence mirrors CSS: inline style beats a theme class, which
// beats the element's presentation attribute.

/** Resolves the effective font size (px): inline → theme class → attribute → default. */
function resolveFontSize(node: TextMetricsNode, themeValue: string | undefined): number {
  const attribute = node.getAttribute?.('font-size') ?? '';
  const parsed = Number.parseFloat(inlineStyle(node, 'fontSize') || (themeValue ?? '') || attribute);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_FONT_SIZE;
}

/** Resolves the effective font family: inline → theme class → attribute, or `undefined`. */
function resolveFontFamily(node: TextMetricsNode, themeValue: string | undefined): string | undefined {
  const family = (inlineStyle(node, 'fontFamily') || (themeValue ?? '') || node.getAttribute?.('font-family') || '').trim();
  return family || undefined;
}

/** Resolves whether the effective weight is bold: inline → theme class → attribute. */
function resolveBold(node: TextMetricsNode, themeValue: string | undefined): boolean {
  const weight = inlineStyle(node, 'fontWeight') || (themeValue ?? '') || node.getAttribute?.('font-weight') || '';
  if (weight === 'bold' || weight === 'bolder') {
    return true;
  }
  const numeric = Number.parseInt(weight, 10);
  return Number.isFinite(numeric) && numeric >= BOLD_WEIGHT_THRESHOLD;
}

/** Resolves the element's text anchor (`start` | `middle` | `end`) from style/attribute. */
function readTextAnchor(node: TextMetricsNode): string {
  const fromStyle = typeof node.style?.textAnchor === 'string' ? node.style.textAnchor : '';
  return fromStyle || node.getAttribute?.('text-anchor') || 'start';
}

/** Horizontal bbox offset for a text anchor — the glyph box grows from the anchor. */
function anchorOffset(anchor: string, width: number): number {
  if (anchor === 'middle') {
    return -width / 2;
  }
  if (anchor === 'end') {
    return -width;
  }
  return 0;
}

/**
 * Reads the baseline shift (px) from the text's `<tspan dy>` (joint centers via
 * `dy`). A bare number is taken as px and `em` is scaled by the font size; any
 * other unit (`ex`, `%`, …) is not supported and yields no shift, so it cannot
 * mis-position the box.
 */
function readBaselineShift(node: TextMetricsNode, fontSize: number): number {
  const dy = (node.firstElementChild?.getAttribute?.('dy') ?? '').trim();
  if (dy === '') {
    return 0;
  }
  const value = Number.parseFloat(dy);
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (dy.endsWith('em')) {
    return value * fontSize;
  }
  // Bare numbers (and explicit `px`) are px; any other unit (`ex`, `%`, …) is
  // unsupported and yields no shift, so it cannot mis-position the box.
  const unit = DY_UNIT.exec(dy)?.[1] ?? '';
  if (unit !== '' && unit !== 'px') {
    return 0;
  }
  return value;
}

/** Measures a text node's box (width + baseline-relative extent), honoring theme CSS. */
export function measureNodeText(node: TextMetricsNode): {
  width: number;
  ascent: number;
  descent: number;
  fontSize: number;
} {
  const theme = resolveTextStyle(node.getAttribute?.('class') ?? '');
  const fontSize = resolveFontSize(node, theme.fontSize);
  const box = measureText(node.textContent ?? '', {
    fontSize,
    bold: resolveBold(node, theme.fontWeight),
    fontFamily: resolveFontFamily(node, theme.fontFamily),
  });
  return { ...box, fontSize };
}

/**
 * A node's bounding box — measured metrics for text, an empty box otherwise.
 * @param node - the SVG node to size.
 * @returns the bounding box (`{ x, y, width, height }`).
 */
export function estimateBBox(node: TextMetricsNode): { x: number; y: number; width: number; height: number } {
  if (node.localName !== undefined && TEXT_TAGS.has(node.localName)) {
    const { width, ascent, descent, fontSize } = measureNodeText(node);
    // The browser positions text from the baseline (y = 0), shifted by the
    // `<tspan dy>`; the box runs from `dy - ascent` to `dy + descent`.
    const baseline = readBaselineShift(node, fontSize);
    return {
      x: anchorOffset(readTextAnchor(node), width),
      y: baseline - ascent,
      width,
      height: ascent + descent,
    };
  }
  return { ...ZERO_BOX };
}
