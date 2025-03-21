import type { dia, shapes } from '@joint/core';
import { CellMap } from '../utils/cell/cell-map';

interface StandardLinkShapesTypeMapper {
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
export interface GraphLinkBase<Type extends StandardLinkShapesType | string = string>
  extends dia.Link.EndJSON,
    Record<string, unknown> {
  /**
   * Unique identifier of the link.
   */
  readonly id: dia.Cell.ID;
  /**
   * Source element id.
   */
  readonly source: dia.Cell.ID;
  /**
   * Target element id.
   */
  readonly target: dia.Cell.ID;
  /**
   * Optional link type.
   */
  readonly type?: Type;
  /**
   * Z index of the link.
   */
  readonly z?: number;
  /**
   * Optional link markup.
   */
  readonly markup?: dia.MarkupJSON;
  /**
   * Optional link attrs.
   */
  readonly defaultLabel?: dia.Link.Label;

  /**
   * Attributes of the element.
   */
  readonly attrs?: Type extends StandardLinkShapesType
    ? StandardLinkShapesTypeMapper[Type]
    : unknown;
}
export interface GraphLink extends GraphLinkBase {
  /**
   * Flag to distinguish between elements and links.
   */
  readonly isElement: false;
  /**
   * Flag to distinguish between elements and links.
   */
  readonly isLink: true;
}

/**
 * Collection of graph links.
 * It's main data structure for links (edges) in the graph.
 * It's a wrapper around `Map<dia.Cell.ID, GraphLink>` with some sugar.
 * @example
 * ```ts
 * const links = new GraphLinks();
 * links.set('link-1', { id: 'link-1', source: 'element-1', target: 'element-2' });
 * links.set('link-2', { id: 'link-2', source: 'element-2', target: 'element-3' });
 * ```
 *
 * @group Graph
 * @see https://docs.jointjs.com/learn/features/shapes/links/#dialink
 */

export class GraphLinks<Link extends GraphLinkBase = GraphLink> extends CellMap<Link> {}
