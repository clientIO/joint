import type { dia, shapes } from '@joint/core';

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
export interface GraphLink<Type extends StandardLinkShapesType | string = string>
  extends dia.Link.EndJSON,
    Record<string, unknown> {
  /**
   * Unique identifier of the link.
   */
  readonly id: dia.Cell.ID;
  /**
   * Source element id.
   */
  readonly source: dia.Cell.ID | dia.Link.EndJSON;
  /**
   * Target element id.
   */
  readonly target: dia.Cell.ID | dia.Link.EndJSON;
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
