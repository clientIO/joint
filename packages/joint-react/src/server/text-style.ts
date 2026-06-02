import type fs from 'node:fs';
import { getNodeRequire } from '@joint/svg-shim';
import type { TextStyle } from '@joint/svg-shim';

/**
 * `@joint/react`'s theme-font resolver — wired into the shim by
 * `@joint/react/server`. It resolves the font properties the theme applies to SVG
 * text via CSS classes (e.g. `.jj-link-label { font-size: 11px }`), so the server
 * measures text at the size/family the browser renders — most visibly link-label
 * backgrounds.
 *
 * Parses the package's own stylesheet into a `class → font` map (resolving its
 * `var()` references against its `:root` defaults) rather than relying on jsdom's
 * `getComputedStyle`, which resolves stylesheet rules inconsistently across
 * runtimes (notably Bun) and only for attached elements.
 */

const VARIABLE_REFERENCE = /var\((--[\w-]+)(?:,([^)]*))?\)/g;
// Custom-property definitions, anchored after a `{`, `;`, or `}` boundary so the
// FIRST declaration in a block is captured and a preceding selector/comment can't
// glue onto it. The value stops at the next `;` or `}`, so a value containing `:`
// (e.g. `url(http://x)`) does not corrupt the following declaration.
const VARIABLE_DEFINITION = /[{;}]\s*(--[\w-]+)\s*:\s*([^;}]+)/g;
// Lone single-class rules (`.name { ... }`) only. Compound, descendant, and
// tag-qualified selectors (`.a .b`, `rect.bg`, `.a, .b`) are intentionally NOT
// matched — the themed text classes (`.jj-link-label`, `.jj-port-label`) are
// plain single-class rules. A lookbehind anchors the selector to a `{`/`}`/start
// boundary (without consuming it, so adjacent rules are not skipped); the capture
// runs to the rule's `{`, and a guard rejects anything that isn't a bare `.name`.
const CLASS_RULE = /(?<=^|[{}])\s*(\.[\w-]+)\s*\{([^}]*)\}/g;
// A bare single-class selector: a leading `.` then one class name, nothing else
// (no combinator, second class, attribute selector, or tag qualifier).
const SINGLE_CLASS_SELECTOR = /^\.([\w-]+)$/;
const FONT_SIZE_DECLARATION = /font-size:\s*([^;]+)/;
const FONT_FAMILY_DECLARATION = /font-family:\s*([^;]+)/;
const FONT_WEIGHT_DECLARATION = /font-weight:\s*([^;]+)/;
// CSS variables can reference other variables; a few passes resolve the chain.
const MAX_RESOLUTION_PASSES = 5;

let cachedFontMap: ReadonlyMap<string, TextStyle> | undefined;

/**
 * Collects `--name: value` custom-property definitions into a `name → value` map.
 * Each definition is matched at a `{`/`;`/`}` boundary, so the first declaration of
 * a block is captured and the value (which may itself contain `:`) cannot bleed
 * into the next declaration.
 */
function collectVariableDefinitions(css: string): Map<string, string> {
  const values = new Map<string, string>();
  for (const [, name, value] of css.matchAll(VARIABLE_DEFINITION)) {
    values.set(name, value.trim());
  }
  return values;
}

/** Strips CSS block comments, so they cannot corrupt declaration parsing. */
function stripComments(css: string): string {
  return css.replaceAll(/\/\*[\s\S]*?\*\//g, '');
}

/** Resolves `var(--x[, fallback])` against the stylesheet's own `:root` defaults. */
function resolveCssVariables(css: string): string {
  const values = collectVariableDefinitions(css);

  let resolved = css;
  for (let pass = 0; pass < MAX_RESOLUTION_PASSES; pass++) {
    const next = resolved.replaceAll(
      VARIABLE_REFERENCE,
      (match, name: string, fallback?: string) => values.get(name) ?? fallback?.trim() ?? match
    );
    if (next === resolved) {
      break;
    }
    resolved = next;
  }
  return resolved;
}

/** Extracts a declaration's value from a rule body, when present. */
function declarationValue(body: string, pattern: RegExp): string | undefined {
  return pattern.exec(body)?.[1]?.trim();
}

/** Builds the `class → font` map from resolved CSS. */
function buildFontMap(css: string): Map<string, TextStyle> {
  const map = new Map<string, TextStyle>();
  for (const [, selector, body] of css.matchAll(CLASS_RULE)) {
    const singleClass = SINGLE_CLASS_SELECTOR.exec(selector);
    if (!singleClass) {
      continue;
    }
    const [, className] = singleClass;
    const font: TextStyle = {
      fontSize: declarationValue(body, FONT_SIZE_DECLARATION),
      fontFamily: declarationValue(body, FONT_FAMILY_DECLARATION),
      fontWeight: declarationValue(body, FONT_WEIGHT_DECLARATION),
    };
    if (font.fontSize === undefined && font.fontFamily === undefined && font.fontWeight === undefined) {
      continue;
    }
    map.set(className, { ...map.get(className), ...stripUndefined(font) });
  }
  return map;
}

/** Drops `undefined` entries so merges don't overwrite real values with gaps. */
function stripUndefined(font: TextStyle): TextStyle {
  const result: { fontSize?: string; fontFamily?: string; fontWeight?: string } = {};
  if (font.fontSize !== undefined) result.fontSize = font.fontSize;
  if (font.fontFamily !== undefined) result.fontFamily = font.fontFamily;
  if (font.fontWeight !== undefined) result.fontWeight = font.fontWeight;
  return result;
}

/**
 * Parses a stylesheet into a `class → font` map: strips comments, resolves the
 * sheet's own `var()` references, then collects lone single-class font rules.
 * @param css - the raw stylesheet text.
 * @returns the `class → font` map (empty when no themed text classes exist).
 */
export function parseTextStyles(css: string): ReadonlyMap<string, TextStyle> {
  return buildFontMap(resolveCssVariables(stripComments(css)));
}

/** Loads + parses `@joint/react`'s stylesheet once, or an empty map if unavailable. */
function getFontMap(): ReadonlyMap<string, TextStyle> {
  if (cachedFontMap !== undefined) {
    return cachedFontMap;
  }
  cachedFontMap = new Map();
  try {
    const nodeRequire = getNodeRequire();
    const cssPath = nodeRequire.resolve('@joint/react/styles.css');
    const { readFileSync } = nodeRequire('node:fs') as typeof fs;
    cachedFontMap = parseTextStyles(readFileSync(cssPath, 'utf8'));
  } catch {
    cachedFontMap = new Map();
  }
  return cachedFontMap;
}

/**
 * Resolves the theme font properties for a `class` attribute. Later classes win,
 * mirroring same-specificity CSS ordering.
 * @param classAttribute - the element's `class` attribute value.
 * @returns the merged theme font for those classes (empty when none apply).
 */
export function getTextStyle(classAttribute: string): TextStyle {
  const map = getFontMap();
  if (map.size === 0 || classAttribute === '') {
    return {};
  }
  let result: TextStyle = {};
  for (const className of classAttribute.split(/\s+/)) {
    const font = map.get(className);
    if (font) {
      result = { ...result, ...font };
    }
  }
  return result;
}
