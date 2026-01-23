import { dia } from '@joint/core';
export const REACT_LINK_TYPE = 'ReactLink';

/**
 * A custom JointJS link that can render React components.
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
   * @returns The default attributes.
   */
  defaults() {
    return {
      ...super.defaults,
      attrs: {
        line: {
          connection: true,
          stroke: '#333333',
          strokeWidth: 2,
          strokeLinejoin: 'round',
          targetMarker: {
            type: 'path',
            d: 'M 10 -5 0 0 10 5 z',
          },
        },
        wrapper: {
          connection: true,
          strokeWidth: 10,
          strokeLinejoin: 'round',
        },
      },
      // defaultLabel: {
      //   markup: []
      // },
      type: REACT_LINK_TYPE,
    } as unknown as dia.Link.Attributes & Attributes;
  }

  markup: string | dia.MarkupJSON = [
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
