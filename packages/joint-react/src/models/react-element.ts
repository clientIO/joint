import { dia, util } from '@joint/core';
export const REACT_TYPE = 'react';
const elementMarkup = util.svg/* xml */ `
    <rect @selector="rect">
    </rect>
    
`;

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

  /**
   * Initializes the markup for the ReactElement.
   */
  preinitialize() {
    this.markup = elementMarkup;
  }
}

export function createElement<Attributes = dia.Element.Attributes>(
  options?: Attributes & dia.Element.Attributes
) {
  return new ReactElement(options);
}
