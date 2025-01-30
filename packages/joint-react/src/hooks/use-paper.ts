import { useContext, useState } from 'react'
import { PaperContext } from '../context/paper-context'
import { createPaper } from '../utils/create-paper'
import type { dia } from '@joint/core'
import { useGraph } from './use-graph'

/**
 * Use paper hook, it will firstly try to get the paper from the paper context, if it's not available, it will create a new paper instance
 * Options are used only if it's used outside of the paper context, otherwise it will use the paper context options
 */
export function usePaper(options?: dia.Paper.Options): dia.Paper {
  const graph = useGraph()
  // try to get context paper, it can be undefined, if there is not paper context
  const paperCtx = useContext(PaperContext)
  if (!graph) {
    throw new Error('usePaper must be used within a GraphProvider')
  }
  // if paper is not inside the paper context, it will create a new paper instead
  const [paperState] = useState<dia.Paper | null>(() => {
    if (paperCtx) {
      return null
    }
    return createPaper(graph, options)
  })

  const paper = paperCtx ?? paperState

  if (!paper) {
    // this throw should never happen, it's just to make typescript happy and return a paper instance
    throw new Error('Paper not found')
  }
  return paper
}
