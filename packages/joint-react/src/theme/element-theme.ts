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
  portClassName: '',
  portPassive: false,
  portLabelPosition: 'outside',
  portLabelColor: '#333333',
  portLabelFontSize: 12,
  portLabelFontFamily: 'sans-serif',
  portLabelClassName: '',
  portLabelOffsetX: null as number | null,
  portLabelOffsetY: null as number | null,
} as const;

/**
 * Widened type for element theme overrides.
 * Matches the shape of `defaultElementTheme` but with non-literal types
 * so that users can pass arbitrary values (e.g. any color string).
 */
export interface ElementTheme {
  readonly portColor: string;
  readonly portWidth: number;
  readonly portHeight: number;
  readonly portShape: PortShape;
  readonly portStroke: string;
  readonly portStrokeWidth: number;
  readonly portClassName: string;
  readonly portPassive: boolean;
  readonly portLabelPosition: string;
  readonly portLabelColor: string;
  readonly portLabelFontSize: number;
  readonly portLabelFontFamily: string;
  readonly portLabelClassName: string;
  readonly portLabelOffsetX: number | null;
  readonly portLabelOffsetY: number | null;
}
