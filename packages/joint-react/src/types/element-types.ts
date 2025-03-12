import type { dia, shapes } from '@joint/core';
import type { Attributes, Ports } from '../utils/cell/get-cell';
import { CellMap } from '../utils/cell/cell-map';

interface StandardShapesTypeMapper {
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
}

export type StandardShapesType = keyof StandardShapesTypeMapper;

/**
 * Base interface for graph element.
 * It's a subset of `dia.Element` with some additional properties.
 * @group Graph
 * @see @see https://docs.jointjs.com/learn/features/shapes/elements/#diaelement
 */
export interface GraphElementBase<Type extends StandardShapesType | string = string>
  extends Attributes {
  /**
   * Unique identifier of the element.
   */
  readonly id: dia.Cell.ID;
  /**
   * Optional element type.
   * @default `REACT_TYPE`
   */
  readonly type?: Type;
  /**
   * Ports of the element.
   */
  readonly ports?: Ports;
  /**
   * Generic data for the element.
   */
  readonly data?: unknown;
  /**
   * X position of the element.
   */
  readonly x: number;
  /**
   * Y position of the element.
   */
  readonly y: number;
  /**
   * Optional width of the element.
   */
  readonly width?: number;
  /**
   * Optional height of the element.
   */
  readonly height?: number;

  readonly markup?: string | dia.MarkupJSON;
  /**
   * Attributes of the element.
   */
  readonly attrs?: Type extends StandardShapesType ? StandardShapesTypeMapper[Type] : unknown;
}

export interface GraphElementItem<Data = unknown> extends GraphElementBase {
  /**
   * Generic data for the element.
   */
  readonly data: Data;
}
export interface GraphElement<Data = unknown> extends GraphElementItem<Data> {
  /**
   * Flag to distinguish between elements and links.
   */
  readonly isElement: true;
  /**
   * Flag to distinguish between elements and links.
   */
  readonly isLink: false;
}

/**
 * Collection of graph elements.
 * It's main data structure for elements (nodes) in the graph.
 *
 * Why? It's not recommended to props drill mutable classes(`dia.element`) in React components.
 *
 * It's a wrapper around `Map<dia.Cell.ID, GraphElement>` with some sugar.
 * @example
 * ```ts
 * const elements = new GraphElements();
 * elements.set('element-1', { id: 'element-1', x: 100, y: 100 });
 * elements.set('element-2', { id: 'element-2', x: 200, y: 200 });
 * ```
 *
 * @group Graph
 */
export class GraphElements<Data = unknown> extends CellMap<GraphElement<Data>> {}
