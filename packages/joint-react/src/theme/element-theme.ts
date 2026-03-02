/**
 * Default element theme for port rendering.
 */
export const defaultElementTheme = {
  portColor: '#333333',
  portWidth: 10,
  portHeight: 10,
  portShape: 'ellipse' as 'ellipse' | 'rect',
  portStroke: 'transparent',
  portStrokeWidth: 0,
  portPassive: false,
  portLabelPosition: 'outside',
  portLabelColor: '#333333',
} as const;

export type ElementTheme = typeof defaultElementTheme;
