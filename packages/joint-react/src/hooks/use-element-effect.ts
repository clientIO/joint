/* eslint-disable react-hooks/exhaustive-deps */
import type { dia } from '@joint/core'
import { useCallback, useEffect } from 'react'
import { useGraph } from './use-graph'

const DEFAULT_DEPENDENCIES: unknown[] = []

/**
 * Custom hook to manipulate a JointJS graph element based on React state.
 * It works similarly to react useEffect, but it is specific to JointJS elements.
 *
 * @param idOrIds - The ID or array of IDs of the JointJS elements to observe.
 * @param onChange - Callback function to execute when the element changes.
 * @param dependencies - Array of dependencies for the useEffect hook.
 */
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
