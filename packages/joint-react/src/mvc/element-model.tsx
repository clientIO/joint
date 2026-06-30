import { dia } from '@joint/core';
import type { PortalHostCell } from './paper.types';
/**
 * The `type` value `@joint/react` stamps on every {@link ElementModel}
 * (`'element'`). Match it against a cell's `type` to single out React elements
 * when iterating the graph.
 * @group MVC
 */
export const ELEMENT_MODEL_TYPE = 'element';

/**
 * Selector for the `<g>` element used as the React portal target inside ElementModel markup.
 * @internal
 */
export const PORTAL_SELECTOR = '__portal__';

/**
 * The element class `@joint/react` registers and uses by default for every
 * element you add to the graph. Its markup carries a dedicated `<g>` group (the
 * `'__portal__'` selector) where your {@link RenderElement} output is mounted, so
 * React content renders beneath the element's ports and highlighters. Extend it
 * to customize the markup or default attributes, or supply any `dia.Element`
 * subclass that implements {@link PortalHostCell} to host React content yourself.
 * @group MVC
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
export class ElementModel<
  Attributes extends dia.Element.Attributes = dia.Element.Attributes
> extends dia.Element<Attributes> implements PortalHostCell {
  /**
   * Selector of the node in this cell's view where `@joint/react` mounts your
   * {@link RenderElement} content, the `'__portal__'` `<g>` group.
   */
  portalSelector = PORTAL_SELECTOR;

  /**
   * Markup with a single `<g>` group (`'__portal__'`) that hosts the React
   * portal. JointJS appends ports and highlighters after this group, so they
   * paint on top of your React content.
   */
  markup: dia.MarkupJSON = [
    {
      tagName: 'g',
      selector: PORTAL_SELECTOR,
    },
  ];

  /**
   * Default attributes applied to every ElementModel: the `'element'` type, a
   * 0x0 size, and an empty `data` object.
   * @returns The default attributes.
   */
  defaults(): Attributes {
    // @ts-expect-error super.defaults is not a function in JS, but
    // `defaults` must be a function according to `joint-core/types/mvc.d.ts`.
    return {
      ...super.defaults,
      type: ELEMENT_MODEL_TYPE,
      size: { width: 0, height: 0 },
      // Explicitly set attributes to avoid triggering `change` events.
      // See `element-mapper.ts` to see the values representing "no value"
      data: {},
    };
  }
}
