import { memo, type ReactNode } from 'react'
import type { PaperElement } from './paper'
import type { dia } from '@joint/core'
import { createPortal } from 'react-dom'

export interface PaperPortalProps extends PaperElement {
  /**
   * A function that renders the element. It is called every time the element is rendered.
   */
  renderElement: (element: dia.Cell.JSON) => ReactNode
}

/**
 * Helper paper render component wrapped in a portal.
 * This component is used to render a paper element inside a portal.
 * It takes a renderElement function, a cell, and a containerElement as props.
 * The renderElement function is called with the cell as an argument and its return value is rendered inside the containerElement.
 */
function Component(props: Readonly<PaperPortalProps>) {
  const { renderElement, cell, containerElement } = props
  return createPortal(renderElement(cell), containerElement)
}

export const PaperPortal = memo(Component)
