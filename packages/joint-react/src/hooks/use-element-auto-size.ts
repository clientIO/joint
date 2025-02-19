import { useLayoutEffect, useRef } from 'react'
import { useGraph } from './use-graph'
import type { dia } from '@joint/core'

/**
 * Custom hook to automatically update the size of a JointJS element based on the size of an HTML element.
 */
export function useElementAutoSize<T extends HTMLElement>(id?: dia.Cell.ID) {
  // Reference to the HTML element whose size will be observed.
  const htmlRef = useRef<T>(null)
  // Get the graph instance from the custom useGraph hook.
  const graph = useGraph()

  useLayoutEffect(() => {
    // If no id is provided, do nothing.
    if (id === undefined) {
      return
    }
    // If the HTML element reference is null, do nothing.
    if (htmlRef.current === null) {
      return
    }
    // Get the cell from the graph using the provided id.
    const cell = graph.getCell(id)
    if (!cell) {
      return
    }
    // Create a ResizeObserver to observe changes in the size of the HTML element.
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { borderBoxSize } = entry

        // If borderBoxSize is not available or empty, continue to the next entry.
        if (!borderBoxSize || borderBoxSize.length === 0) continue

        const [size] = borderBoxSize
        const { inlineSize, blockSize } = size
        // Update the size of the cell in the graph.
        cell.set('size', { width: inlineSize, height: blockSize })
      }
    })

    // Start observing the HTML element.
    observer.observe(htmlRef.current, { box: 'border-box' })
    // Cleanup function to disconnect the observer when the component unmounts or dependencies change.
    return () => {
      observer.disconnect()
    }
  }, [graph, id])

  // Return the reference to the HTML element.
  return htmlRef
}
