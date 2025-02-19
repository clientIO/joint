import { type dia } from '@joint/core'
import { useCallback, useContext, useState, type CSSProperties, type ReactNode } from 'react'
import { useCreatePaper } from '../hooks/use-create-paper'
import { PaperItem } from './paper-item'
import { useElements } from '../hooks/use-elements'
import type { BaseElement, RequiredCell } from '../types/cell.types'
import typedMemo from '../utils/typed-memo'
import { defaultElementSelector } from '../utils/cell/to-react-cell'
import { PaperContext } from '../context/paper-context'
import { GraphStoreContext } from '../context/graph-store-context'
import { GraphProvider } from './graph-provider'
import { CellIdContext } from '../context/cell-context'

export type RenderElement<T extends RequiredCell = BaseElement> = (element: T) => ReactNode
/**
 * The props for the Paper component. Extend the `dia.Paper.Options` interface.
 * For more information, see the JointJS documentation.
 * @see https://docs.jointjs.com/api/dia/Paper
 */
export interface PaperProps<T extends RequiredCell = BaseElement> extends dia.Paper.Options {
  /**
   * A function that renders the element. It is called every time the element is rendered.
   * @default (element: T) => BaseElement
   */
  renderElement?: RenderElement<T>
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
   * A function that selects the elements to be rendered.
   * It defaults to the `defaultElementSelector` function which return `BaseElement` because dia.Element is not a valid React element (it do not change reference after update).
   * @default (item: dia.Cell) => BaseElement
   */
  elementSelector?: (item: dia.Cell) => T

  scale?: number

  noDataPlaceholder?: ReactNode

  children?: ReactNode

  onEvent?: (paper: dia.Paper, eventName: string, ...args: unknown[]) => void
}

/**
 * Paper component that renders the JointJS paper element.
 */
function Component<T extends RequiredCell = BaseElement>(props: Readonly<PaperProps<T>>) {
  const {
    renderElement,
    onReady,
    style,
    className,
    elementSelector = defaultElementSelector,
    scale,
    children,
    ...paperOptions
  } = props

  const [svgGElements, setSvgGElements] = useState<Record<dia.Cell.ID, SVGGElement>>({})

  const onRenderElement = useCallback(
    (element: dia.Element, nodeSvgGElement: SVGGElement) => {
      onReady?.()
      setSvgGElements((previousState) => {
        return {
          ...previousState,
          [element.id]: nodeSvgGElement,
        }
      })
    },
    [onReady]
  )

  const { paperHtmlElement, isPaperFromContext, paper } = useCreatePaper({
    ...paperOptions,
    scale,
    onRenderElement,
  })

  const elements = useElements((items) => items.map(elementSelector))

  const hasRenderElement = !!renderElement

  const content = (
    <div className={className} ref={paperHtmlElement} style={style}>
      {hasRenderElement &&
        elements.map((cell) => {
          const portalHtmlElement = svgGElements[cell.id]
          if (!portalHtmlElement) {
            return null
          }
          return (
            <CellIdContext.Provider key={cell.id} value={cell.id}>
              <PaperItem
                {...cell}
                nodeSvgGElement={portalHtmlElement}
                renderElement={renderElement}
              />
            </CellIdContext.Provider>
          )
        })}
    </div>
  )

  if (isPaperFromContext) {
    return content
  }

  return (
    <PaperContext.Provider value={paper}>
      {content}
      {children}
    </PaperContext.Provider>
  )
}

function PaperWithNoDataPlaceHolder<T extends RequiredCell = BaseElement>(
  props: Readonly<PaperProps<T>>
) {
  const { style, className, noDataPlaceholder, ...rest } = props

  const hasNoDataPlaceholder = !!noDataPlaceholder
  const elementsLength = useElements((items) => items.length)
  const isEmpty = elementsLength === 0

  if (isEmpty && hasNoDataPlaceholder) {
    return (
      <div style={style} className={className}>
        {noDataPlaceholder}
      </div>
    )
  }

  return <Component {...rest} style={style} className={className} />
}

function PaperWithGraphProvider<T extends RequiredCell = BaseElement>(
  props: Readonly<PaperProps<T>>
) {
  const hasStore = !!useContext(GraphStoreContext)
  const { children, ...rest } = props
  const paperContent = <PaperWithNoDataPlaceHolder {...rest}>{children}</PaperWithNoDataPlaceHolder>

  if (hasStore) {
    return paperContent
  }
  return <GraphProvider>{paperContent}</GraphProvider>
}
export const Paper = typedMemo(PaperWithGraphProvider)
