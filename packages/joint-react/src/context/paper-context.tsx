import type { dia } from '@joint/core'
import { createContext } from 'react'

/**
 * Paper context provides a paper instance to its children.
 * This context is internally used by the `PaperProvider` component. Use the `usePaper` hook to access the paper instead.
 */
export const PaperContext = createContext<dia.Paper | undefined>(undefined)
