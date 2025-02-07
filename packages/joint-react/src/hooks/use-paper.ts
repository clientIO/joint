import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { PaperContext } from '../context/paper-context'
import type { PaperOptions } from '../utils/create-paper'
import { createPaper, PAPER_PORTAL_RENDER_EVENT } from '../utils/create-paper'
import { mvc, type dia } from '@joint/core'
import { useGraphStore } from './use-graph-store'

interface UsePaperOptions extends PaperOptions {
  readonly onRenderElement?: (element: dia.Element, portalElement: HTMLElement) => void
}
/**
 * Custom hook to use a JointJS paper instance.
 * It retrieves the paper from the PaperContext or creates a new instance.
 * Return a reference to the paper HTML element.
 */
export function usePaper(options?: UsePaperOptions) {
  const { onRenderElement, ...restOptions } = options ?? {}
  const hasRenderElement = !!onRenderElement
  const paperHtmlElement = useRef<HTMLDivElement | null>(null)
  const graphStore = useGraphStore()
  if (!graphStore) {
    throw new Error('usePaper must be used within a GraphProvider')
  }
  // Try to get the paper from the context, it can be undefined if there is no PaperContext.
  const paperCtx = useContext(PaperContext)
  // If paper is not inside the PaperContext, create a new paper instance.
  const [paperState] = useState<dia.Paper | null>(() => {
    if (paperCtx) {
      return null
    }
    return createPaper(graphStore.graph, restOptions)
  })

  const paper = paperCtx ?? paperState

  if (!paper) {
    // This throw should never happen, it's just to make TypeScript happy and return a paper instance.
    throw new Error('Paper not found')
  }

  const resizePaperContainer = useCallback(() => {
    if (paperHtmlElement.current) {
      paperHtmlElement.current.style.width = paper.el.style.width
      paperHtmlElement.current.style.height = paper.el.style.height
    }
  }, [paper])

  const listener = useCallback(() => {
    // An object to keep track of the listeners. It's not exposed, so the users
    // can't undesirably remove the listeners.
    const controller = new mvc.Listener()

    // Update the elements state when the graph data changes

    controller.listenTo(paper, 'resize', resizePaperContainer)

    // We need to setup the react state for the element only when renderElement is provided
    if (hasRenderElement) {
      // Update the portal node reference when the element view is rendered
      controller.listenTo(
        paper,
        PAPER_PORTAL_RENDER_EVENT,
        ({ model: cell }: dia.ElementView, portalElement: HTMLElement) => {
          onRenderElement(cell, portalElement)
        }
      )
    }

    return () => controller.stopListening()
  }, [paper, onRenderElement, hasRenderElement, resizePaperContainer])

  useEffect(() => {
    paperHtmlElement.current?.append(paper.el)
    resizePaperContainer()
    paper.unfreeze()

    const unsubscribe = listener()

    return () => {
      paper.freeze()
      unsubscribe()
    }
  }, [listener, paper, resizePaperContainer])

  return paperHtmlElement
}
