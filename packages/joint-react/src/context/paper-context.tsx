import type { dia } from '@joint/core'
import { createContext } from 'react'

/**
 * Paper context provides a paper instance to its children.
 */
export const PaperContext = createContext<dia.Paper | undefined>(undefined)
