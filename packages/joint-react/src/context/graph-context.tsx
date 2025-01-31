import type { dia } from '@joint/core'
import { createContext } from 'react'

/**
 * Graph context provides a graph instance to its children.
 */
export const GraphContext = createContext<dia.Graph | undefined>(undefined)
