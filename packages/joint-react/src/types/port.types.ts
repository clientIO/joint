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
  readonly dx?: number;
  readonly dy?: number;
}

export interface Position {
  readonly x?: number | string;
  readonly y?: number | string;
}

export interface PortLayoutAbsolute extends Position, PortLayoutBase {
  readonly position: 'absolute';
  readonly angle?: number;
}

export interface PortLayoutLine extends PortLayoutBase {
  readonly position: 'line';
  readonly start: Position;
  readonly end: Position;
}

export interface PortLayoutOnSides extends PortLayoutBase, Position, OffsetPosition {
  readonly position: 'left' | 'right' | 'top' | 'bottom';
  readonly angle?: number;
}

export interface PortLayoutRadial extends PortLayoutBase, Position, OffsetPosition {
  readonly position: 'ellipseSpread' | 'ellipse';
  readonly dr: number;
  readonly startAngle?: number;
  readonly step?: number;
  readonly compensateRotation?: boolean;
}

export interface PortLayoutFunction extends PortLayoutBase {
  readonly position: dia.Element.PortPositionCallback;
}

export type PortLayout =
  | PortLayoutAbsolute
  | PortLayoutLine
  | PortLayoutOnSides
  | PortLayoutRadial
  | PortLayoutFunction;
