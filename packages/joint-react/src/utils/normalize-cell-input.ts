import { dia } from '@joint/core';
import type { ElementJSONInit, LinkJSONInit, CellId } from '../types/cell.types';
import { toCellRecord } from '../state/data-mapping/cell-record-merge';
import { mapCellToAttributes } from '../state/data-mapping/cell-mapper';

/**
 * Cell setter input: a plain record or a dia.Cell instance.
 * Shared across all cell-mutation entry points (setCell, resetCells,
 * initialCells, collection setter, etc.).
 * @template Element - element record shape
 * @template Link - link record shape
 */
export type CellInput<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
> = Element | Link | dia.Cell;

/** Re-export of JointJS core's `dia.Graph.CellRef` — cell id or dia.Cell instance. */
export type CellRef = dia.Graph.CellRef;

/**
 * Resolve a cell reference to its id.
 * @param cellRef - cell id or dia.Cell instance
 * @returns the cell id
 */
export function resolveCellRef(cellRef: CellRef): CellId {
  if (cellRef instanceof dia.Cell) {
    return cellRef.id as CellId;
  }
  return cellRef as CellId;
}

/**
 * Convert a cell input to its record form. `dia.Cell` instances are
 * converted via `toCellRecord`; plain records pass through unchanged.
 * @param input - plain record or dia.Cell instance
 * @returns normalized record
 */
export function cellInputToRecord<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
>(input: CellInput<Element, Link>): Element | Link {
  if (input instanceof dia.Cell) {
    return toCellRecord<Element, Link>(input);
  }
  return input;
}

/**
 * Convert a cell input to what `graph.resetCells` / `graph.addCells` accepts.
 * `dia.Cell` instances pass through directly; plain records are mapped to
 * JointJS attributes via `mapCellToAttributes`.
 * @param input - plain record or dia.Cell instance
 * @param graph - graph used for type-constructor resolution on records
 * @returns dia.Cell instance or attributes object ready for the graph
 */
export function cellInputToModel<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
>(input: CellInput<Element, Link>, graph: dia.Graph): dia.Cell | dia.Cell.JSONInit {
  if (input instanceof dia.Cell) {
    return input;
  }
  return mapCellToAttributes(input, graph);
}
