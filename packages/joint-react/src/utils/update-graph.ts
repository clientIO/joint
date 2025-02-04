import type { dia } from '@joint/core'
import { BaseCell, RequiredCell } from '../types/cell.types'

/**
 * Updates the graph with new cells.
 */
export function updateGraph<T extends RequiredCell = BaseCell>(graph: dia.Graph, cells: T[]) {
  if (cells.length === 0) {
    graph.clear()
    return
  }
  // We need to keep track of the original cells to remove the ones that are not present in the new cells.
  const originalCells = graph.getCells()
  const cellsMap: Record<string, dia.Cell> = {}
  for (const newCell of cells) {
    // If the cell is already in the graph, we update it.
    const cell = graph.getCell(newCell.id)

    // If the cell is not in the graph, we add it.
    if (!cell) {
      graph.addCell(newCell)
      continue
    }

    // cell.attributes.attrs = newCell.attrs
    cellsMap[cell.id] = cell
    const originalCell = graph.getCell(cell.id)

    // If the cell is already in the graph, we update it.
    if (originalCell) {
      if (originalCell.get('type') === cell.get('type')) {
        const { attrs, ...rest } = newCell
        originalCell.attr(attrs as unknown as dia.Path)
        originalCell.set(rest)
      } else {
        originalCell.remove({ disconnectLinks: true })
        graph.addCell(cell)
      }
    } else {
      graph.addCell(cell)
    }
  }

  for (const cell of originalCells) {
    if (!cellsMap[cell.id]) {
      // If the cell is not present in the new cells, we remove it.
      cell.remove()
    }
  }
}
