import { type mvc, type dia } from '@joint/core';
import type { AnyCellRecord, CellId, Computed } from '../types/cell.types';

/** Selector over the resolved cells array (the array forms of `useCells`). */
export type CellsSelector<Cell extends AnyCellRecord, Selected> = (
  cells: ReadonlyArray<Computed<Cell>>
) => Selected;

/**
 * What a cells hook is scoped to: one cell, several cells, or a JointJS
 * collection. `undefined` is all cells, `null` is no cell.
 */
export type CellsTarget = CellId | null | undefined | readonly CellId[] | mvc.Collection<dia.Cell>;

/** What a target resolves to: the cells, one cell, or nothing. */
export type CellsSource<Cell extends AnyCellRecord> =
  | ReadonlyArray<Computed<Cell>>
  | Computed<Cell>
  | undefined;

/** A selector of any `useCells` form; the overloads pair each target with its own shape. */
export type AnyCellsSelector<Cell extends AnyCellRecord, Selected> = (
  source: CellsSource<Cell>
) => Selected;
