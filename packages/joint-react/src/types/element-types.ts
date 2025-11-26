import type { attributes, dia, shapes } from '@joint/core';
import type { Ports } from '../utils/cell/get-cell';

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

export interface GraphElement {
  /**
   * Unique identifier of the element.
   */
  readonly id: dia.Cell.ID;
  /**
   * Optional element type.
   * @default `REACT_TYPE`
   */
  readonly type?: string | keyof StandardShapesTypeMapper;
  /**
   * Ports of the element.
   */
  readonly ports?: Ports;
  /**
   * X position of the element.
   */
  readonly x?: number;
  /**
   * Y position of the element.
   */
  readonly y?: number;
  /**
   * Optional width of the element.
   */
  readonly width?: number;
  /**
   * Optional height of the element.
   */
  readonly height?: number;
  /**
   * Optional markup of the element.
   */
  readonly markup?: string | dia.MarkupJSON;
  /**
   * Optional angle of the element.
   */
  readonly angle?: number;
}
