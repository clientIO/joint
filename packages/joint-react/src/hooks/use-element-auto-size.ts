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
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { borderBoxSize } = entry

        if (!borderBoxSize || borderBoxSize.length === 0) continue

        if (borderBoxSize.length === 0) {
          return
        }
        const [size] = borderBoxSize
        const { inlineSize, blockSize } = size
        cell.set('size', { width: inlineSize, height: blockSize })
      }
    })

    observer.observe(htmlRef.current, { box: 'border-box' })
    return () => {
      observer.disconnect()
    }
  }, [graph, id])

  return htmlRef
}
