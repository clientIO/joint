import { type dia } from '@joint/core'
import { useCallback, useState, type CSSProperties, type ReactNode } from 'react'
import { usePaper } from '../hooks/use-paper'
import { PaperPortal } from './paper-portal'
import { useElements } from '../hooks/use-elements'
import type { RequiredCell } from '../types/cell.types'
import typedMemo from '../utils/typed-memo'

/**
 * The props for the Paper component. Extend the `dia.Paper.Options` interface.
 * For more information, see the JointJS documentation.
 * @see https://docs.jointjs.com/api/dia/Paper
 */
export interface PaperProps<T extends RequiredCell = dia.Cell> extends dia.Paper.Options {
  /**
   * A function that renders the element. It is called every time the element is rendered.
   */
  renderElement?: (element: T) => ReactNode
  /**
   * A function that is called when the paper is ready.
   */
  onReady?: () => void

  /**
   * The style of the paper element.
   */
  style?: CSSProperties
  /**
   * Class name of the paper element.
   */
  className?: string

  /**
   * The selector of the portal element.
   */
  portalSelector?: string | ((view: dia.ElementView) => HTMLElement | null)

  /**
   * A function that selects the elements to be rendered.
   * @default BaseCell
   */
  elementSelector?: (item: dia.Cell) => T
}

/**
 * Paper component that renders the JointJS paper element.
 */
function Component<T extends RequiredCell = dia.Cell>(props: Readonly<PaperProps<T>>) {
  const {
    renderElement,
    onReady,
    style,
    className,
    elementSelector = (items) => items as unknown as T,
    ...paperOptions
  } = props

  const [htmlElements, setHtmlElements] = useState<Record<dia.Cell.ID, HTMLElement>>({})

  const onRenderElement = useCallback(
    (element: dia.Element, portalElement: HTMLElement) => {
      onReady?.()
      setHtmlElements((previousState) => {
        return {
          ...previousState,
          [element.id]: portalElement,
        }
      })
    },
    [onReady]
  )

  const paperHtmlDivRef = usePaper({
    ...paperOptions,
    onRenderElement,
  })

  const elements = useElements((items) => items.map(elementSelector))
  const hasRenderElement = !!renderElement

  return (
    <div className={className} ref={paperHtmlDivRef} style={style}>
      {hasRenderElement &&
        elements.map((cell) => {
          const portalHtmlElement = htmlElements[cell.id]
          if (!portalHtmlElement) {
            return null
          }
          return (
            // <CellContext.Provider key={cell.id} value={cell}>
            <PaperPortal
              key={cell.id}
              {...cell}
              portalHtmlElement={portalHtmlElement}
              renderElement={renderElement}
            />
            // </CellContext.Provider>
          )
        })}
    </div>
  )
}

export const Paper = typedMemo(Component)
