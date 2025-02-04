import { useContext, useEffect, useState } from 'react'
import { PaperContext } from '../context/paper-context'
import type { PaperOptions } from '../utils/create-paper'
import { createPaper } from '../utils/create-paper'
import type { dia } from '@joint/core'
import { useGraph } from './use-graph'

/**
 * Custom hook to use a JointJS paper instance.
 * It first tries to get the paper from the PaperContext. If not available, it creates a new paper instance.
 * @param options Options for creating the paper, used only if the paper is not available in the context.
 * @returns The JointJS paper instance.
 */
export function usePaper(options?: PaperOptions): dia.Paper {
  const graph = useGraph()
  if (!graph) {
    throw new Error('usePaper must be used within a GraphProvider')
  }
  // Try to get the paper from the context, it can be undefined if there is no PaperContext.
  const paperCtx = useContext(PaperContext)
  // If paper is not inside the PaperContext, create a new paper instance.
  const [paperState] = useState<dia.Paper | null>(() => {
    if (paperCtx) {
      return null
    }
    return createPaper(graph, options)
  })

  // Remove the paper when the component is unmounted.
  useEffect(() => {
    return () => {
      paperState?.remove()
    }
  }, [paperState])

  const paper = paperCtx ?? paperState

  if (!paper) {
    // This throw should never happen, it's just to make TypeScript happy and return a paper instance.
    throw new Error('Paper not found')
  }
  return paper
}
