import { dia } from '@joint/core';
import { jsx } from '../utils/joint-jsx/jsx-to-markup';
export const REACT_TYPE = 'ReactElement';

const elementMarkup = jsx(<rect joint-selector="placeholder" />);
/**
 * A custom JointJS element that can render React components.
 * @group Models
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

/**
 * Creates a new ReactElement instance.
 * @param options - The attributes for the ReactElement.
 * @returns A new ReactElement instance.
 * @group Models
 */
export function createElement<Attributes = dia.Element.Attributes>(
  options?: Attributes & dia.Element.Attributes
) {
  return new ReactElement(options);
}
