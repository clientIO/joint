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
  color: '#333333',
  shape: 'ellipse' as PortShape,
  stroke: 'transparent',
  strokeWidth: 0,
  className: '',
  passive: false,
  labelPosition: 'outside',
  labelColor: '#333333',
  labelFontSize: 12,
  labelFontFamily: 'sans-serif',
  labelClassName: '',
} as const;
