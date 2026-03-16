/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-shadow */
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
import { mvc, util, type dia } from '@joint/core';
import type { IncrementalChange, IncrementalStateChanges } from './incremental.types';
import type {
  GraphStoreLayoutSnapshot,
  GraphStoreSnapshot,
  LinkLayout,
  NodeLayout,
  PaperStore,
} from '../store';
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

export interface ElementToData<ElementData = FlatElementData> {
  readonly element: dia.Element;
  readonly previousData?: ElementData;
}

export interface LinkToData<LinkData = FlatLinkData> {
  readonly link: dia.Link;
  readonly previousData?: LinkData;
}

export interface ElementToAttributes<ElementData = FlatElementData> {
  readonly id: string;
  readonly data: ElementData;
}

export interface LinkToAttributes<LinkData = FlatLinkData> {
  readonly id?: string;
  readonly data: LinkData;
}

export interface GraphState<ElementData = FlatElementData, LinkData = FlatLinkData> {
  readonly dataState: ExternalStoreLike<GraphStoreSnapshot<ElementData, LinkData>>;
  readonly layoutState: ExternalStoreLike<GraphStoreLayoutSnapshot>;
  readonly clear: () => void;
  readonly destroy: () => void;
  readonly updateGraph: (options: UpdateGraphOptions) => void;
  readonly elementToData: (options: ElementToData<ElementData>) => ElementData;
  readonly linkToData: (options: LinkToData<LinkData>) => LinkData;
  readonly elementToAttributes: (options: ElementToAttributes<ElementData>) => dia.Cell.JSON;
  readonly linkToAttributes: (options: LinkToAttributes<LinkData>) => dia.Cell.JSON;
}

interface MutableIncrementalStateChange<T> {
  added?: Record<string, T>;
  changed?: Record<string, T>;
  removed?: Record<string, T>;
  reset?: Record<string, T>;
}

/**
 * Sets a record entry in an incremental state change object.
 * @param change - The mutable incremental state change to update
 * @param type - The type of change (added, changed, or removed)
 * @param id - The cell identifier
 * @param data - The data to set
 */
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
 * @param options - Configuration including graph, papers, change callbacks, and mapping functions.
 * @param options.graph - The JointJS graph instance to observe
 * @param options.papers - Map of paper stores for layout tracking
 * @param options.onIncrementalChange - Optional callback for incremental state changes
 * @param options.onElementsChange - Optional callback when elements change
 * @param options.onLinksChange - Optional callback when links change
 * @param options.enableBatchUpdates - Whether to defer updates during batch operations
 * @param options.mappers - Custom mapping functions for data conversion
 * @param options.mappers.mapDataToElementAttributes - Maps element data to JointJS attributes
 * @param options.mappers.mapDataToLinkAttributes - Maps link data to JointJS attributes
 * @param options.mappers.mapElementAttributesToData - Maps JointJS element attributes to data
 * @param options.mappers.mapLinkAttributesToData - Maps JointJS link attributes to data
 * @returns A GraphState object with state stores, update methods, and cleanup functions.
 */
export function graphState<ElementData = FlatElementData, LinkData = FlatLinkData>({
  graph,
  papers,
  onIncrementalChange,
  onElementsChange,
  onLinksChange,
  enableBatchUpdates = false,
  mappers: {
    mapDataToElementAttributes = defaultMapDataToElementAttributes,
    mapDataToLinkAttributes = defaultMapDataToLinkAttributes,
    mapElementAttributesToData = defaultMapElementAttributesToData,
    mapLinkAttributesToData = defaultMapLinkAttributesToData,
  },
}: Options<ElementData, LinkData>): GraphState<ElementData, LinkData> {
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

  /**
   * Returns the previous link data for the given cell, if available.
   * @param cell - The link cell to look up
   * @returns The previous link data or undefined
   */
  function getPreviousLinkData(cell: dia.Link): LinkData | undefined {
    const id = String(cell.id);
    return dataState.getSnapshot().links[id] as LinkData | undefined;
  }
  /**
   * Returns the previous element data for the given cell, if available.
   * @param cell - The element cell to look up
   * @returns The previous element data or undefined
   */
  function getPreviousElementData(cell: dia.Element): ElementData | undefined {
    const id = String(cell.id);
    return dataState.getSnapshot().elements[id] as ElementData | undefined;
  }

  /**
   * Converts a JointJS element to its React data representation.
   * @param root0 - The element conversion options
   * @param root0.element - The JointJS element to convert
   * @param root0.previousData - The previous data for diffing
   * @returns The converted element data
   */
  function elementToData({ element, previousData }: ElementToData<ElementData>): ElementData {
    previousData = previousData ?? getPreviousElementData(element);
    const defaultAttributes = resolveCellDefaults(element);
    const id = String(element.id);
    return mapElementAttributesToData({
      id,
      attributes: element.attributes,
      defaultAttributes,
      element,
      graph,
      previousData,
      toData: (attributes) =>
        defaultMapElementAttributesToData({ attributes, defaultAttributes }) as ElementData,
    });
  }
  /**
   * Converts React element data to JointJS cell attributes.
   * @param root0 - The element attributes options
   * @param root0.id - The element identifier
   * @param root0.data - The element data to convert
   * @returns The JointJS cell attributes
   */
  function elementToAttributes({ id, data }: ElementToAttributes<ElementData>) {
    return mapDataToElementAttributes({
      id,
      data,
      graph,
      toAttributes: (newData) =>
        defaultMapDataToElementAttributes({ id, data: newData as FlatElementData }),
    });
  }

  /**
   * Converts a JointJS link to its React data representation.
   * @param root0 - The link conversion options
   * @param root0.link - The JointJS link to convert
   * @param root0.previousData - The previous data for diffing
   * @returns The converted link data
   */
  function linkToData({ link, previousData }: LinkToData<LinkData>): LinkData {
    previousData = previousData ?? getPreviousLinkData(link);
    const defaultAttributes = resolveCellDefaults(link);
    const id = String(link.id);
    return mapLinkAttributesToData({
      id,
      attributes: link.attributes,
      defaultAttributes,
      link,
      graph,
      previousData,
      toData: (attributes) =>
        defaultMapLinkAttributesToData({ attributes, defaultAttributes }) as LinkData,
    });
  }
  /**
   * Converts React link data to JointJS cell attributes.
   * @param root0 - The link attributes options
   * @param root0.id - The link identifier
   * @param root0.data - The link data to convert
   * @returns The JointJS cell attributes
   */
  function linkToAttributes({ id, data }: LinkToAttributes<LinkData>): dia.Cell.JSON {
    const mapperId = id ?? util.uuid();
    return mapDataToLinkAttributes({
      id: mapperId,
      data,
      graph,
      toAttributes: (newData) =>
        defaultMapDataToLinkAttributes({ id: mapperId, data: newData as FlatLinkData }),
    });
  }

  /**
   * Updates the link layout for all papers that contain a view of the given link.
   * @param layout - The layout snapshot to update
   * @param link - The link whose layout to update
   */
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

  /**
   * Processes a layout change for a single element or link.
   * @param id - The cell identifier
   * @param change - The incremental change to process
   * @param nextElements - The mutable elements layout record
   * @param nextLinks - The mutable links layout record
   * @returns Updated layout for reset changes, or undefined
   */
  function handleElementLayoutChange(
    id: string,
    change: IncrementalChange<dia.Cell>,
    nextElements: Record<string, NodeLayout>,
    nextLinks: Record<string, Record<string, LinkLayout>>
  ) {
    switch (change.type) {
      case 'add':
      case 'change': {
        const cell = change.data;
        if (cell.isElement()) {
          const layout = getElementLayout(cell);
          if (!layout) {
            return;
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
        delete nextElements[id];
        for (const paperLinks of Object.values(nextLinks)) {
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
  /**
   * Handles layout updates by processing the accumulated changes and updating the layout state accordingly.
   * @param changes - A map of cell ID to incremental change that has occurred since the last layout update.
   */
  function onLayoutUpdateHandler(changes: Map<string, IncrementalChange<dia.Cell>>) {
    layoutState.setState((previous) => {
      const nextElements = { ...previous.elements };
      const nextLinks = { ...previous.links };

      for (const [id, change] of changes) {
        handleElementLayoutChange(id, change, nextElements, nextLinks);
      }
      return { elements: nextElements, links: nextLinks };
    });
  }

  /** Flushes accumulated changes to the data state and notifies change callbacks. */
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
              const newData = elementToData({
                element: cell,
                previousData: previous.elements[id],
              });
              nextElements[id] = newData;
              setIncrementalChangeRecord(
                stateChanges.elements as MutableIncrementalStateChange<ElementData>,
                change.type === 'add' ? 'added' : 'changed',
                id,
                newData
              );
            } else if (cell.isLink()) {
              const newData = linkToData({
                link: cell,
                previousData: previous.links[id],
              });
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
                const newData = elementToData({ element: cell });
                resetElements[String(cell.id)] = newData;
              } else if (cell.isLink()) {
                const newData = linkToData({ link: cell });
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

  /**
   * Handles a graph cell event by recording the change and triggering updates.
   * @param cell - The cell that changed
   * @param type - The type of change
   */
  function onCellEvent(cell: dia.Cell, type: 'change' | 'add' | 'remove') {
    if (type === 'remove') {
      changes.set(String(cell.id), { type: 'remove' });
    } else {
      changes.set(String(cell.id), { type, data: cell });
    }
    onLayoutUpdateHandler(changes);
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
      onLayoutUpdateHandler(changes);
      if (enableBatchUpdates && batchDepth > 0) return;
      onStateUpdate();
    }
  );

  controller.listenTo(graph, LAYOUT_UPDATE_EVENT, ({ changes: changesFrom }) => {
    onLayoutUpdateHandler(changesFrom);
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
    elementToData,
    linkToData,
    elementToAttributes,
    linkToAttributes,
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
        ...elementToAttributes({ id, data: data as ElementData }),
        id,
      }));
      const graphLinks = Object.entries(links).map(([id, data]) => ({
        ...linkToAttributes({ id, data: data as LinkData }),
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
