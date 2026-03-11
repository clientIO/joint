/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-dynamic-delete */
/**
 * Graph State — the single source of truth for graph state synchronization.
 *
 * Data flow:
 *
 *   [optional user state] ──► updateGraph() ──► dia.Graph ──► dataState / layoutState
 *                                                   │
 *                                                   └──► onElementsChange / onLinksChange / onIncrementalChange
 *                                                        (triggers optional user state update)
 *
 * 1. User state (React useState, Redux, Zustand, etc.) is optional.
 *    When present, changes flow into `updateGraph()` which syncs `dia.Graph`.
 * 2. `dia.Graph` is the central model. All changes (add/change/remove/reset)
 *    are captured by event listeners and written to `dataState` and `layoutState`.
 * 3. When `dia.Graph` changes (e.g. user drags a node), the optional callbacks
 *    (`onElementsChange`, `onLinksChange`, `onIncrementalChange`) are fired, allowing
 *    the user state to stay in sync.
 */
import { mvc, type dia } from '@joint/core';
import type { IncrementalChange, IncrementalStateChanges } from './incremental.types';
import type { GraphStoreLayoutSnapshot, GraphStoreSnapshot, PaperStore } from '../store';
import { getElementLayout, getLayout, getLinkLayout } from '../store/update-layout-state';
import type { GraphMappings } from './graph-mappings';
import type { FlatElementData } from '../types/element-types';
import type { FlatLinkData } from '../types/link-types';
import { resolveCellDefaults } from './data-mapping/resolve-cell-defaults';
import {
  defaultMapDataToElementAttributes,
  defaultMapElementAttributesToData,
} from './data-mapping/element-mapper';
import { defaultMapDataToLinkAttributes, defaultMapLinkAttributesToData } from './data-mapping';
import { createState, type ExternalStoreLike } from '../utils/create-state';
export const LAYOUT_UPDATE_EVENT = 'layout:update';

interface JointJSEventOptions {
  readonly isUpdateFromReact?: boolean;
  readonly [key: string]: unknown;
}

interface Options<ElementData = FlatElementData, LinkData = FlatLinkData> {
  readonly graph: dia.Graph;
  readonly papers: Map<string, PaperStore>;
  readonly mappers: GraphMappings<ElementData, LinkData>;
  readonly onIncrementalChange?: (changes: IncrementalStateChanges<ElementData, LinkData>) => void;
  readonly onElementsChange?: (elements: Record<string, ElementData>) => void;
  readonly onLinksChange?: (links: Record<string, LinkData>) => void;
  /**
   * When enabled, state updates are deferred during JointJS batch operations
   * and flushed once the batch completes. Disabled by default.
   * @default false
   */
  readonly enableBatchUpdates?: boolean;
}

interface UpdateGraphOptions<ElementData = FlatElementData, LinkData = FlatLinkData> {
  readonly elements: Record<string, ElementData>;
  readonly links: Record<string, LinkData>;
  readonly flag?: 'updateFromReact';
}

export interface ListenOutput<ElementData = FlatElementData, LinkData = FlatLinkData> {
  readonly dataState: ExternalStoreLike<GraphStoreSnapshot<ElementData, LinkData>>;
  readonly layoutState: ExternalStoreLike<GraphStoreLayoutSnapshot>;
  readonly clear: () => void;
  readonly destroy: () => void;
  readonly updateGraph: (options: UpdateGraphOptions) => void;
}

interface MutableIncrementalStateChange<T> {
  added?: Record<string, T>;
  changed?: Record<string, T>;
  removed?: Record<string, T>;
  reset?: Record<string, T>;
}

function setIncrementalChangeRecord<T>(
  change: MutableIncrementalStateChange<T>,
  type: 'added' | 'changed' | 'removed',
  id: string,
  data: T
): void {
  if (!change[type]) {
    change[type] = {};
  }
  change[type]![id] = data;
}
/**
 * Creates the graph state manager that listens to graph changes and syncs state.
 * @group Cell
 * @param graph The JointJS graph instance.
 * @param onIncrementalChange The callback function to handle cell changes.
 * @returns A function to stop listening to cell changes.
 */
export function graphState<ElementData = FlatElementData, LinkData = FlatLinkData>({
  graph,
  papers,
  onIncrementalChange,
  onElementsChange,
  onLinksChange,
  enableBatchUpdates = false,
  mappers: {
    mapElementAttributesToData = defaultMapElementAttributesToData as unknown as NonNullable<
      GraphMappings<ElementData, LinkData>['mapElementAttributesToData']
    >,
    mapLinkAttributesToData = defaultMapLinkAttributesToData as unknown as NonNullable<
      GraphMappings<ElementData, LinkData>['mapLinkAttributesToData']
    >,
    mapDataToElementAttributes = defaultMapDataToElementAttributes as unknown as NonNullable<
      GraphMappings<ElementData, LinkData>['mapDataToElementAttributes']
    >,
    mapDataToLinkAttributes = defaultMapDataToLinkAttributes as unknown as NonNullable<
      GraphMappings<ElementData, LinkData>['mapDataToLinkAttributes']
    >,
  },
}: Options<ElementData, LinkData>): ListenOutput<ElementData, LinkData> {
  const controller = new mvc.Listener();
  let batchDepth = 0;
  let isSyncedWithReact = true;

  const dataState = createState<GraphStoreSnapshot<ElementData, LinkData>>({
    newState: () => ({
      elements: {},
      links: {},
    }),
    name: 'JointJs/Data',
  });
  const layoutState = createState<GraphStoreLayoutSnapshot>({
    newState: () => ({ elements: {}, links: {} }),
    name: 'JointJs/Layout',
  });

  const changes = new Map<string, IncrementalChange<dia.Cell>>();

  function elementToData(cell: dia.Element, previousData?: ElementData): ElementData {
    const defaultAttributes = resolveCellDefaults(cell);
    const id = String(cell.id);
    return mapElementAttributesToData({
      id,
      attributes: cell.attributes,
      defaultAttributes,
      element: cell,
      graph,
      previousData,
      toData: (attributes) =>
        defaultMapElementAttributesToData({ attributes, defaultAttributes }) as ElementData,
    });
  }
  function elementToAttributes(id: string, data: ElementData) {
    return mapDataToElementAttributes({
      id,
      data,
      graph,
      toAttributes: (newData) =>
        defaultMapDataToElementAttributes({ id, data: newData as FlatElementData }),
    });
  }

  function linkToData(cell: dia.Link, previousData?: LinkData): LinkData {
    const defaultAttributes = resolveCellDefaults(cell);
    const id = String(cell.id);
    return mapLinkAttributesToData({
      id,
      attributes: cell.attributes,
      defaultAttributes,
      link: cell,
      graph,
      previousData,
      toData: (attributes) =>
        defaultMapLinkAttributesToData({ attributes, defaultAttributes }) as LinkData,
    });
  }
  function linkToAttributes(id: string, data: LinkData) {
    return mapDataToLinkAttributes({
      id,
      data,
      graph,
      toAttributes: (newData) =>
        defaultMapDataToLinkAttributes({ id, data: newData as FlatLinkData }),
    });
  }

  function updateLinkLayout(layout: GraphStoreLayoutSnapshot, link: dia.Link) {
    for (const [paperId, paperStore] of papers) {
      const { paper } = paperStore;
      if (!paper) continue;

      const linkView = paper.findViewByModel(link) as dia.LinkView | null;
      if (!linkView) continue;

      if (!layout.links[paperId]) {
        layout.links[paperId] = {};
      }
      layout.links[paperId][String(link.id)] = getLinkLayout(linkView);
    }
  }
  function onLayoutUpdateHandler() {
    layoutState.setState((previous) => {
      const nextElements = { ...previous.elements };
      const nextLinks = { ...previous.links };

      for (const [id, change] of changes) {
        switch (change.type) {
          case 'add':
          case 'change': {
            const cell = change.data;
            if (cell.isElement()) {
              const layout = getElementLayout(cell);
              if (!layout) {
                continue;
              }
              nextElements[id] = layout;
              const connectedLinks = graph.getConnectedLinks(cell);
              for (const link of connectedLinks) {
                updateLinkLayout({ elements: nextElements, links: nextLinks }, link);
              }
            } else if (cell.isLink()) {
              updateLinkLayout({ elements: nextElements, links: nextLinks }, cell);
            }
            break;
          }

          case 'remove': {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete nextElements[id];
            for (const paperLinks of Object.values(nextLinks)) {
              // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
              delete paperLinks[id];
            }
            break;
          }

          case 'reset': {
            const layout = getLayout({ graph, papers });
            return { elements: layout.elements, links: layout.links };
          }
        }
      }
      return { elements: nextElements, links: nextLinks };
    });
  }

  function onStateUpdate() {
    dataState.setState((previous) => {
      const nextElements = { ...previous.elements };
      const nextLinks = { ...previous.links };
      const stateChanges: IncrementalStateChanges<ElementData, LinkData> = {
        elements: {},
        links: {},
      };
      for (const [id, change] of changes) {
        switch (change.type) {
          case 'add':
          case 'change': {
            const cell = change.data;
            if (cell.isElement()) {
              const newData = elementToData(cell, previous.elements[id]);
              nextElements[id] = newData;
              setIncrementalChangeRecord(
                stateChanges.elements as MutableIncrementalStateChange<ElementData>,
                change.type === 'add' ? 'added' : 'changed',
                id,
                newData
              );
            } else if (cell.isLink()) {
              const newData = linkToData(cell, previous.links[id]);
              nextLinks[id] = newData;
              setIncrementalChangeRecord(
                stateChanges.links as MutableIncrementalStateChange<LinkData>,
                change.type === 'add' ? 'added' : 'changed',
                id,
                newData
              );
            }
            break;
          }

          case 'remove': {
            const removedElement = nextElements[id];
            const removedLink = nextLinks[id];
            delete nextElements[id];
            delete nextLinks[id];
            if (removedElement) {
              setIncrementalChangeRecord(
                stateChanges.elements as MutableIncrementalStateChange<ElementData>,
                'removed',
                id,
                removedElement
              );
            }
            if (removedLink) {
              setIncrementalChangeRecord(
                stateChanges.links as MutableIncrementalStateChange<LinkData>,
                'removed',
                id,
                removedLink
              );
            }
            break;
          }
          case 'reset': {
            const resetElements: Record<string, ElementData> = {};
            const resetLinks: Record<string, LinkData> = {};
            for (const cell of change.data) {
              if (cell.isElement()) {
                const newData = elementToData(cell);
                resetElements[String(cell.id)] = newData;
              } else if (cell.isLink()) {
                const newData = linkToData(cell);
                resetLinks[String(cell.id)] = newData;
              }
            }
            stateChanges.elements = {
              reset: resetElements,
            };
            stateChanges.links = {
              reset: resetLinks,
            };
            isSyncedWithReact = false;
            onIncrementalChange?.(stateChanges);
            return { elements: resetElements, links: resetLinks };
          }
        }
      }
      isSyncedWithReact = false;
      onIncrementalChange?.(stateChanges);
      return { elements: nextElements, links: nextLinks };
    });

    if (onElementsChange || onLinksChange) {
      const snapshot = dataState.getSnapshot() as GraphStoreSnapshot<ElementData, LinkData>;
      onElementsChange?.(snapshot.elements);
      onLinksChange?.(snapshot.links);
    }

    // we can clear it here, because layout update is triggered before state update,
    // so we are sure that all changes are processed in layout before we clear it.
    changes.clear();
  }

  /** Handles a graph cell event by recording the change and triggering updates. */
  function onCellEvent(cell: dia.Cell, type: 'change' | 'add' | 'remove') {
    if (type === 'remove') {
      changes.set(String(cell.id), { type: 'remove' });
    } else {
      changes.set(String(cell.id), { type, data: cell });
    }
    onLayoutUpdateHandler();
    if (enableBatchUpdates && batchDepth > 0) {
      return;
    }
    onStateUpdate();
  }

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
      changes.clear();
      changes.set('reset', { type: 'reset', data: collection.models });
      onLayoutUpdateHandler();
      if (enableBatchUpdates && batchDepth > 0) return;
      onStateUpdate();
    }
  );

  controller.listenTo(graph, LAYOUT_UPDATE_EVENT, () => {
    const layout = getLayout({ graph, papers });
    layoutState.setState(() => ({ elements: layout.elements, links: layout.links }));
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
      onStateUpdate();
    });
  }

  return {
    dataState,
    layoutState,
    clear() {
      changes.clear();
    },
    destroy() {
      controller.stopListening();
      this.clear();
      layoutState.setState(() => ({ elements: {}, links: {} }));
      dataState.setState(() => {
        return { elements: {}, links: {} };
      });
    },
    updateGraph({ elements, links, flag }) {
      // Graph-originated changes publish to React first. Skip the immediate
      // React echo once, then allow subsequent React-originated updates through.
      if (!isSyncedWithReact) {
        isSyncedWithReact = true;
        return;
      }
      const graphElements = Object.entries(elements).map(([id, data]) => ({
        ...elementToAttributes(id, data as ElementData),
        id,
      }));
      const graphLinks = Object.entries(links).map(([id, data]) => ({
        ...linkToAttributes(id, data as LinkData),
        id,
      }));
      graph.syncCells([...graphElements, ...graphLinks], {
        remove: true,
        isUpdateFromReact: flag === 'updateFromReact',
      });

      // Updates are skipped so we have to manually update the state and layout here:
      dataState.setState(() => {
        return {
          elements: elements as Record<string, ElementData>,
          links: links as Record<string, LinkData>,
        };
      });

      const layout = getLayout({ graph, papers });
      layoutState.setState(() => {
        return { elements: layout.elements, links: layout.links };
      });
    },
  };
}
