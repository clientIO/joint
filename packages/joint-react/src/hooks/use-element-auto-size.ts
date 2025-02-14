import { useLayoutEffect, useRef } from 'react'
import { useGraph } from './use-graph'
import type { dia } from '@joint/core'

export function useElementAutoSize<T extends HTMLElement>(id?: dia.Cell.ID) {
  const htmlRef = useRef<T>(null)
  const graph = useGraph()

  useLayoutEffect(() => {
    if (id === undefined) {
      return
    }
    if (htmlRef.current === null) {
      return
    }
    const cell = graph.getCell(id)
    if (!cell) {
      return
    }
    cell.attr({
      // ...cell.attr(),
      portal: {
        style: {
          // height: 'auto',
          // width: 'auto',
          // position: 'fixed',
        },
      },
    })
    const observer = new ResizeObserver((entries) => {
      if (entries.length === 0) {
        return
      }
      const { width, height } = entries[0].contentRect
      cell.set('size', {
        width,
        height,
      })
    })
    observer.observe(htmlRef.current)
    return () => {
      observer.disconnect()
    }
  }, [graph, id])

  return htmlRef
}
