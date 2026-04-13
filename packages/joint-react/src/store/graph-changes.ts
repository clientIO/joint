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
  readonly elements: Record<string, ElementRecord<ElementData>>;
  readonly links: Record<string, LinkRecord<LinkData>>;
  readonly flag?: 'updateFromReact';
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
 */
export function graphChanges(options: Options) {
  const { graph, onElementsSizeChange } = options;
  const changes = new Map<string, IncrementalChange<dia.Cell>>();

  let batchDepth = 0;
  let isSyncedWithReact = true;

  function onChanges(data: OnChangeOptions) {
    simpleScheduler(() => {
      options.onChanges(data);
    });
  }

  /**
   * Returns true when inside a batch operation.
   */
  function isInsideBatch() {
    return batchDepth > 0;
  }

  /**
   * Records a cell change and notifies the change handler.
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
    >(update: UpdateGraphOptions<ElementData, LinkData>) {
      const { elements, links, flag } = update;
      if (!isSyncedWithReact) {
        isSyncedWithReact = true;
        return;
      }

      const graphElements: dia.Cell.JSON[] = Object.entries(elements).map(([id, element]) => {
        const cellAttributes = mapElementToAttributes(element);
        cellAttributes.id = id;
        return cellAttributes as dia.Cell.JSON;
      });
      const graphLinks: dia.Cell.JSON[] = Object.entries(links).map(([id, link]) => {
        const cellAttributes = mapLinkToAttributes(link);
        cellAttributes.id = id;
        return cellAttributes as dia.Cell.JSON;
      });

      graph.startBatch('updateFromReact');

      graph.syncCells([...graphElements, ...graphLinks], {
        remove: true,
        isUpdateFromReact: flag === 'updateFromReact',
      });
      graph.stopBatch('updateFromReact');
    },
  };
}
