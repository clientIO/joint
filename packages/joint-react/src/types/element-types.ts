import type { attributes, dia, shapes } from '@joint/core';

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
   * Whether the port acts as a magnet for link connections.
   * @default true
   */
  readonly magnet?: boolean;
}

export interface ReactElementAttributes {
  root?: attributes.SVGAttributes;
  rect?: attributes.SVGAttributes;
}
export interface StandardShapesTypeMapper {
  'standard.Rectangle': shapes.standard.RectangleSelectors;
  'standard.Circle': shapes.standard.CircleSelectors;
  'standard.Cylinder': shapes.standard.CylinderSelectors;
  'standard.BorderedImage': shapes.standard.BorderedImageSelectors;
  'standard.Ellipse': shapes.standard.EllipseSelectors;
  'standard.EmbeddedImage': shapes.standard.EmbeddedImageSelectors;
  'standard.Path': shapes.standard.PathSelectors;
  'standard.HeaderedRectangle': shapes.standard.HeaderedRectangleSelectors;
  'standard.Image': shapes.standard.ImageSelectors;
  'standard.InscribedImage': shapes.standard.InscribedImageSelectors;
  'standard.Polygon': shapes.standard.PolygonSelectors;
  'standard.Polyline': shapes.standard.PolylineSelectors;
  'standard.TextBlock': shapes.standard.TextBlockSelectors;
  ReactElement: ReactElementAttributes;
}

export type StandardShapesType = keyof StandardShapesTypeMapper;

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
   * Optional markup of the element.
   */
  markup?: string | dia.MarkupJSON;
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
  /**
   * Attributes of the element.
   */
  attrs?: dia.Cell.Selectors;
}
