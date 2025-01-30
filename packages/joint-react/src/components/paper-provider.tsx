import type { ReactNode } from 'react'
import { useState } from 'react'
import type { PaperOptions } from '../utils/create-paper'
import { createPaper } from '../utils/create-paper'
import { PaperContext } from '../context/paper-context'
import type { dia } from '@joint/core'
import { useGraph } from '../hooks/use-graph'

export interface PaperProviderProps extends PaperOptions {
  readonly children: ReactNode
}

/**
 * Paper provider creates a paper instance and provides it to its children.
 * It extends the paper options from the createPaper function.
 * For more information about paper, see the JointJS documentation.
 * @see https://docs.jointjs.com/api/dia/Paper
 */
export function PaperProvider({ children, ...paperOptions }: Readonly<PaperProviderProps>) {
  const graph = useGraph()
  if (!graph) {
    throw new Error('PaperProvider must be used within a GraphProvider')
  }

  const [paper] = useState<dia.Paper>(() => createPaper(graph, paperOptions))
  return <PaperContext.Provider value={paper}>{children}</PaperContext.Provider>
}
