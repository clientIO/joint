import { dia } from '@joint/core';
import { jsx } from '@joint/react/src/utils/joint-jsx/jsx-to-markup';
export const REACT_TYPE = 'ReactElement';

const elementMarkup = jsx(<rect joint-selector="rect" />);
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
        rect: {
          width: 'calc(w)',
          height: 'calc(h)',
          fill: 'transparent',
        },
      },
    } as unknown as dia.Element.Attributes & Attributes;
  }
  markup: string | dia.MarkupJSON = elementMarkup;
}

export function createElement<Attributes = dia.Element.Attributes>(
  options?: Attributes & dia.Element.Attributes
) {
  return new ReactElement(options);
}
