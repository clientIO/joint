import type { dia } from '@joint/core';

export type Ports = {
  readonly groups?: Record<string, dia.Element.PortGroup>;
  readonly items?: dia.Element.Port[];
};

export type PortLayoutPosition =
  | 'absolute'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'line'
  | 'ellipseSpread'
  | 'ellipse';

export type PositionType = PortLayoutPosition | dia.Element.PortPositionCallback;

interface PortLayoutBase {
  readonly position?: PositionType;
  readonly width?: string | number;
  readonly height?: string | number;
}

interface OffsetPosition {
  /**
   * The x offset
   */
  readonly dx?: number;
  /**
   * The y offset
   */
  readonly dy?: number;
}

export interface Position {
  /**
   * The x position
   */
  readonly x?: number | string;
  /**
   * The y position
   */
  readonly y?: number | string;
}

/**
 * It lays a port out at the given position (defined as x, y coordinates or percentage of the element dimensions).
 * @see https://docs.jointjs.com/api/layout/Port#absolute
 */
export interface PortLayoutAbsolute extends Position, PortLayoutBase {
  readonly position: 'absolute';
  /**
   * The angle of the port group
   * @default 0
   */
  readonly angle?: number;
}

/**
 * A layout which evenly spreads ports along a line defined by a start and end point.
 * @see https://docs.jointjs.com/api/layout/Port/#line
 */
export interface PortLayoutLine extends PortLayoutBase {
  readonly position: 'line';
  readonly start: Position;
  readonly end: Position;
}
/**
 * A simple layout suitable for rectangular shapes. It evenly spreads ports along a single side.
 * @see https://docs.jointjs.com/api/layout/Port/#on-sides
 */
export interface PortLayoutOnSides extends PortLayoutBase, Position, OffsetPosition {
  readonly position: 'left' | 'right' | 'top' | 'bottom';
  // angle	number	The port rotation angle.
  /**
   * The angle of the port group
   */
  readonly angle?: number;
}

/**
 * Suitable for circular shapes. The ellipseSpreads evenly spreads ports along an ellipse. The ellipse spreads ports from the point at startAngle leaving gaps between ports equal to step.
 * @see https://docs.jointjs.com/api/layout/Port/#radial
 */
export interface PortLayoutRadial extends PortLayoutBase, Position, OffsetPosition {
  readonly position: 'ellipseSpread' | 'ellipse';
  /**
   * Added to the port delta rotation
   */
  readonly dr: number;
  /**
   * The start angle of the port group
   * @default 0
   */
  readonly startAngle?: number;
  /**
   * The step of the port group
   * @default 0
   */
  readonly step?: number;
  /**
   * set compensateRotation: true when you need to have ports in the same angle as an ellipse tangent at the port position.
   */
  readonly compensateRotation?: boolean;
}

/**
 * A layout which evenly spreads ports along a line defined by a start and end point.
 */
export interface PortLayoutFunction extends PortLayoutBase {
  readonly position: dia.Element.PortPositionCallback;
}

export type PortLayout =
  | PortLayoutAbsolute
  | PortLayoutLine
  | PortLayoutOnSides
  | PortLayoutRadial
  | PortLayoutFunction;
