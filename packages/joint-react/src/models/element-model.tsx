import { dia } from '@joint/core';
export const ELEMENT_MODEL_TYPE = 'ElementModel';

/**
 * Selector for the `<g>` element used as the React portal target inside ElementModel markup.
 * @group Models
 */
export const PORTAL_SELECTOR = '__portal__';

/**
 * A custom JointJS element that can render React components.
 * @group Models
 * @example
 * ```ts
 * import { ElementModel } from '@joint/react';
 *
 * const element = new ElementModel({
 *   id: '1',
 *   position: { x: 10, y: 20 },
 *   size: { width: 100, height: 50 },
 * });
 * ```
 */
export class ElementModel<Attributes = dia.Element.Attributes> extends dia.Element<
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
   * Sets the default attributes for the ElementModel.
   * @returns The default attributes.
   */
  defaults() {
    return {
      ...super.defaults,
      type: ELEMENT_MODEL_TYPE,
      size: { width: 0, height: 0 },
      // Explicitly set attributes to avoid triggering `change` events.
      // See `element-mapper.ts` to see the values representing "no value"
      data: {},
      ports: null,
      portDefaults: null,
    } as unknown as dia.Element.Attributes & Attributes;
  }
}
