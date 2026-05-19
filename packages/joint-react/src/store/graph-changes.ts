import { mvc, type dia } from '@joint/core';
import type { IncrementalChange } from '../state/incremental.types';
import { simpleScheduler } from '../utils/scheduler';
import type { ElementJSONInit, LinkJSONInit, CellId } from '../types/cell.types';
import { mapCellToAttributes } from '../state/data-mapping';

/** Custom graph event signalling a layout-only update (position/size/angle change). */
export const LAYOUT_UPDATE_EVENT = 'layout:update';

/**
 * Options for applying a React-driven cells snapshot to the graph.
 *
 * A single unified `cells` stream replaces the earlier `elements` / `links`
 * split. Each record is routed internally by `type`:
 *  - `ELEMENT_MODEL_TYPE` → mapped via the element mapper
 *  - `LINK_MODEL_TYPE` → mapped via the link mapper
 *  - anything else → passed through as raw attributes
 */
export interface UpdateGraphOptions<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
> {
  /** Cell records to sync. If omitted, the current graph cells are preserved untouched. */
  readonly cells?: ReadonlyArray<Element | Link>;
  readonly flag?: 'updateFromReact';
}

/**
 * Ids of the cells that were synced to the graph during an `updateGraph` call.
 * Returned so callers can iterate them once instead of re-walking the user input.
 */
export interface UpdateGraphResult {
  /** Empty when no `cells` were provided in the update. */
  readonly cellIds: readonly CellId[];
}

interface OnChangeOptions {
  readonly changes: Map<CellId, IncrementalChange<dia.Cell>>;
  readonly isInsideBatch: boolean;
}

interface Options {
  readonly graph: dia.Graph;
  readonly onChanges: (options: OnChangeOptions) => void;
  readonly onElementsSizeChange?: (id: CellId, size: { width: number; height: number }) => void;
}

interface JointJSEventOptions {
  readonly isUpdateFromReact?: boolean;
  readonly [key: string]: unknown;
}

/**
 * Sets up listeners for JointJS graph mutations and translates them into incremental change events.
 * Batching is always on: layout changes are immediate, data changes fire on batch:stop.
 * @param options - Graph listener configuration.
 * @returns Controller exposing updateGraph and destroy.
 */
export function graphChanges(options: Options) {
  const { graph, onElementsSizeChange } = options;
  const changes = new Map<CellId, IncrementalChange<dia.Cell>>();

  let batchDepth = 0;
  let isSyncedWithReact = true;

  /**
   * Schedules onChanges to fire on next tick.
   * @param data - Change options to pass to the handler.
   */
  function onChanges(data: OnChangeOptions) {
    simpleScheduler(() => {
      options.onChanges(data);
    });
  }

  /**
   * Returns true when inside a batch operation.
   * @returns true when inside a JointJS batch operation.
   */
  function isInsideBatch() {
    return batchDepth > 0;
  }

  /**
   * Records a cell change and notifies the change handler.
   * @param cell - The cell that changed.
   * @param type - Kind of change.
   */
  function onCellEvent(cell: dia.Cell, type: 'change' | 'add' | 'remove') {
    changes.set(cell.id, { type, data: cell });
    onChanges({ changes, isInsideBatch: isInsideBatch() });
  }

  const controller = new mvc.Listener();

  controller.listenTo(
    graph,
    'change',
    (cell: dia.Cell, { isUpdateFromReact }: JointJSEventOptions) => {
      if (isUpdateFromReact) return;
      onCellEvent(cell, 'change');
    }
  );
  controller.listenTo(
    graph,
    'add',
    (
      cell: dia.Cell,
      _collection: mvc.Collection<dia.Cell>,
      { isUpdateFromReact }: JointJSEventOptions
    ) => {
      if (cell.isElement() && onElementsSizeChange) {
        const size = cell.size();
        onElementsSizeChange(cell.id, size);
      }
      if (isUpdateFromReact) return;
      onCellEvent(cell, 'add');
    }
  );
  controller.listenTo(
    graph,
    'remove',
    (
      cell: dia.Cell,
      _collection: mvc.Collection<dia.Cell>,
      { isUpdateFromReact }: JointJSEventOptions
    ) => {
      if (isUpdateFromReact) return;
      onCellEvent(cell, 'remove');
    }
  );
  controller.listenTo(
    graph,
    'reset',
    (collection: mvc.Collection<dia.Cell>, eventOptions: JointJSEventOptions = {}) => {
      if (eventOptions.isUpdateFromReact) return;
      isSyncedWithReact = true;
      changes.clear();
      for (const cell of collection.models) {
        changes.set(cell.id, { type: 'add', data: cell });
        // `reset` suppresses per-cell `add` events, so size notifications
        // for seed elements never reach `onElementsSizeChange` via the
        // `add` listener. Mirror that path here so initial-measurement
        // gating (e.g. `useNodesMeasuredEffect`) fires for seed cells.
        if (onElementsSizeChange && cell.isElement()) {
          onElementsSizeChange(cell.id, (cell as dia.Element).size());
        }
      }
      // Bypass the simpleScheduler wrapper used for normal cell events.
      // `reset` is a one-shot bulk operation and callers (e.g. GraphStore
      // constructor) expect the cells container to be observable
      // synchronously after `graph.resetCells(...)` returns.
      options.onChanges({ changes, isInsideBatch: isInsideBatch() });
    }
  );

  controller.listenTo(graph, LAYOUT_UPDATE_EVENT, ({ changes: layoutChanges }) => {
    onChanges({ changes: layoutChanges, isInsideBatch: true });
  });

  controller.listenTo(
    graph,
    'change:size',
    (cell: dia.Cell, newSize: { width: number; height: number }) => {
      if (!onElementsSizeChange) return;
      onElementsSizeChange(cell.id, newSize);
    }
  );

  // Always-on batch tracking
  controller.listenTo(graph, 'batch:start', () => {
    batchDepth += 1;
  });

  controller.listenTo(graph, 'batch:stop', ({ isUpdateFromReact }: JointJSEventOptions = {}) => {
    batchDepth -= 1;
    if (batchDepth > 0) return;
    if (isUpdateFromReact) return;
    onChanges({ changes, isInsideBatch: false });
  });

  return {
    destroy() {
      controller.stopListening();
    },

    updateGraph<
      Element extends ElementJSONInit = ElementJSONInit,
      Link extends LinkJSONInit = LinkJSONInit,
    >(update: UpdateGraphOptions<Element, Link>): UpdateGraphResult {
      const { cells, flag } = update;
      if (!isSyncedWithReact) {
        isSyncedWithReact = true;
        return { cellIds: [] };
      }
      if (!cells) {
        return { cellIds: [] };
      }

      const cellIds: CellId[] = [];
      const cellsToSync: dia.Cell.JSONInit[] = [];

      for (const cell of cells) {
        // Cells without an id are valid input — JointJS will assign one — but
        // they cannot be tracked in `cellIds` (which is used for diffing).
        if (cell.id !== undefined) cellIds.push(cell.id);
        cellsToSync.push(mapCellToAttributes(cell, graph));
      }

      graph.startBatch('updateFromReact');
      graph.syncCells(cellsToSync, {
        remove: true,
        isUpdateFromReact: flag === 'updateFromReact',
      });
      graph.stopBatch('updateFromReact');

      return { cellIds };
    },
  };
}
