import { dia, util } from '@joint/core'

const elementMarkup = util.svg/* xml */ `
    <rect @selector="rect">
    </rect>
    
`

/**
 * A custom JointJS element that can render React components.
 */
export class ReactElement<T = dia.Element.Attributes> extends dia.Element<
  dia.Element.Attributes & T
> {
  /**
   * Sets the default attributes for the ReactElement.
   * @returns The default attributes.
   */
  defaults() {
    return {
      ...super.defaults,
      componentType: 'react',
      type: 'react',
      fuck: true,
      data: {},
      attrs: {
        rect: {
          width: 'calc(w)',
          height: 'calc(h)',
          fill: 'transparent',
        },
      },
    } as unknown as dia.Element.Attributes & T
  }

  /**
   * Initializes the markup for the ReactElement.
   */
  preinitialize() {
    this.markup = elementMarkup
  }
}

export function createElement<T = dia.Element.Attributes>(options?: T & dia.Element.Attributes) {
  return new ReactElement(options)
}
