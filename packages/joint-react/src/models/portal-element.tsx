import { dia } from '@joint/core';
export const PORTAL_ELEMENT_TYPE = 'PortalElement';

/**
 * Selector for the `<g>` element used as the React portal target inside PortalElement markup.
 * @group Models
 */
export const PORTAL_SELECTOR = '__portal__';

/**
 * A custom JointJS element that can render React components.
 * @group Models
 * @example
 * ```ts
 * import { PortalElement } from '@joint/react';
 *
 * const element = new PortalElement({
 *   id: '1',
 *   position: { x: 10, y: 20 },
 *   size: { width: 100, height: 50 },
 * });
 * ```
 */
export class PortalElement<Attributes = dia.Element.Attributes> extends dia.Element<
  dia.Element.Attributes & Attributes
> {
  /**
   * Markup containing a dedicated `<g>` group for React portal rendering.
   * Ports and highlighters are appended after this group, ensuring correct stacking order.
   */
  markup: dia.MarkupJSON = [
    {
      tagName: 'g',
      selector: PORTAL_SELECTOR,
    },
  ];

  /**
   * Sets the default attributes for the PortalElement.
   * @returns The default attributes.
   */
  defaults() {
    return {
      ...super.defaults,
      type: PORTAL_ELEMENT_TYPE,
      size: { width: 0, height: 0 },
      data: {},
      presentation: {},
    } as unknown as dia.Element.Attributes & Attributes;
  }
}
