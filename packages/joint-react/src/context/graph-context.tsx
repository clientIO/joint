import type { dia } from '@joint/core'
import { createContext } from 'react'

export const GraphContext = createContext<dia.Graph | undefined>(undefined)
