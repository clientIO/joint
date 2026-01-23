import type { dia } from '@joint/core';

/**
 * Props for the BaseLink component.
 * BaseLink is used to set link properties when rendering custom links.
 */
export interface BaseLinkProps {
  /**
   * Link attributes to apply to the link.
   */
  readonly attrs?: dia.Link.Attributes;
  /**
   * Link markup to use for rendering.
   */
  readonly markup?: dia.MarkupJSON;
  /**
   * Additional link properties.
   */
  readonly [key: string]: unknown;
}
