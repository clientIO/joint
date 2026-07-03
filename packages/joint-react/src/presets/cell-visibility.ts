import type { dia } from '@joint/core';

/**
 * Context handed to a {@link CellVisibility} callback each time the paper decides
 * whether to render a cell.
 * @group Types
 * @expand
 */
export interface CellVisibilityParams {
  /** The cell whose visibility is being decided. */
  readonly model: dia.Cell;
  /** Whether the cell currently has a view mounted in the paper. */
  readonly isMounted: boolean;
  /** The paper rendering the cell. */
  readonly paper: dia.Paper;
  /** The graph the cell belongs to. */
  readonly graph: dia.Graph;
}

/**
 * Decides whether a cell is rendered on the paper. Return `false` to skip
 * rendering it (handy for viewport culling or hiding cells by state), `true` to
 * render it. Pass it to the `cellVisibility` prop of `<Paper>`; the callback
 * receives a structured {@link CellVisibilityParams} context instead of the
 * native positional arguments.
 * @group Types
 * @example
 * ```tsx
 * import { GraphProvider, Paper } from '@joint/react';
 * import type { CellVisibility } from '@joint/react';
 *
 * // Hide every cell flagged as collapsed.
 * const cellVisibility: CellVisibility = ({ model }) => !model.get('collapsed');
 *
 * <GraphProvider>
 *   <Paper cellVisibility={cellVisibility} renderElement={() => <rect width={80} height={40} />} />
 * </GraphProvider>;
 * ```
 */
export type CellVisibility = (context: CellVisibilityParams) => boolean;

/**
 * Adapt a context-form {@link CellVisibility} callback to the native
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
