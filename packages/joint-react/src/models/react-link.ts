import { dia } from '@joint/core';
export const REACT_LINK_TYPE = 'ReactLink';

/**
 * A custom JointJS link that can render React components.
 * Uses empty markup - React renders content via portal using useLinkPath hook.
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
   * Includes `connection: true` attrs which are required for JointJS to compute link paths.
   * @returns The default attributes.
   */
  defaults() {
    return {
      ...super.defaults,
      type: REACT_LINK_TYPE,
      attrs: {
        wrapper: {
          connection: true,
          strokeWidth: 10,
          strokeLinejoin: 'round',
        },
        line: {
          connection: true,
          stroke: '#333333',
          strokeWidth: 2,
          strokeLinejoin: 'round',
        },
      },
    } as unknown as dia.Link.Attributes & Attributes;
  }

  markup: dia.MarkupJSON = [
    {
      tagName: 'path',
      selector: 'wrapper',
      attributes: {
        fill: 'none',
        cursor: 'pointer',
        stroke: 'transparent',
        'stroke-linecap': 'round',
      },
    },
    {
      tagName: 'path',
      selector: 'line',
      attributes: {
        fill: 'none',
        'pointer-events': 'none',
      },
    },
  ];
}
