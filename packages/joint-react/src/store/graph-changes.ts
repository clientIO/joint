import { mvc, type dia } from '@joint/core';
import type { IncrementalChange } from '../state/incremental.types';
import type { CellData } from '../types/cell-data';
import type { ElementToAttribute, LinkToAttribute } from './graph-view';

/** Custom graph event signalling a layout-only update (position/size/angle change). */
export const LAYOUT_UPDATE_EVENT = 'layout:update';
interface UpdateGraphOptions<
  ElementData extends object = CellData,
  LinkData extends object = CellData,
> {
  readonly elements: Record<string, ElementData>;
  readonly links: Record<string, LinkData>;
  readonly flag?: 'updateFromReact';
}

interface OnChangeOptions {
  readonly changes: Map<string, IncrementalChange<dia.Cell>>;
  readonly onlyLayoutUpdate: boolean;
}
interface Options<ElementData extends object = CellData, LinkData extends object = CellData> {
  readonly graph: dia.Graph;
  readonly enableBatchUpdates?: boolean;
  readonly onChanges: (options: OnChangeOptions) => void;
  readonly elementToAttributes: ElementToAttribute<ElementData>;
  readonly linkToAttributes: LinkToAttribute<LinkData>;
}

interface JointJSEventOptions {
  readonly isUpdateFromReact?: boolean;
  readonly [key: string]: unknown;
}
/**
 * Sets up listeners for JointJS graph mutations and translates them into incremental change events.
 * @param options
 */
export function graphChanges<
  ElementData extends object = CellData,
  LinkData extends object = CellData,
>(options: Options<ElementData, LinkData>) {
  const { graph, onChanges, enableBatchUpdates, elementToAttributes, linkToAttributes } = options;
  const changes = new Map<string, IncrementalChange<dia.Cell>>();

  let batchDepth = 0;
  let isSyncedWithReact = true;

  /**
   * Returns true when inside a batch operation and batch updates are enabled.
   */
  function onlyLayoutUpdate() {
    return !!(enableBatchUpdates && batchDepth > 0);
  }

  /**
   * Records a cell change and notifies the change handler.
   * @param cell
   * @param type
   */
  function onCellEvent(cell: dia.Cell, type: 'change' | 'add' | 'remove') {
    if (type === 'remove') {
      changes.set(String(cell.id), { type: 'remove', data: cell });
    } else {
      changes.set(String(cell.id), { type, data: cell });
    }
    onChanges({ changes, onlyLayoutUpdate: onlyLayoutUpdate() });
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
      onChanges({ changes, onlyLayoutUpdate: onlyLayoutUpdate() });
    }
  );

  controller.listenTo(graph, LAYOUT_UPDATE_EVENT, ({ changes: layoutChanges }) => {
    onChanges({ changes: layoutChanges, onlyLayoutUpdate: true });
  });

  if (enableBatchUpdates) {
    controller.listenTo(graph, 'batch:start', () => {
      batchDepth += 1;
    });

    controller.listenTo(graph, 'batch:stop', ({ isUpdateFromReact }: JointJSEventOptions) => {
      batchDepth -= 1;
      if (batchDepth > 0) return;
      if (isUpdateFromReact) return;
      if (changes.size === 0) return;
      onChanges({ changes, onlyLayoutUpdate: onlyLayoutUpdate() });
    });
  }

  return {
    destroy() {
      controller.stopListening();
    },
    updateGraph(update: UpdateGraphOptions<ElementData, LinkData>) {
      const { elements, links, flag } = update;
      if (!isSyncedWithReact) {
        isSyncedWithReact = true;
        return;
      }
      const graphElements = Object.entries(elements).map(([id, data]) => {
        return {
          ...elementToAttributes({ id, data }),
          id,
        };
      });
      const graphLinks = Object.entries(links).map(([id, data]) => ({
        ...linkToAttributes({ id, data }),
        id,
      }));
      graph.syncCells([...graphElements, ...graphLinks], {
        remove: true,
        isUpdateFromReact: flag === 'updateFromReact',
      });
    },
  };
}
