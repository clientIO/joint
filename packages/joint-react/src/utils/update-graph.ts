import { dia, shapes } from '@joint/core';
import type { Item } from '../hooks/use-set-cells';

// eslint-disable-next-line jsdoc/require-jsdoc
function processNewCell(graph: dia.Graph, newCell: Item, cellsMap: Record<string, dia.Cell>) {
  if (!newCell?.id) {
    return;
  }

  const cell = graph.getCell(newCell.id);
  if (!cell) {
    graph.addCell(newCell);
    return;
  }

  cellsMap[cell.id] = cell;
  updateExistingCell(graph, cell, newCell);
}
// eslint-disable-next-line jsdoc/require-jsdoc
function updateExistingCell(graph: dia.Graph, cell: dia.Cell, newCell: Item) {
  const originalCell = graph.getCell(cell.id);
  if (originalCell) {
    if (originalCell.get('type') === cell.get('type')) {
      if (newCell instanceof shapes.standard.Link) {
        return;
      } else if (newCell instanceof dia.Cell) {
        originalCell.set(newCell.toJSON());
      } else {
        const { attrs, ...rest } = newCell;
        originalCell.attr(attrs as unknown as dia.Path);
        originalCell.set(rest);
      }
    } else {
      originalCell.remove({ disconnectLinks: true });
      graph.addCell(cell);
    }
  } else {
    graph.addCell(cell);
  }
}

/**
 * Updates the graph with new cells.
 * @group Utils
 * @param graph - The graph to update.
 * @param cells - The new cells to add to the graph.
 * @example
 * ```ts
 * const graph = new dia.Graph()
 * const cells = createElements([
 *    { id: '1', type: 'rect', x: 10, y: 10, width: 100, height: 100 },
 * ])
 * updateGraph(graph, cells)
 * ```
 */
export function updateGraph(graph: dia.Graph, cells: Item[]) {
  if (cells.length === 0) {
    graph.clear();
    return;
  }

  const cellsMap: Record<string, dia.Cell> = {};

  for (const newCell of cells) processNewCell(graph, newCell, cellsMap);
}
