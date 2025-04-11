import type { dia, layout } from '@joint/core';

export type Ports = {
  readonly groups?: Record<string, dia.Element.PortGroup>;
  readonly items?: dia.Element.Port[];
};

export type AvailablePosition =
  | 'absolute'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'ellipseSpread'
  | 'ellipse';

export type PositionType = AvailablePosition | dia.Element.PortPositionCallback;

export interface PortGroupBase extends layout.Port.Options {
  readonly position?: PositionType;
}
