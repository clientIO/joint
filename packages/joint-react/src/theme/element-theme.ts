import type { LiteralUnion } from '../types/index';

/**
 * Shape of a port.
 * - `'ellipse'` — ellipse
 * - `'rect'` — rectangle
 * - Any other string — interpreted as SVG path `d` commands
 */
export type PortShape = LiteralUnion<'ellipse' | 'rect'>;

/**
 * Internal fallback values for port properties not set by portDefaults or individual ports.
 */
export const defaultPortStyle = {
  width: 10,
  height: 10,
  color: '' as string,
  shape: 'ellipse' as PortShape,
  outline: '' as string, // Accepts any CSS color (e.g., "#333", "var(--my-color)")
  outlineWidth: '' as number | string, // Outline width in px or CSS value
  className: '',
  passive: false,
  labelPosition: 'outside',
  labelColor: '' as string,
  labelFontSize: '' as number | string,
  labelFontFamily: '' as string,
  labelClassName: '',
} as const;
