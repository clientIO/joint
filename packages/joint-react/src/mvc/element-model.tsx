import { dia } from '@joint/core';
import type { PortalHostCell } from './paper.types';
/**
 * Type discriminator for {@link ElementModel} — matches `dia.Cell.type` to
 * identify React-element cells when iterating the graph.
 * @group MVC
 */
export const ELEMENT_MODEL_TYPE = 'element';

/**
 * Selector for the `<g>` element used as the React portal target inside ElementModel markup.
 * @group MVC
 */
export const PORTAL_SELECTOR = '__portal__';

/**
 * Default element class used by `@joint/react`. Any `dia.Cell` subclass
 * implementing {@link PortalHostCell} can host React content; this one is
 * what `@joint/react` reaches for when no custom element class is provided.
 * Adds a dedicated `<g>` group to its markup where `renderElement` mounts.
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
   * Selector of the node that serves as the React portal target inside this cell.
   * Read by `PaperView` to locate where `renderElement` mounts.
   */
  portalSelector = PORTAL_SELECTOR;

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
