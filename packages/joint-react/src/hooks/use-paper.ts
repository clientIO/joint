import { useContext } from 'react'
import { PaperContext } from '../context/paper-context'
import type { dia } from '@joint/core'

export function usePaper(): dia.Paper {
  const paper = useContext(PaperContext)
  if (!paper) {
    throw new Error('usePaper must be used within a `PaperProvider` or `Paper` component')
  }
  return paper
}
