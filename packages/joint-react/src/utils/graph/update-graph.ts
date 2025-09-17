/* eslint-disable sonarjs/cognitive-complexity */
import type { dia } from '@joint/core';
import type { CellOrJsonCell } from '../cell/cell-utilities';
import { getCellId } from '../link-utilities';
import { isCellInstance } from '../is';

export const CONTROLLED_MODE_BATCH_NAME = 'controlled-mode';
export const GRAPH_UPDATE_BATCH_NAME = 'update-graph';
/**
 * Get the value of a specific attribute from a cell or JSON cell.
 * @param cell - The cell or JSON cell to get the value from.
 * @param attributeName - The name of the attribute to get the value of.
 * @returns The value of the attribute.
 * @group utils
 */
function getType(cell: CellOrJsonCell, attributeName: string) {
  if (isCellInstance(cell)) {
    return cell.get(attributeName);
  }
  return cell[attributeName];
}
/**
 * Get the attributes of a cell or JSON cell.
 * @param cell - The cell or JSON cell to get the attributes from.
 * @returns The attributes of the cell.
 * @group utils
 */
function getAttributes(cell: CellOrJsonCell) {
  if (isCellInstance(cell)) {
    return cell.attributes;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, type, ...attributes } = cell;
  return attributes;
}

interface Options {
  readonly graph: dia.Graph;
  readonly cells: CellOrJsonCell[];
  readonly isLink: boolean;
}

/**
 * Update a cell in the graph or add it if it does not exist.
 * @param graph - The graph to update.
 * @param newCell - The new cell to add or update.
 * @param isLink - Whether the cell is a link.
 * @param newCellsMap - A map of new cells by their IDs.
 */
export function updateCell(
  graph: dia.Graph,
  newCell: CellOrJsonCell,
  newCellsMap: Record<string, CellOrJsonCell> = {}
) {
  const id = getCellId(newCell.id);
  if (!id) {
    return;
  }
  newCellsMap[id] = newCell;
  const originalCell = graph.getCell(newCell.id);
  if (!originalCell) {
    graph.addCell(newCell);
    return;
  }

  if (originalCell.get('type') === getType(newCell, 'type')) {
    originalCell.set(getAttributes(newCell));
    return;
  }
  originalCell.remove({ disconnectLinks: true });
  graph.addCell(newCell);
}
/**
 * Update the graph with new cells.
 * @param options - The options for updating the graph.
 */
export function updateGraph(options: Options) {
  const { graph, cells, isLink } = options;
  const originalCells = isLink ? graph.getLinks() : graph.getElements();
  const newCellsMap: Record<string, CellOrJsonCell> = {};

  // Here we do not want to remove the existing elements but only update them if they exist.
  // e.g. Using resetCells() would remove all elements from the graph and add new ones.
  for (const newCell of cells) {
    updateCell(graph, newCell, newCellsMap);
  }

  if (originalCells) {
    for (const cell of originalCells) {
      if (!newCellsMap[cell.id]) {
        cell.remove();
      }
    }
  }
}
