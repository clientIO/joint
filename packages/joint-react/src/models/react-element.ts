import { dia, util } from '@joint/core'

const elementMarkup = util.svg/* xml */ `
    <rect @selector="body"/>
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
        body: {
          width: 'calc(w)',
          height: 'calc(h)',
          fill: 'transparent',
          stroke: 'none',
        },
        fo: {
          width: 'calc(w)',
          height: 'calc(h)',
          style: {
            overflow: 'visible',
          },
        },
        portal: {
          style: {
            width: '100%',
            height: '100%',
            position: 'fixed',
          },
        },
      },
    }
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
