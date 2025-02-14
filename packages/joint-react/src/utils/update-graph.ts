import { dia, shapes } from '@joint/core'
import type { Item } from '../hooks/use-set-cells'

function processNewCell(graph: dia.Graph, newCell: Item, cellsMap: Record<string, dia.Cell>) {
  if (!newCell?.id) {
    return
  }

  const cell = graph.getCell(newCell.id)
  if (!cell) {
    graph.addCell(newCell)
    return
  }

  cellsMap[cell.id] = cell
  updateExistingCell(graph, cell, newCell)
}

function updateExistingCell(graph: dia.Graph, cell: dia.Cell, newCell: Item) {
  const originalCell = graph.getCell(cell.id)
  if (originalCell) {
    if (originalCell.get('type') === cell.get('type')) {
      if (newCell instanceof shapes.standard.Link) {
        return
      } else if (newCell instanceof dia.Cell) {
        originalCell.set(newCell.toJSON())
      } else {
        const { attrs, ...rest } = newCell
        originalCell.attr(attrs as unknown as dia.Path)
        originalCell.set(rest)
      }
    } else {
      originalCell.remove({ disconnectLinks: true })
      graph.addCell(cell)
    }
  } else {
    graph.addCell(cell)
  }
}

// TODO: maybe it will be needed
// function removeAbsentCells(originalCells: dia.Cell[], cellsMap: Record<string, dia.Cell>) {
//   for (const cell of originalCells) {
//     if (!cellsMap[cell.id]) {
//       cell.remove()
//     }
//   }
// }

/**
 * Updates the graph with new cells.
 */
export function updateGraph(graph: dia.Graph, cells: Array<Item>) {
  if (cells.length === 0) {
    graph.clear()
    return
  }

  // const originalCells = graph.getCells()
  const cellsMap: Record<string, dia.Cell> = {}

  for (const newCell of cells) processNewCell(graph, newCell, cellsMap)
  // removeAbsentCells(originalCells, cellsMap)
}
