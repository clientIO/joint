import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import typedMemo from '../utils/typed-memo'
import type { BaseCell, RequiredCell } from '../types/cell.types'

export interface PaperPortalProps<T extends RequiredCell = BaseCell> {
  /**
   * A function that renders the element. It is called every time the element is rendered.
   */
  readonly renderElement: (element: T) => ReactNode
  readonly portalHtmlElement: HTMLElement
}

/**
 * Helper paper render component wrapped in a portal.
 * This component is used to render a paper element inside a portal.
 * It takes a renderElement function, a cell, and a containerElement as props.
 * The renderElement function is called with the cell as an argument and its return value is rendered inside the containerElement.
 */
function Component<T extends RequiredCell = BaseCell>(props: PaperPortalProps<T> & T) {
  const { renderElement, portalHtmlElement, ...rest } = props
  const cell = rest as unknown as T
  return createPortal(renderElement(cell), portalHtmlElement)
}

export const PaperPortal = typedMemo(Component)
