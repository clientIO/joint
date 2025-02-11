import { dia, util } from '@joint/core'
import { createPortal } from 'react-dom'

const elementMarkup = util.svg/* xml */ `
    <rect @selector="body"/>
    <foreignObject @selector="fo">
        <div @selector="portal"></div>
    </foreignObject>
`

/**
 * A custom JointJS element that can render React components.
 */
export class ReactElement extends dia.Element {
  /**
   * Sets the default attributes for the ReactElement.
   * @returns The default attributes.
   */
  defaults() {
    return {
      ...super.defaults,
      componentType: 'react',
      type: 'react',
      size: { width: 100, height: 80 },
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
        },
        portal: {
          style: {
            height: '100%',
            width: '100%',
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

  /**
   * Mounts a React component into the element's portal.
   * @param paper The JointJS paper instance.
   * @param component The React component to mount.
   * @returns The portal containing the React component, or null if the portal element is not found.
   */
  mountReactComponent<T>(paper: dia.Paper, component: React.ReactElement<T>) {
    const portalElement = this.findView(paper)?.findNode('portal')
    if (!portalElement) {
      return null
    }
    return createPortal(component, portalElement)
  }
}
