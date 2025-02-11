import type { dia } from '@joint/core'
import { useGraphStore } from './use-graph-store'
import { useEffect, useState } from 'react'

export function useCell(cellId: dia.Cell.ID) {
  const { graph } = useGraphStore()
  const [cell, setCell] = useState(() => graph.getCell(cellId))

  useEffect(() => {
    setCell((previousCell) => {
      if (cellId === previousCell.id) {
        return previousCell
      }
      return graph.getCell(cellId)
    })
  }, [cellId, graph])

  return cell
}
