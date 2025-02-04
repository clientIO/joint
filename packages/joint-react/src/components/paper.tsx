/* eslint-disable sonarjs/no-nested-functions */
import { mvc, type dia } from '@joint/core'
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { usePaper } from '../hooks/use-paper'
import { useGraph } from '../hooks/use-graph'
import { PaperPortal } from './paper-portal'
import { PAPER_PORTAL_RENDER_EVENT } from '../utils/create-paper'

/**
 * The props for the Paper component. Extend the `dia.Paper.Options` interface.
 * For more information, see the JointJS documentation.
 * @see https://docs.jointjs.com/api/dia/Paper
 */
export interface PaperProps extends dia.Paper.Options {
  /**
   * A function that renders the element. It is called every time the element is rendered.
   */
  renderElement?: (element: dia.Cell) => ReactNode
  /**
   * A function that is called when the paper is ready.
   * @param paper The JointJS paper instance.
   */
  onReady?: (paper: dia.Paper) => void

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
}

export interface PaperElement {
  cell: dia.Cell
  containerElement: HTMLElement
  version: number
}

/**
 * Paper component that renders the JointJS paper element.
 */
function Component(props: Readonly<PaperProps>) {
  const { renderElement, onReady, style, className, ...paperOptions } = props

  const paperWrapperElementRef = useRef<HTMLDivElement | null>(null)
  const paper = usePaper(paperOptions)
  const graph = useGraph()

  const [elements, setElements] = useState<PaperElement[]>([])

  const resizePaperWrapper = useCallback(() => {
    if (paperWrapperElementRef.current) {
      paperWrapperElementRef.current.style.width = paper.el.style.width
      paperWrapperElementRef.current.style.height = paper.el.style.height
    }
  }, [paper])

  const bindEvents = useCallback(() => {
    // An object to keep track of the listeners. It's not exposed, so the users
    // can't undesirably remove the listeners.
    const controller = new mvc.Listener()

    // Update the elements state when the graph data changes

    controller.listenTo(paper, 'resize', resizePaperWrapper)

    // We need to setup the react state for the element only when renderElement is provided
    if (renderElement) {
      controller.listenTo(graph, 'change', (cell: dia.Cell) => {
        setElements((previousState) => {
          const { id } = cell
          const element = previousState.find((e) => e.cell.id === id)
          if (element) {
            element.version += 1
            return [...previousState]
          }
          return previousState
        })
      })
      controller.listenTo(graph, 'remove', (model: dia.Cell) => {
        setElements((previousState) => {
          const { id } = model
          return previousState.filter((element) => element.cell.id !== id) // Remove the element
        })
      })

      // Update the portal node reference when the element view is rendered
      controller.listenTo(
        paper,
        PAPER_PORTAL_RENDER_EVENT,
        ({ model: cell }: dia.ElementView, portalElement: HTMLElement) => {
          setElements((previousElements) => {
            const newElements = previousElements.filter(({ cell: { id } }) => id !== cell.id)
            return [...newElements, { cell, containerElement: portalElement, version: 0 }]
          })
        }
      )
    }

    return () => controller.stopListening()
  }, [graph, paper, renderElement, resizePaperWrapper])

  useEffect(() => {
    console.log('why mounbt?')
    paperWrapperElementRef.current?.append(paper.el)
    resizePaperWrapper()
    paper.unfreeze()

    const unbindEvents = bindEvents()

    if (onReady) {
      onReady(paper)
    }

    return () => {
      paper.freeze()
      unbindEvents()
    }
  }, [bindEvents, graph, onReady, paper, resizePaperWrapper]) // options, onReady, onEvent, style

  const hasRenderElement = !!renderElement
  console.log('Paper render')
  return (
    <div className={className} ref={paperWrapperElementRef} style={style}>
      {hasRenderElement &&
        elements.map((element) => {
          return (
            <PaperPortal
              key={element.cell.id}
              cell={element.cell}
              containerElement={element.containerElement}
              renderElement={renderElement}
              version={element.version}
            />
          )
        })}
    </div>
  )
}

export const Paper = memo(Component)
