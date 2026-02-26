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
        },
        line: {
          connection: true,
        }
      }
    } as unknown as dia.Link.Attributes & Attributes;
  }

  defaultLabel: dia.Link.Label = {
    markup: [
      {
        tagName: 'rect',
        selector: 'labelBody',
        attributes: {
          fill: '#ffffff',
          stroke: '#333333',
          strokeWidth: 1,
          rx: 4,
          ry: 4,
        }
      },
      {
        tagName: 'text',
        selector: 'labelText',
        attributes: {
          fill: '#333333',
          fontSize: 12,
          fontFamily: 'sans-serif',
          textAnchor: 'middle',
          pointerEvents: 'none',
        }
      },
    ],
    attrs: {
      labelText: {
        textVerticalAnchor: 'middle',
      },
      labelBody: {
        ref: 'labelText',
        x: 'calc(x - 4)',
        y: 'calc(y - 2)',
        width: 'calc(w + 8)',
        height: 'calc(h + 4)',
      },
    },
    position: {
      distance: 0.5,
    },
  };

  markup: dia.MarkupJSON = [
    {
      tagName: 'path',
      selector: 'wrapper',
      attributes: {
        fill: 'none',
        cursor: 'pointer',
        stroke: 'transparent',
        strokeLinecap: 'round',
        strokeWidth: 10,
        strokeLinejoin: 'round',
      },
    },
    {
      tagName: 'path',
      selector: 'line',
      attributes: {
        fill: 'none',
        pointerEvents: 'none',
        stroke: '#333333',
        strokeWidth: 2,
        strokeLinejoin: 'round',
      },
    },
  ];
}
