import { dia } from '@joint/core';
export const REACT_LINK_TYPE = 'standard.Link';

/**
 * A custom JointJS link that can render React components.
 * @group Models
 * @example
 * ```ts
 * import { ReactLink } from '@joint/react';
 *
 * const link = new ReactLink({
 *   id: 'link-1',
 *   source: '1',
 *   target: '2',
 * });
 * ```
 */
export class ReactLink<Attributes = dia.Link.Attributes> extends dia.Link<
  dia.Link.Attributes & Attributes
> {
  /**
   * Sets the default attributes for the ReactLink.
   * @returns The default attributes.
   */
  defaults() {
    return {
      ...super.defaults,
      type: REACT_LINK_TYPE,
    } as unknown as dia.Link.Attributes & Attributes;
  }
  markup: string | dia.MarkupJSON = [
    {
      tagName: 'path',
      selector: 'wrapper',
    },
    {
      tagName: 'path',
      selector: 'line',
    },
  ];
}
