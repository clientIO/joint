/**
 * Simplified port definition for declarative port configuration.
 * Converted to full JointJS port format by the default element mapper.
 * @group Graph
 */
export interface GraphElementPort {
  /**
   * Unique port identifier.
   */
  readonly id?: string;
  /**
   * X position of the port (absolute positioning).
   * Supports calc() expressions (e.g., 'calc(w)').
   */
  readonly cx: number | string;
  /**
   * Y position of the port (absolute positioning).
   * Supports calc() expressions (e.g., 'calc(h)').
   */
  readonly cy: number | string;
  /**
   * Width of the port shape.
   * @default 10
   */
  readonly width?: number;
  /**
   * Height of the port shape.
   * @default 10
   */
  readonly height?: number;
  /**
   * Fill color of the port shape.
   * @default '#333333'
   */
  readonly color?: string;
  /**
   * Shape of the port.
   * @default 'ellipse'
   */
  readonly shape?: 'ellipse' | 'rect';
  /**
   * CSS class name to apply to the port shape.
   */
  readonly className?: string;
  /**
   * Whether the port is limited to only being a target (not source) for links.
   * @default false
   */
  readonly passive?: boolean;
  /**
   * Label displayed next to the port.
   */
  readonly label?: string;
  /**
   * Position of the port label.
   * @default 'outside'
   */
  readonly labelPosition?: string;
  /**
   * Color of the port label text.
   * @default '#333333'
   */
  readonly labelColor?: string;
  /**
   * CSS class name to apply to the port label.
   */
  readonly labelClassName?: string;
}

export interface GraphElement extends Record<string, unknown> {
  /**
   * Ports of the element.
   */
  ports?: GraphElementPort[];
  /**
   * X position of the element.
   */
  x?: number;
  /**
   * Y position of the element.
   */
  y?: number;
  /**
   * Optional width of the element.
   */
  width?: number;
  /**
   * Optional height of the element.
   */
  height?: number;
  /**
   * Optional angle of the element.
   */
  angle?: number;
  /**
   * Z-index of the element.
   */
  z?: number;
  /**
   * Parent element id.
   */
  parent?: string;
  /**
   * Layer id for the element.
   */
  layer?: string;
}
