import { dia } from '@joint/core';
import { PORTAL_SELECTOR } from './portal-element';
import { buildLinkPresentationAttributes } from '../state/data-mapping/link-attributes';
import { defaultLinkStyle } from '../theme/link-theme';

export const PORTAL_LINK_TYPE = 'PortalLink';

const defaultPresentationAttrs: dia.Link.Attributes['attrs'] = buildLinkPresentationAttributes({}, defaultLinkStyle);

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
 * import { PortalLink } from '@joint/react';
 *
 * const link = new PortalLink({
 *   id: 'link-1',
 *   source: '1',
 *   target: '2',
 * });
 * ```
 */
export class PortalLink<Attributes = dia.Link.Attributes> extends dia.Link<
  dia.Link.Attributes & Attributes
> {
  /**
   * Sets the default attributes for the PortalLink.
   * Includes `connection: true` attrs which are required for JointJS to compute link paths.
   * @returns The default attributes.
   */
  defaults() {
    return {
      ...super.defaults,
      type: PORTAL_LINK_TYPE,
      attrs: defaultPresentationAttrs,
      // Explicitly set attributes to avoid triggering `change` events.
      // See `link-mapper.ts` to see the values representing "no value"
      data: {},
      labels: null,
    } as unknown as dia.Link.Attributes & Attributes;
  }

  markup: dia.MarkupJSON = [
    {
      tagName: 'path',
      selector: 'wrapper',
      attributes: {
        fill: 'none',
        cursor: 'pointer',
        strokeLinejoin: 'round',
      },
    },
    {
      tagName: 'path',
      selector: 'line',
      attributes: {
        fill: 'none',
        pointerEvents: 'none',
        strokeLinejoin: 'round',
      },
    },
    {
      tagName: 'g',
      selector: PORTAL_SELECTOR,
    },
  ];
}
