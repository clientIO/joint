import { createContext } from 'react'
import type { GraphStore } from '../hooks/use-create-graph-store'

/**
 * Graph context provides a graph instance to its children.
 */
export const GraphStoreContext = createContext<GraphStore | undefined>(undefined)
