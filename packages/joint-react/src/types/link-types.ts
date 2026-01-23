import type { dia, shapes } from '@joint/core';

export interface StandardLinkShapesTypeMapper {
  'standard.DoubleLink': shapes.standard.DoubleLinkSelectors;
  'standard.ShadowLink': shapes.standard.ShadowLinkSelectors;
  'standard.Link': shapes.standard.LinkSelectors;
}

export type StandardLinkShapesType = keyof StandardLinkShapesTypeMapper;
/**
 * Base interface for graph link.
 * It's a subset of `dia.Link` with some additional properties.
 * @group Graph
 * @see @see https://docs.jointjs.com/learn/features/shapes/links/#dialink
 */
export interface GraphLink extends Record<string, unknown> {
  /**
   * Unique identifier of the link.
   */
  readonly id: dia.Cell.ID;
  /**
   * Source element id or endpoint definition.
   */
  readonly source: dia.Cell.ID | dia.Link.EndJSON;
  /**
   * Target element id or endpoint definition.
   */
  readonly target: dia.Cell.ID | dia.Link.EndJSON;
  /**
   * Optional link type.
   * @default 'standard.Link'
   */
  readonly type?: string;
  /**
   * Z index of the link.
   */
  readonly z?: number;
  /**
   * Optional link markup.
   */
  readonly markup?: dia.MarkupJSON;
  /**
   * Default label configuration.
   */
  readonly defaultLabel?: dia.Link.Label;
  /**
   * Link labels.
   */
  readonly labels?: dia.Link.Label[];
  /**
   * Link vertices (waypoints).
   */
  readonly vertices?: dia.Link.Vertex[];
  /**
   * Link router configuration.
   */
  readonly router?: unknown;
  /**
   * Link connector configuration.
   */
  readonly connector?: unknown;
  /**
   * Attributes of the link.
   */
  readonly attrs?: dia.Cell.Selectors;
}
