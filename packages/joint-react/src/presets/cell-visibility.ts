import type { dia } from '@joint/core';

/** Context passed to a `cellVisibility` callback. */
export interface CellVisibilityContext {
  /** The cell whose visibility is being queried. */
  readonly model: dia.Cell;
  /** Whether the cell currently has a mounted view in the paper. */
  readonly isMounted: boolean;
  /** The paper rendering the cell. */
  readonly paper: dia.Paper;
  /** The graph the cell belongs to. */
  readonly graph: dia.Graph;
}

/**
 * Predicate deciding whether a cell should be rendered. Receives a
 * structured context object (instead of the native positional form).
 * Return `false` to hide the cell.
 */
export type CellVisibility = (context: CellVisibilityContext) => boolean;

/**
 * Adapt a context-form `CellVisibility` callback to the native
 * `dia.Paper.Options['cellVisibility']` signature
 * `(this: paper, model, isMounted) => boolean`.
 * @param cb - user-supplied context-form predicate
 * @returns native predicate, or `undefined` when no callback supplied
 */
export function toNativeCellVisibility(
  cb: CellVisibility | undefined
): dia.Paper.Options['cellVisibility'] {
  if (!cb) return undefined;
  return function (this: dia.Paper, model: dia.Cell, isMounted: boolean) {
    return cb({ model, isMounted, paper: this, graph: this.model });
  };
}
