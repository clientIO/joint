import { useGraphStore } from './use-graph-store'
import type { dia } from '@joint/core'
import type { BaseLink } from '../types/cell.types'
import { useMemo, useSyncExternalStore } from 'react'
import { defaultLinkSelector } from '../utils/cell/to-react-cell'

/**
 * Custom hook to manage the state of graph cells with optional item selector.
 * @param selector A function to select the properties of the cells.  @default BaseCell
 * @returns A tuple containing the cells in JSON format and a setter function for updating the cells.
 */
export function useLinks<T = BaseLink>(selector: (item: dia.Link) => T = defaultLinkSelector): T[] {
  const graphStore = useGraphStore()

  const links = useSyncExternalStore(
    graphStore.subscribeToLinks,
    graphStore.getLinksSnapshot,
    graphStore.getLinksSnapshot
  )

  return useMemo(() => links.map((link) => selector(link)), [links, selector])
}
