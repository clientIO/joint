import { dia } from '@joint/core';

export const REACT_PAPER_LINK_TYPE = 'ReactPaperLink';

/**
 * Link model for ReactPaper with empty markup.
 * React renders link content directly.
 * @group Models
 * @experimental
 */
export class ReactPaperLink<Attributes = dia.Link.Attributes> extends dia.Link<
  dia.Link.Attributes & Attributes
> {
  /**
   * Empty markup - React will render link content directly.
   */
  markup: dia.MarkupJSON = [];

  /**
   * Sets the default attributes for the ReactPaperLink.
   * @returns The default attributes.
   */
  defaults() {
    return {
      ...super.defaults,
      type: REACT_PAPER_LINK_TYPE,
    } as unknown as dia.Link.Attributes & Attributes;
  }
}
