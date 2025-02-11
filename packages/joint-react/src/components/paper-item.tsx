import type { CSSProperties } from 'react'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import typedMemo from '../utils/typed-memo'
import type { BaseElement, RequiredCell } from '../types/cell.types'
import { useGraphStore } from '../hooks/use-graph-store'

const ITEM_STYLE: CSSProperties = { position: 'absolute' }
export interface PaperPortalProps<T extends RequiredCell = BaseElement> {
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
function Component<T extends RequiredCell = BaseElement>(props: PaperPortalProps<T>) {
  const { renderElement, portalHtmlElement, ...rest } = props
  const cell = rest as unknown as T
  const { graph } = useGraphStore()
  const divElement = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!divElement.current) {
      return
    }
    const graphCell = graph.getCell(cell.id)
    const hasSize = graphCell.attributes.size > 0
    if (hasSize) {
      return
    }
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      graphCell.set('size', {
        width,
        height,
      })
    })
    resizeObserver.observe(divElement.current)
    return () => {
      resizeObserver.disconnect()
    }
  }, [cell.id, graph, divElement])

  const element = (
    <div style={ITEM_STYLE} ref={divElement}>
      {renderElement(cell)}
    </div>
  )
  return createPortal(element, portalHtmlElement)
}

export const PaperItem = typedMemo(Component)
