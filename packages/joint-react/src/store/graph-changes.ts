import { mvc, type dia } from '@joint/core';
import type { IncrementalChange } from '../state/incremental.types';
import { simpleScheduler } from '../utils/scheduler';
import type { ElementRecord, LinkRecord } from '../types/data-types';
import { mapElementToAttributes, mapLinkToAttributes } from '../state/data-mapping';

/** Custom graph event signalling a layout-only update (position/size/angle change). */
export const LAYOUT_UPDATE_EVENT = 'layout:update';

export interface UpdateGraphOptions<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
> {
  /** Element records to sync. If omitted, existing element cells are preserved untouched. */
  readonly elements?: Record<string, ElementRecord<ElementData>>;
  /** Link records to sync. If omitted, existing link cells are preserved untouched. */
  readonly links?: Record<string, LinkRecord<LinkData>>;
  readonly flag?: 'updateFromReact';
}

/**
 * Ids of the cells that were synced to the graph during an `updateGraph` call.
 * Returned so callers can iterate them once instead of re-walking the user record.
 */
export interface UpdateGraphResult {
  /** Empty when the corresponding stream was omitted from the update. */
  readonly elementIds: readonly string[];
  /** Empty when the corresponding stream was omitted from the update. */
  readonly linkIds: readonly string[];
}

interface OnChangeOptions {
  readonly changes: Map<string, IncrementalChange<dia.Cell>>;
  readonly isInsideBatch: boolean;
}
interface Options {
  readonly graph: dia.Graph;
  readonly onChanges: (options: OnChangeOptions) => void;
  readonly onElementsSizeChange?: (id: string, size: { width: number; height: number }) => void;
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
  const changes = new Map<string, IncrementalChange<dia.Cell>>();

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
    changes.set(String(cell.id), { type, data: cell });
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
        onElementsSizeChange(String(cell.id), size);
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
    (collection: mvc.Collection<dia.Cell>, { isUpdateFromReact }: JointJSEventOptions) => {
      if (isUpdateFromReact) return;
      isSyncedWithReact = true;
      changes.clear();
      const cells = collection.models;
      for (const cell of cells) {
        changes.set(String(cell.id), { type: 'add', data: cell });
      }
      onChanges({ changes, isInsideBatch: isInsideBatch() });
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
      const id = String(cell.id);
      onElementsSizeChange(id, newSize);
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
      ElementData extends object = Record<string, unknown>,
      LinkData extends object = Record<string, unknown>,
    >(update: UpdateGraphOptions<ElementData, LinkData>): UpdateGraphResult {
      const { elements, links, flag } = update;
      if (!isSyncedWithReact) {
        isSyncedWithReact = true;
        return { elementIds: [], linkIds: [] };
      }

      const elementIds: string[] = [];
      const linkIds: string[] = [];
      const cellsToSync: dia.Cell.JSON[] = [];

      if (elements) {
        for (const [id, element] of Object.entries(elements)) {
          const cellAttributes = mapElementToAttributes(element);
          cellAttributes.id = id;
          elementIds.push(id);
          cellsToSync.push(cellAttributes as dia.Cell.JSON);
        }
      } else {
        // Preserve untouched element cells by re-emitting their current JSON.
        for (const cell of graph.getElements()) {
          cellsToSync.push(cell.toJSON());
        }
      }

      if (links) {
        for (const [id, link] of Object.entries(links)) {
          const cellAttributes = mapLinkToAttributes(link);
          cellAttributes.id = id;
          linkIds.push(id);
          cellsToSync.push(cellAttributes as dia.Cell.JSON);
        }
      } else {
        for (const cell of graph.getLinks()) {
          cellsToSync.push(cell.toJSON());
        }
      }

      graph.startBatch('updateFromReact');
      graph.syncCells(cellsToSync, {
        remove: true,
        isUpdateFromReact: flag === 'updateFromReact',
      });
      graph.stopBatch('updateFromReact');

      return { elementIds, linkIds };
    },
  };
}
