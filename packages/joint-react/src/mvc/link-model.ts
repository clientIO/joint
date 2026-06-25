import { dia } from '@joint/core';
import { linkStyle } from '../presets/link-style';
import type { PortalHostCell } from './paper.types';

/**
 * Type discriminator for {@link LinkModel} — matches `dia.Cell.type` to
 * identify React-link cells when iterating the graph.
 * @group MVC
 */
export const LINK_MODEL_TYPE = 'link';

const defaultLinkStyle: dia.Link.Attributes['attrs'] = linkStyle();

/**
 * Default link class used by `@joint/react`. Any `dia.Link` subclass can host
 * React content; `LinkModel` is just what `@joint/react` reaches for when no
 * custom class is provided. Ships wrapper + line markup with the default
 * link style applied.
 * @group MVC
 * @example
 * ```ts
 * import { LinkModel } from '@joint/react';
 *
 * const link = new LinkModel({
 *   id: 'link-1',
 *   source: '1',
 *   target: '2',
 * });
 * ```
 */
export class LinkModel<
  Attributes extends dia.Link.Attributes = dia.Link.Attributes
> extends dia.Link<Attributes> implements PortalHostCell {
  /**
   * Selector of the node that serves as the React portal target inside this cell.
   * Links render into their root `<g>` — the experimental `renderLink` mounts
   * there when enabled. No dedicated portal group is kept in the markup so
   * React-less links stay lean.
   */
  portalSelector = 'root';

  /**
   * Markup with wrapper and line paths. The wrapper is used for hit testing and has a wider stroke, while the line is used for visual display.
   * React content (if any) is rendered into the root `<g>` via `renderLink`.
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
   * Sets the default attributes for the LinkModel.
   * Includes `connection: true` attrs which are required for JointJS to compute link paths.
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
