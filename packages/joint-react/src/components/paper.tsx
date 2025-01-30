import { mvc, type dia } from '@joint/core'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { usePaper } from '../hooks/use-paper'
import { useGraph } from '../hooks/use-graph'

export const PORTAL_READY_EVENT = 'portal:ready'

/**
 * The props for the Paper component. Extend the `dia.Paper.Options` interface.
 * For more information, see the JointJS documentation.
 * @see https://docs.jointjs.com/api/dia/Paper
 */
export interface PaperProps extends dia.Paper.Options {
  /**
   * A function that renders the element. It is called every time the element is rendered.
   */
  renderElement?: (_element: dia.Element) => ReactNode
  /**
   * A function that is called when the paper is ready.
   * @param paper The JointJS paper instance.
   */
  onReady?: (paper: dia.Paper) => void
  /**
   * A function that is called when an event is triggered on the paper.
   * @param paper The JointJS paper instance.
   * @param args The arguments passed to the event.
   */
  onEvent?: (paper: dia.Paper, ...args: unknown[]) => void
  /**
   * The style of the paper element.
   */
  style?: CSSProperties
  /**
   * Class name of the paper element.
   */
  className?: string
  /**
   * The data attributes to listen to changes.
   */
  dataAttributes?: string[]
  /**
   * The selector of the portal element.
   */
  portalSelector?: string | ((view: dia.ElementView) => HTMLElement | null)
}

type ElementState = {
  id: dia.Cell.ID // ID of the element
  data: unknown // Data from the `model.get('data')`
  containerEl: HTMLElement | null // Reference to the container element
}

/**
 * Paper component that renders the JointJS paper element.
 */
export function Paper(props: Readonly<PaperProps>) {
  const {
    // renderElement,
    onReady,
    onEvent,
    style,
    className,
    dataAttributes = ['data'],
    // portalSelector = 'portal',
    ...paperOptions
  } = props

  const paperWrapperElementRef = useRef<HTMLDivElement | null>(null)
  const paper = usePaper(paperOptions)
  const graph = useGraph()

  // TODO - this is not used yet
  const [elements, setElements] = useState<Record<string, ElementState>>({})
  const elementPortals = Object.values(elements).map((element) => {
    return <div key={element.id}>{/* {renderElement ? renderElement(element) : null} */}</div>
  })
  // function resizePaperWrapper() {
  //   if (paperWrapperElementRef.current) {
  //     paperWrapperElementRef.current.style.width = paper.el.style.width
  //     paperWrapperElementRef.current.style.height = paper.el.style.height
  //   }
  // }

  const resizePaperWrapper = useCallback(() => {
    if (paperWrapperElementRef.current) {
      paperWrapperElementRef.current.style.width = paper.el.style.width
      paperWrapperElementRef.current.style.height = paper.el.style.height
    }
  }, [paper])

  function setElement(model: dia.Cell, containerElement?: HTMLElement): void {
    setElements((previousState) => {
      const { id } = model
      return {
        ...previousState,
        [id]: {
          id,
          data: model.get('data'),
          containerEl: containerElement ?? previousState[id]?.containerEl ?? null,
        },
      }
    })
  }

  // const setElementData = useCallback((id: dia.Cell.ID, data: unknown) => {
  //   setElements((previousState) => {
  //     return {
  //       ...previousState,
  //       [id]: {
  //         ...previousState[id],
  //         data,
  //       },
  //     }
  //   })
  // }, [])

  const bindEvents = useCallback(() => {
    // An object to keep track of the listeners. It's not exposed, so the users
    // can't undesirably remove the listeners.
    const controller = new mvc.Listener()

    // Update the elements state when the graph data changes
    const attributeChangeEvents = dataAttributes.map((attribute) => `change:${attribute}`).join(' ')

    controller.listenTo(graph, attributeChangeEvents, setElement)
    // Update the portal node reference when the element view is rendered
    controller.listenTo(paper, PORTAL_READY_EVENT, (elementView, portalElement) =>
      setElement(elementView.model, portalElement)
    )

    controller.listenTo(paper, 'resize', resizePaperWrapper)

    if (onEvent) {
      controller.listenTo(paper, 'all', (...args) => onEvent(paper, ...args))
    }

    return () => controller.stopListening()
  }, [dataAttributes, graph, onEvent, paper, resizePaperWrapper])

  useEffect(() => {
    paperWrapperElementRef.current?.append(paper.el)
    resizePaperWrapper()
    paper.unfreeze()

    const unbindEvents = bindEvents()
    if (onReady) {
      onReady(paper)
    }

    return () => {
      // I am not sure about removing the paper
      // paper.remove()
      paper.freeze()
      unbindEvents()
    }
  }, [bindEvents, dataAttributes, graph, onEvent, onReady, paper, resizePaperWrapper]) // options, onReady, onEvent, style
  return (
    <div className={className} ref={paperWrapperElementRef} style={style}>
      {elementPortals}
    </div>
  )
}
