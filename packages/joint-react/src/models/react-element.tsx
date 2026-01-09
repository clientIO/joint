import { dia } from '@joint/core';
import { jsx } from '../utils/joint-jsx/jsx-to-markup';
export const REACT_TYPE = 'ReactElement';

const elementMarkup = jsx(<rect joint-selector="placeholder" />);
/**
 * A custom JointJS element that can render React components.
 * @group Models
 * @example
 * ```ts
 * import { ReactElement } from '@joint/react';
 *
 * const element = new ReactElement({
 *   id: '1',
 *   position: { x: 10, y: 20 },
 *   size: { width: 100, height: 50 },
 * });
 * ```
 */
export class ReactElement<Attributes = dia.Element.Attributes> extends dia.Element<
  dia.Element.Attributes & Attributes
> {
  /**
   * Sets the default attributes for the ReactElement.
   * @returns The default attributes.
   */
  defaults() {
    return {
      ...super.defaults,
      type: REACT_TYPE,
      data: {},
      attrs: {
        root: {
          magnetSelector: 'placeholder',
          highlighterSelector: 'placeholder',
          containerSelector: 'placeholder',
        },
        placeholder: {
          width: 'calc(w)',
          height: 'calc(h)',
          fill: 'transparent',
        },
      },
    } as unknown as dia.Element.Attributes & Attributes;
  }
  markup: string | dia.MarkupJSON = elementMarkup;
}
