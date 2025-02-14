/* eslint-disable react-hooks/exhaustive-deps */
import type { dia } from '@joint/core'
import { useCallback, useEffect } from 'react'
import { useGraph } from './use-graph'

const DEFAULT_DEPENDENCIES: unknown[] = []

export function useElementEffect(
  idOrIds: dia.Cell.ID | Array<dia.Cell.ID> | undefined,
  onChange: (element: dia.Element) => (() => void) | void,
  dependencies: unknown[] = DEFAULT_DEPENDENCIES
) {
  const graph = useGraph()

  const resolve = useCallback(
    (id: dia.Cell.ID) => {
      const element = graph.getCell(id)
      if (!element) {
        return
      }
      if (!element.isElement()) {
        return
      }
      const cleanup = onChange(element)
      return cleanup
    },
    [graph, onChange]
  )
  useEffect(() => {
    if (idOrIds === undefined) {
      return
    }
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds]
    const cleanups = ids.map(resolve)
    return () => {
      for (const cleanup of cleanups) {
        if (typeof cleanup === 'function') {
          cleanup()
        }
      }
    }
  }, [graph, idOrIds, onChange, ...dependencies])
}
