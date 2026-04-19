import { dia } from '@joint/core';
import { PORTAL_SELECTOR } from './element-model';
import { linkStyle } from '../presets/link-style';

export const LINK_MODEL_TYPE = 'LinkModel';

const defaultLinkStyle: dia.Link.Attributes['attrs'] = linkStyle();

/**
 * A custom JointJS link that can render React components.
 * Provides wrapper, line, and portal markup. React renders additional content via portal.
 *
 * Theme-derived visual properties (colors, stroke widths, defaultLabel) are not
 * set here — they are applied at mapping time by the link mapper, so the theme
 * can be overridden via GraphProvider.
 * @group Models
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
export class LinkModel<Attributes = dia.Link.Attributes> extends dia.Link<
  dia.Link.Attributes & Attributes
> {
  /**
   * Sets the default attributes for the LinkModel.
   * Includes `connection: true` attrs which are required for JointJS to compute link paths.
   * @returns The default attributes.
   */
  defaults() {
    return {
      ...super.defaults,
      type: LINK_MODEL_TYPE,
      attrs: defaultLinkStyle,
      // Explicitly set attributes to avoid triggering `change` events.
      // See `link-mapper.ts` to see the values representing "no value"
      data: {},
    } as unknown as dia.Link.Attributes & Attributes;
  }

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
    // @todo: should we remove it for now?
    {
      tagName: 'g',
      selector: PORTAL_SELECTOR,
    },
  ];
}
