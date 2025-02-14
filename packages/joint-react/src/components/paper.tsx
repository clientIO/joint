import { type dia } from '@joint/core'
import { useCallback, useState, type CSSProperties, type ReactNode } from 'react'
import { useCreatePaper } from '../hooks/use-create-paper'
import { PaperItem } from './paper-item'
import { useElements } from '../hooks/use-elements'
import type { BaseElement, RequiredCell } from '../types/cell.types'
import typedMemo from '../utils/typed-memo'
import { defaultElementSelector } from '../utils/cell/to-react-cell'
import { PaperContext } from '../context/paper-context'

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
   * The selector of the portal element.
   */
  portalSelector?: string | ((view: dia.ElementView) => HTMLElement | null)

  /**
   * A function that selects the elements to be rendered.
   * It defaults to the `defaultElementSelector` function which return `BaseElement` because dia.Element is not a valid React element (it do not change reference after update).
   * @default (item: dia.Cell) => BaseElement
   */
  elementSelector?: (item: dia.Cell) => T

  scale?: number

  noDataPlaceholder?: ReactNode
}

const DEFAULT_STYLE: CSSProperties = {
  width: '100%',
  height: '100%',
}
/**
 * Paper component that renders the JointJS paper element.
 */
function Component<T extends RequiredCell = BaseElement>(props: Readonly<PaperProps<T>>) {
  const {
    renderElement,
    onReady,
    style = DEFAULT_STYLE,
    className,
    elementSelector = defaultElementSelector,
    scale,
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
          const portalHtmlElement = htmlElements[cell.id]
          if (!portalHtmlElement) {
            return null
          }
          return (
            <PaperItem
              key={cell.id}
              {...cell}
              portalHtmlElement={portalHtmlElement}
              renderElement={renderElement}
            />
          )
        })}
    </div>
  )

  if (isPaperFromContext) {
    return content
  }

  return <PaperContext.Provider value={paper}>{content}</PaperContext.Provider>
}

function PaperComponent<T extends RequiredCell = BaseElement>(props: Readonly<PaperProps<T>>) {
  const { style = DEFAULT_STYLE, className, noDataPlaceholder, ...rest } = props

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
export const Paper = typedMemo(PaperComponent)
