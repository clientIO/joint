import { dia } from '@joint/core';
export const REACT_TYPE = 'ReactElement';

/**
 * Selector for the `<g>` element used as the React portal target inside ReactElement markup.
 * @group Models
 */
export const REACT_PORTAL_SELECTOR = 'reactPortal';


/**
 * A custom JointJS element that can render React components.
 * @group Models
 * @example
 * ```ts
 * import { ReactElement } from '@joint/react';
 *
 * const element = new ReactElement({
 *   id: '1',
 *   position: { x: 10, y: 20 },
 *   size: { width: 100, height: 50 },
 * });
 * ```
 */
export class ReactElement<Attributes = dia.Element.Attributes> extends dia.Element<
  dia.Element.Attributes & Attributes
> {
  /**
   * Markup containing a dedicated `<g>` group for React portal rendering.
   * Ports and highlighters are appended after this group, ensuring correct stacking order.
   */
  markup: dia.MarkupJSON = [
    {
      tagName: 'g',
      selector: REACT_PORTAL_SELECTOR,
    },
  ];

  /**
   * Sets the default attributes for the ReactElement.
   * @returns The default attributes.
   */
  defaults() {
    return {
      ...super.defaults,
      type: REACT_TYPE,
    } as unknown as dia.Element.Attributes & Attributes;
  }
}
