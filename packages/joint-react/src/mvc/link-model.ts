import { dia } from '@joint/core';
import { linkStyle } from '../presets/link-style';
import type { PortalHostCell } from './paper.types';

/**
 * The `type` value `@joint/react` stamps on every {@link LinkModel} (`'link'`).
 * Match it against a cell's `type` to single out React links when iterating the
 * graph.
 * @group MVC
 */
export const LINK_MODEL_TYPE = 'link';

const defaultLinkStyle: dia.Link.Attributes['attrs'] = linkStyle();

/**
 * The link class `@joint/react` registers and uses by default for every link you
 * add to the graph. Its markup has two paths, a wide transparent `wrapper` that
 * widens the pointer hit area and the visible `line`, and it mounts the
 * experimental {@link RenderLink} output into the link's root `<g>`. Extend it to
 * customize the markup or default attributes, or supply any `dia.Link` subclass
 * that implements {@link PortalHostCell} to host React content yourself.
 * @group MVC
 * @example
 * ```ts
 * import { LinkModel } from '@joint/react';
 *
 * const link = new LinkModel({
 *   id: 'link-1',
 *   source: { id: '1' },
 *   target: { id: '2' },
 * });
 * ```
 */
export class LinkModel<
  Attributes extends dia.Link.Attributes = dia.Link.Attributes
> extends dia.Link<Attributes> implements PortalHostCell {
  /**
   * Selector of the node in this cell's view where `@joint/react` mounts React
   * content, the link's root `<g>` (`'root'`). The markup keeps no dedicated
   * portal group so React-less links stay lean; the experimental
   * {@link RenderLink} mounts here when enabled.
   */
  portalSelector = 'root';

  /**
   * Markup with two paths: a wide, transparent `wrapper` that widens the pointer
   * hit area, and the visible `line`. React content (if any) mounts into the
   * link's root `<g>` via {@link RenderLink}.
   */
  markup: dia.MarkupJSON = [
    {
      tagName: 'path',
      selector: 'wrapper',
      className: 'jj-link-wrapper',
      attributes: {
        fill: 'none',
        cursor: 'pointer',
        strokeLinejoin: 'round',
      },
    },
    {
      tagName: 'path',
      selector: 'line',
      className: 'jj-link-line',
      attributes: {
        fill: 'none',
        pointerEvents: 'none',
        strokeLinejoin: 'round',
      },
    },
  ];

  /**
   * Default attributes for every LinkModel: the `'link'` type, the default link
   * styling, and an empty `data` object. The styling sets `connection: true` on
   * the `line`/`wrapper` paths, which JointJS needs to compute the link path.
   * @returns The default attributes.
   */
  defaults(): Attributes {
    // @ts-expect-error super.defaults is not a function in JS, but
    // `defaults` must be a function according to `joint-core/types/mvc.d.ts`.
    return {
      ...super.defaults,
      type: LINK_MODEL_TYPE,
      attrs: defaultLinkStyle,
      // Explicitly set attributes to avoid triggering `change` events.
      // See `link-mapper.ts` to see the values representing "no value"
      data: {},
    };
  }
}
