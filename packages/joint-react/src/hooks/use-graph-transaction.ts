import { useCallback } from 'react';
import { useGraphStore } from './use-graph-store';
import { useResetCells } from './use-cell-setters';
import { isPromise } from '../utils/is';

/** Default JointJS batch name used to group a transaction's edits. */
const DEFAULT_BATCH_NAME = 'transaction';

/** Freeze key so a paper already frozen for another reason is left untouched on unfreeze. */
const TRANSACTION_FREEZE_KEY = 'react/transaction';

/**
 * Options for a {@link Transaction}.
 * @group Types
 */
export interface TransactionOptions {
  /**
   * Restore the graph to its pre-transaction state when the callback throws or
   * its promise rejects. Disabled by default; pass `true` to roll back on error
   * (otherwise partial edits are kept). The error is always re-thrown.
   */
  readonly rollback?: boolean;
  /**
   * Freeze every paper bound to the graph for the duration, so all views repaint
   * once when the transaction closes instead of on every edit. Disabled by
   * default; pass `true` to coalesce the repaint (hides intermediate frames).
   */
  readonly freezePapers?: boolean;
  /**
   * Name of the JointJS batch used to group the edits — drives undo grouping and
   * identifies the batch on `batch:start` / `batch:stop`. Defaults to `'transaction'`.
   */
  readonly name?: string;
}

/**
 * Runs a callback as one atomic transaction: every graph edit inside it
 * collapses into a single undo entry and a single React update (async edits
 * split across `await`s coalesce too).
 *
 * Pass `rollback: true` to restore the graph to its pre-transaction state when
 * the callback throws or rejects (the error is always re-thrown), and
 * `freezePapers: true` to freeze every bound paper so views repaint once, on
 * close. The callback may be sync or `async`; an async callback is awaited
 * before the transaction closes and the call returns the pending promise.
 * @group Types
 */
export type Transaction = <TResult>(
  callback: () => TResult,
  options?: TransactionOptions
) => TResult;

/**
 * Returns a {@link Transaction} bound to the surrounding graph. Also exposed as
 * `transaction` on {@link useGraph}. Call inside a `GraphProvider`.
 * @returns The transaction runner.
 * @group Hooks
 * @example
 * ```tsx
 * const { transaction, setCell } = useGraph();
 * // Many edits, one undo step, one React update — reverted as a unit on error.
 * transaction(() => {
 *   for (const { id, position } of layout(cells)) setCell(id, (p) => ({ ...p, position }));
 * });
 * ```
 */
export function useGraphTransaction(): Transaction {
  const store = useGraphStore();
  const resetCells = useResetCells();

  return useCallback(
    <TResult>(callback: () => TResult, options?: TransactionOptions): TResult => {
      const { rollback, freezePapers, name } = options ?? {};
      const { graph, graphProjection, paperStores } = store;
      const batchName = name ?? DEFAULT_BATCH_NAME;

      // Immutable records + shallow copy = a fast, correct pre-transaction snapshot
      // (container slots are replaced on change, never mutated in place). Opt-in.
      const snapshot = rollback === true ? [...graphProjection.cells.getAll()] : null;
      // Opt-in: freeze every bound paper so the whole transaction repaints once, on close.
      const papers =
        freezePapers === true
          ? [...paperStores.values()].map((paperStore) => paperStore.paper)
          : [];

      for (const paper of papers) paper.freeze({ key: TRANSACTION_FREEZE_KEY });
      graph.startBatch(batchName);

      const unfreezeAll = () => {
        for (const paper of papers) paper.unfreeze({ key: TRANSACTION_FREEZE_KEY });
      };
      const commit = () => {
        graph.stopBatch(batchName);
        unfreezeAll();
      };
      const revert = () => {
        graph.stopBatch(batchName);
        if (snapshot) resetCells(snapshot);
        unfreezeAll();
      };

      let result: TResult;
      try {
        result = callback();
      } catch (error) {
        revert();
        throw error;
      }

      // Sync callback: the batch is already complete.
      if (!isPromise(result)) {
        commit();
        return result;
      }

      // Async callback: close the batch once the work settles.
      return result.then(
        (value) => {
          commit();
          return value;
        },
        (error) => {
          revert();
          throw error;
        }
      ) as TResult;
    },
    [store, resetCells]
  );
}
