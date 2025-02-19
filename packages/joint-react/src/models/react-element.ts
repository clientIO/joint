import { dia, util } from '@joint/core'

const elementMarkup = util.svg/* xml */ `
    <foreignObject @selector="fo">
         <div @selector="portal"></div>
    </foreignObject>
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
      data: {},
      attrs: {
        fo: {
          width: 'calc(w)',
          height: 'calc(h)',
          style: {
            overflow: 'visible',
            position: 'relative',
          },
        },
        portal: {
          style: {
            width: '100%',
            height: '100%',
          },
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
