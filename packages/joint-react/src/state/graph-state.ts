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
  ElementPosition,
  ElementSize,
  ElementsLayoutState,
  GraphLayoutState,
  GraphDataState,
  LinkLayout,
} from './state.types';
import { getElementLayout, getLayout, getLinkLayout } from '../store/update-layout-state';
import type { FlatElementData } from '../types/element-types';
import type { FlatLinkData } from '../types/link-types';
import { resolveCellDefaults } from './data-mapping/resolve-cell-defaults';
import {
  flatMapDataToElementAttributes,
  flatMapElementAttributesToData,
  flatMapDataToLinkAttributes,
  flatMapLinkAttributesToData,
  type GraphMappings,
} from './data-mapping';
import { createState, type ExternalStoreLike } from '../utils/create-state';
import type { PaperStore } from '../store';
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
  readonly onReset: () => void;
  /** Called when an element's size changes on the graph. */
  readonly onSizeChange?: () => void;

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
  readonly dataState: ExternalStoreLike<GraphDataState<ElementData, LinkData>>;
  readonly layoutState: ExternalStoreLike<GraphLayoutState>;
  readonly clear: () => void;
  readonly destroy: () => void;
  readonly updateGraph: (options: UpdateGraphOptions) => void;
  readonly updateMappers: (mappers: GraphMappings<ElementData, LinkData>) => void;
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
 * @param options.graph
 * @param options.papers
 * @param options.onIncrementalChange
 * @param options.onElementsChange
 * @param options.onLinksChange
 * @param options.onReset
 * @param options.onSizeChange
 * @param options.enableBatchUpdates
 * @param options.mappers
 * @param options.mappers.mapDataToElementAttributes
 * @param options.mappers.mapDataToLinkAttributes
 * @param options.mappers.mapElementAttributesToData
 * @param options.mappers.mapLinkAttributesToData
 * @returns A GraphState object with state stores, update methods, and cleanup functions.
 */
export function graphState<ElementData = FlatElementData, LinkData = FlatLinkData>({
  graph,
  papers,
  onIncrementalChange,
  onElementsChange,
  onLinksChange,
  onReset,
  onSizeChange,
  enableBatchUpdates = false,
  mappers: initialMappers,
}: Options<ElementData, LinkData>): GraphState<ElementData, LinkData> {

  // Mappers are stored mutably so they can be swapped at runtime
  // (e.g. when useElementDefaults/useLinkDefaults deps change).
  const mappers = {
    mapDataToElementAttributes: initialMappers.mapDataToElementAttributes ?? flatMapDataToElementAttributes,
    mapDataToLinkAttributes: initialMappers.mapDataToLinkAttributes ?? flatMapDataToLinkAttributes,
    mapElementAttributesToData: initialMappers.mapElementAttributesToData ?? flatMapElementAttributesToData,
    mapLinkAttributesToData: initialMappers.mapLinkAttributesToData ?? flatMapLinkAttributesToData,
  };

  const controller = new mvc.Listener();
  let batchDepth = 0;
  let isSyncedWithReact = true;

  const dataState = createState<GraphDataState<ElementData, LinkData>>({
    newState: () => ({
      elements: {},
      links: {},
    }),
    name: 'JointJs/Data',
  });
  const layoutState = createState<GraphLayoutState>({
    newState: () => ({
      elements: {
        sizes: {},
        positions: {},
        angles: {},
        count: 0,
        measuredObservedElements: 0,
        observedElements: 0,
      },
      links: {},
    }),
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
    return mappers.mapElementAttributesToData({
      id,
      attributes: element.attributes,
      defaultAttributes,
      element,
      graph,
      previousData,
      toData: (attributes) =>
        flatMapElementAttributesToData({ attributes, defaultAttributes }) as ElementData,
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
    return mappers.mapDataToElementAttributes({
      id,
      data,
      graph,
      toAttributes: (newData) =>
        flatMapDataToElementAttributes({ id, data: newData as FlatElementData }),
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
    return mappers.mapLinkAttributesToData({
      id,
      attributes: link.attributes,
      defaultAttributes,
      link,
      graph,
      previousData,
      toData: (attributes) =>
        flatMapLinkAttributesToData({ attributes, defaultAttributes }) as LinkData,
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
    return mappers.mapDataToLinkAttributes({
      id: mapperId,
      data,
      graph,
      toAttributes: (newData) =>
        flatMapDataToLinkAttributes({ id: mapperId, data: newData as FlatLinkData }),
    });
  }

  /**
   * Updates the link layout for all papers that contain a view of the given link.
   * @param layout - The layout snapshot to update
   * @param nextLinks
   * @param link - The link whose layout to update
   */
  interface MutableLinksLayout {
    links: Record<string, Record<string, LinkLayout>>;
    dirty: boolean;
  }

  function updateLinkLayout(mutableLinks: MutableLinksLayout, link: dia.Link) {
    for (const [paperId, paperStore] of papers) {
      const { paper } = paperStore;
      if (!paper) continue;

      const linkView = paper.findViewByModel(link) as dia.LinkView | null;
      if (!linkView) continue;

      if (!mutableLinks.dirty) {
        mutableLinks.links = { ...mutableLinks.links };
        mutableLinks.dirty = true;
      }
      if (!mutableLinks.links[paperId]) {
        mutableLinks.links[paperId] = {};
      }
      mutableLinks.links[paperId][String(link.id)] = getLinkLayout(linkView);
    }
  }

  /**
   * Mutable container that lazily copies sub-records on first write.
   * Tracks which sub-records have been mutated via dirty flags.
   */
  interface MutableElementsLayout extends ElementsLayoutState {
    sizes: Record<string, ElementSize>;
    positions: Record<string, ElementPosition>;
    angles: Record<string, number>;
    count: number;
    dirtySizes: boolean;
    dirtyPositions: boolean;
    dirtyAngles: boolean;
    dirtyCount: boolean;
  }

  function createMutableElementsLayout(previous: ElementsLayoutState): MutableElementsLayout {
    return {
      ...previous,
      dirtySizes: false,
      dirtyPositions: false,
      dirtyAngles: false,
      dirtyCount: false,
    };
  }

  /**
   * Processes a layout change for a single element or link.
   * Preserves object references when sub-values haven't changed.
   * @param id
   * @param change
   * @param elements
   * @param nextLinks
   */
  function handleCellLayoutChange(
    id: string,
    change: IncrementalChange<dia.Cell>,
    elements: MutableElementsLayout,
    nextLinks: MutableLinksLayout
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
          const previousSize = elements.sizes[id];
          const isNew = !previousSize;

          if (isNew) {
            elements.count += 1;
            elements.dirtyCount = true;
          }

          if (previousSize?.width !== layout.width || previousSize?.height !== layout.height) {
            if (!elements.dirtySizes) {
              elements.sizes = { ...elements.sizes };
              elements.dirtySizes = true;
            }
            const newSize: ElementSize = { width: layout.width, height: layout.height };
            elements.sizes[id] = newSize;
          }

          const previousPosition = elements.positions[id];
          if (previousPosition?.x !== layout.x || previousPosition?.y !== layout.y) {
            if (!elements.dirtyPositions) {
              elements.positions = { ...elements.positions };
              elements.dirtyPositions = true;
            }
            elements.positions[id] = { x: layout.x, y: layout.y };
          }
          if (elements.angles[id] !== layout.angle) {
            if (!elements.dirtyAngles) {
              elements.angles = { ...elements.angles };
              elements.dirtyAngles = true;
            }
            elements.angles[id] = layout.angle;
          }
          const connectedLinks = graph.getConnectedLinks(cell);
          for (const link of connectedLinks) {
            updateLinkLayout(nextLinks, link);
          }
        } else if (cell.isLink()) {
          updateLinkLayout(nextLinks, cell);
        }
        break;
      }

      case 'remove': {
        // Update count/measured before removing size record
        const removedSize = elements.sizes[id];
        if (removedSize) {
          elements.count -= 1;
          elements.dirtyCount = true;
        }

        if (!elements.dirtySizes) {
          elements.sizes = { ...elements.sizes };
          elements.dirtySizes = true;
        }
        if (!elements.dirtyPositions) {
          elements.positions = { ...elements.positions };
          elements.dirtyPositions = true;
        }
        if (!elements.dirtyAngles) {
          elements.angles = { ...elements.angles };
          elements.dirtyAngles = true;
        }
        delete elements.sizes[id];
        delete elements.positions[id];
        delete elements.angles[id];
        if (!nextLinks.dirty) {
          nextLinks.links = { ...nextLinks.links };
          nextLinks.dirty = true;
        }
        for (const paperLinks of Object.values(nextLinks.links)) {
          delete paperLinks[id];
        }
        break;
      }

      case 'reset': {
        const resetLayout = getLayout({ graph, papers });
        return {
          ...resetLayout,
          elements: {
            ...resetLayout.elements,
            observedElements: elements.observedElements,
            measuredObservedElements: elements.measuredObservedElements,
          },
        };
      }
    }
  }
  /**
   * Handles layout updates by processing the accumulated changes and updating the layout state accordingly.
   * @param changes - A map of cell ID to incremental change that has occurred since the last layout update.
   */
  function onLayoutUpdateHandler(changes: Map<string, IncrementalChange<dia.Cell>>) {
    layoutState.setState((previous) => {
      const mutableElements = createMutableElementsLayout(previous.elements);
      const mutableLinks: MutableLinksLayout = { links: previous.links, dirty: false };

      for (const [id, change] of changes) {
        const resetResult = handleCellLayoutChange(id, change, mutableElements, mutableLinks);
        if (resetResult) return resetResult;
      }

      const { dirtySizes, dirtyPositions, dirtyAngles, dirtyCount } = mutableElements;
      const elementsChanged = dirtySizes || dirtyPositions || dirtyAngles || dirtyCount;

      if (!elementsChanged && !mutableLinks.dirty) {
        return previous;
      }

      if (dirtySizes && onSizeChange) {
        onSizeChange();
      }
      const elements: ElementsLayoutState = elementsChanged
        ? {
            sizes: mutableElements.sizes,
            positions: mutableElements.positions,
            angles: mutableElements.angles,
            count: mutableElements.count,
            observedElements: mutableElements.observedElements,
            measuredObservedElements: mutableElements.measuredObservedElements,
          }
        : previous.elements;

      return { elements, links: mutableLinks.links };
    });
  }

  /** Flushes accumulated changes to the data state and notifies change callbacks. */
  function onStateUpdate() {
    dataState.setState((previous) => {
      let nextElements = previous.elements;
      let nextLinks = previous.links;
      let dirtyElements = false;
      let dirtyLinks = false;
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
              if (!dirtyElements) {
                nextElements = { ...nextElements };
                dirtyElements = true;
              }
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
              if (!dirtyLinks) {
                nextLinks = { ...nextLinks };
                dirtyLinks = true;
              }
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
            if (!dirtyElements) {
              nextElements = { ...nextElements };
              dirtyElements = true;
            }
            if (!dirtyLinks) {
              nextLinks = { ...nextLinks };
              dirtyLinks = true;
            }
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

      if (!dirtyElements && !dirtyLinks) {
        return previous;
      }

      isSyncedWithReact = false;
      onIncrementalChange?.(stateChanges);
      return { elements: nextElements, links: nextLinks };
    });

    if (onElementsChange || onLinksChange) {
      const snapshot = dataState.getSnapshot() as GraphDataState<ElementData, LinkData>;
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
      onReset();
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
      layoutState.setState(() => ({
        elements: {
          sizes: {},
          positions: {},
          angles: {},
          count: 0,
          measuredObservedElements: 0,
          observedElements: 0,
        },
        links: {},
      }));
      dataState.setState(() => {
        return { elements: {}, links: {} };
      });
    },
    updateMappers(nextMappers) {
      let changed = false;
      if (nextMappers.mapDataToElementAttributes && nextMappers.mapDataToElementAttributes !== mappers.mapDataToElementAttributes) {
        mappers.mapDataToElementAttributes = nextMappers.mapDataToElementAttributes;
        changed = true;
      }
      if (nextMappers.mapDataToLinkAttributes && nextMappers.mapDataToLinkAttributes !== mappers.mapDataToLinkAttributes) {
        mappers.mapDataToLinkAttributes = nextMappers.mapDataToLinkAttributes;
        changed = true;
      }
      if (nextMappers.mapElementAttributesToData && nextMappers.mapElementAttributesToData !== mappers.mapElementAttributesToData) {
        mappers.mapElementAttributesToData = nextMappers.mapElementAttributesToData;
        changed = true;
      }
      if (nextMappers.mapLinkAttributesToData && nextMappers.mapLinkAttributesToData !== mappers.mapLinkAttributesToData) {
        mappers.mapLinkAttributesToData = nextMappers.mapLinkAttributesToData;
        changed = true;
      }
      if (!changed) return;
      // Re-map all existing data through updated mappers
      const { elements, links } = dataState.getSnapshot();
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
        isUpdateFromReact: true,
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
      layoutState.setState((previous) => ({
        ...layout,
        elements: {
          ...layout.elements,
          observedElements: previous.elements.observedElements,
          measuredObservedElements: previous.elements.measuredObservedElements,
        },
      }));
    },
  };
}
