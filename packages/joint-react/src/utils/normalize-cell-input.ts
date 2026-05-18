import { dia } from '@joint/core';
import type { ElementJSONInit, LinkJSONInit, CellId } from '../types/cell.types';
import { toCellRecord } from '../state/data-mapping/cell-record-merge';

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
 * Normalize cell input that may be a plain record or a dia.Cell instance.
 * dia.Cell instances are converted to their record form via toCellRecord.
 * @param input - plain record or dia.Cell instance
 * @returns normalized record
 */
export function normalizeCellInput<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
>(input: CellInput<Element, Link>): Element | Link {
  if (input instanceof dia.Cell) {
    return toCellRecord<Element, Link>(input);
  }
  return input;
}
