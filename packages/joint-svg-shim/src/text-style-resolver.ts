/**
 * Injectable resolver for the font properties a consumer's theme applies to SVG
 * text through CSS classes (e.g. a label class that sets `font-size`).
 *
 * The shim measures text at the size/family the browser would render, but the
 * mapping from class names to fonts is consumer-specific. So it is injected
 * rather than hardcoded — keeping the shim free of any one framework's
 * stylesheet (`@joint/react` registers its theme; joint-core could register its
 * own, or none).
 */

/** Font properties a theme class can apply to text. */
export interface TextStyle {
  readonly fontSize?: string;
  readonly fontFamily?: string;
  readonly fontWeight?: string;
}

/** Resolves the theme font for an element's `class` attribute. */
export type TextStyleResolver = (classAttribute: string) => TextStyle;

const EMPTY_TEXT_STYLE: TextStyle = {};
const registry: { resolve: TextStyleResolver } = { resolve: () => EMPTY_TEXT_STYLE };

/**
 * Registers how themed text classes map to font properties. A consumer with a
 * CSS theme calls this so the shim measures themed text at the size the browser
 * applies. With no resolver registered, text is measured from its own
 * inline/attribute font only.
 * @param resolver - maps a `class` attribute to its theme font.
 */
export function setTextStyleResolver(resolver: TextStyleResolver): void {
  registry.resolve = resolver;
}

/**
 * Resolves the theme font for a `class` attribute (empty when none registered).
 * @param classAttribute - the element's `class` attribute value.
 * @returns the resolved theme font.
 */
export function resolveTextStyle(classAttribute: string): TextStyle {
  return registry.resolve(classAttribute);
}
