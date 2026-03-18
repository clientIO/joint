import type { LiteralUnion } from '../types/index';

/**
 * Shape of a port.
 * - `'ellipse'` — ellipse
 * - `'rect'` — rectangle
 * - Any other string — interpreted as SVG path `d` commands
 */
export type PortShape = LiteralUnion<'ellipse' | 'rect'>;

/**
 * Default element theme for port rendering.
 */
export const defaultElementTheme = {
  portColor: '#333333',
  portWidth: 10,
  portHeight: 10,
  portShape: 'ellipse' as PortShape,
  portStroke: 'transparent',
  portStrokeWidth: 0,
  portPassive: false,
  portLabelPosition: 'outside',
  portLabelColor: '#333333',
} as const;

export type ElementTheme = typeof defaultElementTheme;
