import type { dia } from '@joint/core'
import { createContext } from 'react'

/**
 * Cell context provides a cell instance to its children.
 */
export const CellContext = createContext<dia.Cell | undefined>(undefined)
