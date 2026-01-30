import { dia, shapes, util } from '@joint/core';
import type { GraphLink } from '../types/link-types';
import type { GraphElement } from '../types/element-types';
import type { AddPaperOptions, PaperStoreSnapshot } from './paper-store';
import { PaperStore } from './paper-store';
import { ReactPaperStore, type ReactPaperStoreOptions } from './react-paper-store';

/**
 * Common interface for paper stores (PaperStore and ReactPaperStore).
 * Used by flushLayoutState to read link geometry from paper views.
 */
export interface PaperStoreLike {
  /** The underlying paper instance (dia.Paper or ControlledPaper). */
  readonly paper: dia.Paper;
  /** Unique identifier for this paper instance. */
  readonly paperId: string;
  /** Cleanup function. */
  readonly destroy: () => void;
  /** Optional overwrite result (PaperStore only). */
  readonly overWriteResultRef?: unknown;
  /** Optional render link function (PaperStore only). */
  readonly renderLink?: unknown;
}
import {
  createElementsSizeObserver,
  type GraphStoreObserver,
  type SetMeasuredNodeOptions,
} from './create-elements-size-observer';
import { ReactElement } from '../models/react-element';
import { ReactLink } from '../models/react-link';
import { ReactPaperLink } from '../models/react-paper-link';
import type { ExternalStoreLike, State } from '../utils/create-state';
import { createState, derivedState } from '../utils/create-state';
import { stateSync, type StateSync } from '../state/state-sync';
import type { GraphStateSelectors } from '../state/graph-state-selectors';
import {
  mapElementAttributesToData,
  defaultMapDataToElementAttributes,
  mapLinkAttributesToData,
  defaultMapDataToLinkAttributes,
} from '../state/graph-state-selectors';
import { listenToCellChange, type OnChangeOptions } from '../utils/cell/listen-to-cell-change';
import { Scheduler } from '../utils/scheduler';
import type { GraphSchedulerData } from '../types/scheduler.types';
import { createPortCache, createClearViewCache, type BatchCache } from './batch-cache';
import {
  type PortUpdateCacheEntry,
  mergePortUpdates,
  setPort as setPortEntry,
  removePort as removePortEntry,
  setPortGroup as setPortGroupEntry,
  removePortGroup as removePortGroupEntry,
} from './port-cache';
import {
  type ClearViewCacheEntry,
  mergeClearViewValidators,
  executeClearViewForCell,
} from './clear-view';
import { flushElements, flushLinks, flushLayoutState } from './state-flush';
import { updateGraph } from '../state/update-graph';

export const DEFAULT_CELL_NAMESPACE: Record<string, unknown> = {
  ...shapes,
  ReactElement,
  ReactLink,
  ReactPaperLink,
};

/**
 * External store interface compatible with GraphStore.
 */
export type ExternalGraphStore = ExternalStoreLike<GraphStoreSnapshot>;

/**
 * Internal state type for GraphStore.
 */
export type GraphState = State<GraphStoreInternalSnapshot>;

/**
 * Public snapshot of the graph store containing elements and links.
 */
export interface GraphStoreSnapshot<
  Element extends GraphElement = GraphElement,
  Link extends GraphLink = GraphLink,
> {
  readonly elements: Record<dia.Cell.ID, Element>;
  readonly links: Record<dia.Cell.ID, Link>;
}

/**
 * Layout data for a single node (element).
 */
export interface NodeLayout {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly angle: number;
}

/**
 * Layout data for a single link.
 */
export interface LinkLayout {
  readonly sourceX: number;
  readonly sourceY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly d: string;

  readonly vertices: ReadonlyArray<{ readonly x: number; readonly y: number }>;
}

/**
 * Snapshot containing layout data for all nodes and links (per paper).
 */
export interface GraphStoreLayoutSnapshot {
  readonly elements: Record<dia.Cell.ID, NodeLayout>;
  readonly links: Record<string, Record<dia.Cell.ID, LinkLayout>>;
  readonly wasEverMeasured: boolean;
}

/**
 * Full internal snapshot of the graph store.
 */
export interface GraphStoreInternalSnapshot {
  readonly papers: Record<string, PaperStoreSnapshot>;
}

/**
 * Configuration options for creating a GraphStore instance.
 */
export interface GraphStoreOptions<
  Element extends GraphElement = GraphElement,
  Link extends GraphLink = GraphLink,
> extends GraphStateSelectors<Element, Link> {
  readonly graph?: dia.Graph;
  readonly cellNamespace?: unknown;
  readonly cellModel?: typeof dia.Cell;
  readonly initialElements?: Record<dia.Cell.ID, GraphElement>;
  readonly initialLinks?: Record<dia.Cell.ID, GraphLink>;
  readonly externalStore?: ExternalGraphStore;
}

/**
 * Central store for managing graph state, synchronization, and paper instances.
 */
export class GraphStore {
  public readonly internalState: State<GraphStoreInternalSnapshot>;
  public publicState: ExternalStoreLike<GraphStoreSnapshot>;
  public readonly areElementsMeasuredState: State<boolean>;
  public readonly layoutState: State<GraphStoreLayoutSnapshot>;
  public readonly graph: dia.Graph;

  private papers = new Map<string, PaperStoreLike>();
  private observer: GraphStoreObserver;
  private stateSync: StateSync;

  private portCache: BatchCache<dia.Cell.ID, PortUpdateCacheEntry>;
  private clearViewCache: BatchCache<dia.Cell.ID, ClearViewCacheEntry>;
  private readonly scheduler: Scheduler<GraphSchedulerData>;
  private paperUpdateCallbacks = new Set<() => void>();
  private isGraphUpdateScheduled = false;
  private isLayoutUpdateScheduled = false;

  private readonly graphToElementSelector: (
    options: { readonly id: string; readonly cell: dia.Element; readonly graph: dia.Graph } & {
      readonly previous?: GraphElement;
      readonly defaultAttributes: () => GraphElement;
    }
  ) => GraphElement;
  private readonly graphToLinkSelector: (
    options: { readonly id: string; readonly cell: dia.Link; readonly graph: dia.Graph } & {
      readonly previous?: GraphLink;
      readonly defaultAttributes: () => GraphLink;
    }
  ) => GraphLink;
  private readonly mapDataToElementAttributes: (options: {
    readonly data: GraphElement;
    readonly graph: dia.Graph;
    readonly defaultAttributes: () => dia.Cell.JSON;
  }) => dia.Cell.JSON;
  private readonly mapDataToLinkAttributes: (options: {
    readonly data: GraphLink;
    readonly graph: dia.Graph;
    readonly defaultAttributes: () => dia.Cell.JSON;
  }) => dia.Cell.JSON;

  constructor(config: GraphStoreOptions) {
    const {
      initialElements = {},
      initialLinks = {},
      cellModel,
      cellNamespace = DEFAULT_CELL_NAMESPACE,
      graph,
      externalStore,
      mapDataToElementAttributes = defaultMapDataToElementAttributes,
      mapDataToLinkAttributes = defaultMapDataToLinkAttributes,
    } = config;

    this.graphToElementSelector = mapElementAttributesToData as typeof this.graphToElementSelector;
    this.graphToLinkSelector = mapLinkAttributesToData as typeof this.graphToLinkSelector;
    this.mapDataToElementAttributes =
      mapDataToElementAttributes as typeof this.mapDataToElementAttributes;
    this.mapDataToLinkAttributes = mapDataToLinkAttributes as typeof this.mapDataToLinkAttributes;

    this.graph =
      graph ??
      new dia.Graph(
        {},
        {
          cellNamespace: {
            ...DEFAULT_CELL_NAMESPACE,
            ...(cellNamespace as Record<string, unknown>),
          },
          cellModel,
        }
      );

    this.publicState =
      externalStore ??
      createState<GraphStoreSnapshot>({
        name: 'JointJs/Data',
        newState: () => ({ elements: {}, links: {} }),
        isDevToolEnabled: true,
      });

    this.internalState = createState<GraphStoreInternalSnapshot>({
      name: 'Jointjs/Internal',
      newState: () => ({ papers: {} }),
      isDevToolEnabled: false,
    });

    this.layoutState = createState<GraphStoreLayoutSnapshot>({
      name: 'Jointjs/Layout',
      newState: () => ({ elements: {}, links: {}, wasEverMeasured: false }),
      isEqual: util.isEqual,
      isDevToolEnabled: true,
    });

    this.areElementsMeasuredState = derivedState({
      name: 'Jointjs/AreElementsMeasured',
      state: this.layoutState,
      selector: (snapshot) => {
        if (snapshot.wasEverMeasured) return true;
        const layoutEntries = Object.values(snapshot.elements);
        if (layoutEntries.length === 0) return false;
        return layoutEntries.every((layout) => layout.width > 1 && layout.height > 1);
      },
    });

    // Single scheduler for all updates - GOLDEN RULE: setState ONLY in state-flush.ts
    this.scheduler = new Scheduler<GraphSchedulerData>({
      onFlush: (data) => {
        // Capture flags before resetting them
        const hadGraphUpdate = this.isGraphUpdateScheduled;
        const hadLayoutUpdate = this.isLayoutUpdateScheduled;

        // 1. Flush state updates (uses state-flush.ts - GOLDEN RULE compliant)
        flushElements(this.publicState, data);
        flushLinks(this.publicState, data);

        // 2. Flush graph updates (link/port/clearView caches)
        if (hadGraphUpdate) {
          this.isGraphUpdateScheduled = false;
          for (const callback of this.paperUpdateCallbacks) {
            callback();
          }
          this.flushGraphUpdates();
        }

        // 3. Flush layout state when there are changes (uses state-flush.ts)
        // Also flush after graph updates since papers may have rendered new link views
        const hasElementChanges = data.elementsToUpdate || data.elementsToDelete;
        const hasLinkChanges = data.linksToUpdate || data.linksToDelete;
        const shouldFlushLayout =
          hadLayoutUpdate || hasElementChanges || hasLinkChanges || hadGraphUpdate;
        if (shouldFlushLayout) {
          this.isLayoutUpdateScheduled = false;
          flushLayoutState({
            graph: this.graph,
            layoutState: this.layoutState,
            papers: this.papers,
          });
        }
      },
    });

    // Initial layout update (direct, before scheduler is active)
    flushLayoutState({ graph: this.graph, layoutState: this.layoutState, papers: this.papers });

    // BatchCaches use scheduleGraphUpdate which schedules via the single scheduler
    this.portCache = createPortCache(() => this.scheduleGraphUpdate());
    this.clearViewCache = createClearViewCache(() => this.scheduleGraphUpdate());

    this.stateSync = stateSync({
      graph: this.graph,
      scheduler: this.scheduler,
      mapDataToElementAttributes,
      mapDataToLinkAttributes,
      onGraphUpdated: () => this.scheduleLayoutUpdate(),
      store: {
        getSnapshot: () => this.publicState.getSnapshot(),
        subscribe: this.publicState.subscribe,
      },
    });

    this.observer = createElementsSizeObserver({
      getPublicSnapshot: this.publicState.getSnapshot,
      onBatchUpdate: (newElements) => {
        const snapshot = this.publicState.getSnapshot();

        // 1. Sync new sizes to dia.Graph
        updateGraph({
          graph: this.graph,
          elements: newElements,
          links: snapshot.links,
          graphToElementSelector: this.graphToElementSelector,
          graphToLinkSelector: this.graphToLinkSelector,
          mapDataToElementAttributes: this.mapDataToElementAttributes,
          mapDataToLinkAttributes: this.mapDataToLinkAttributes,
          isUpdateFromReact: false,
        });
      },
      getCellTransform: (id) => {
        const cell = this.graph.getCell(id);
        if (!cell?.isElement()) throw new Error('Cell not valid');
        const size = cell.get('size');
        const position = cell.get('position');
        if (!size) throw new Error('Size not found');
        return {
          width: size.width,
          height: size.height,
          element: cell,
          angle: cell.get('angle') ?? 0,
          ...position,
        };
      },
    });

    // Initial sync
    const graphHasCells = this.graph.getElements().length > 0 || this.graph.getLinks().length > 0;
    if (
      !graphHasCells ||
      Object.keys(initialElements).length > 0 ||
      Object.keys(initialLinks).length > 0
    ) {
      this.publicState.setState((previous) => ({
        ...previous,
        elements: initialElements,
        links: initialLinks,
      }));
    }

    // Update layout after initial sync (graph now has cells with sizes)
    flushLayoutState({ graph: this.graph, layoutState: this.layoutState, papers: this.papers });
  }

  // --- Layout State ---

  /**
   * Schedules a layout state update via the single scheduler.
   * Can be called externally to trigger a layout refresh (e.g., after paper unfreeze).
   */
  public scheduleLayoutUpdate = () => {
    this.isLayoutUpdateScheduled = true;
    this.scheduler.scheduleData((data) => data);
  };

  // --- Port Cache Flush ---

  private flushPortUpdates(): dia.Cell.JSON[] {
    if (this.portCache.isEmpty) return [];

    const cellsToSync: dia.Cell.JSON[] = [];

    for (const [elementId, entry] of this.portCache.entries()) {
      const element = this.graph.getCell(elementId);
      if (!element?.isElement()) continue;

      const currentPorts = element.get('ports') || {};
      const { ports, groups } = mergePortUpdates(
        currentPorts.items || [],
        currentPorts.groups || {},
        entry
      );

      const cellJson = element.toJSON();
      cellJson.ports = { items: ports, groups };
      cellsToSync.push(cellJson);
    }

    this.portCache.clear();
    return cellsToSync;
  }

  // --- Graph Updates Flush ---

  private flushGraphUpdates = () => {
    const portCells = this.flushPortUpdates();

    if (portCells.length > 0) {
      this.graph.syncCells(portCells, { remove: false });
    }

    this.flushClearViewInternal();
  };

  private flushClearViewInternal = () => {
    for (const [cellId, entry] of this.clearViewCache.entries()) {
      executeClearViewForCell(this.papers.values(), this.graph, cellId, entry.onValidateLink);
    }
    this.clearViewCache.clear();
  };

  // --- Public API ---

  public destroy = (isGraphExternal: boolean) => {
    for (const paperStore of this.papers.values()) {
      paperStore.destroy();
    }
    this.papers.clear();
    this.internalState.clean();
    this.layoutState.clean();
    this.areElementsMeasuredState.clean();
    if ('clean' in this.publicState && typeof this.publicState.clean === 'function') {
      this.publicState.clean();
    }
    this.observer.clean();
    this.stateSync.cleanup();
    if (!isGraphExternal) {
      this.graph.clear();
    }
  };

  public updatePaperSnapshot(
    paperId: string,
    updater: (previous: PaperStoreSnapshot | undefined) => PaperStoreSnapshot
  ) {
    this.internalState.setState((previous) => {
      const currentPaper = previous.papers[paperId];
      const nextPaper = updater(currentPaper);
      if (currentPaper === nextPaper) return previous;
      return { ...previous, papers: { ...previous.papers, [paperId]: nextPaper } };
    });
  }

  public updatePaperElementView(paperId: string, cellId: dia.Cell.ID, view: dia.ElementView) {
    this.updatePaperSnapshot(paperId, (current) => {
      const base = current ?? { paperElementViews: {}, portsData: {} };
      if (base.paperElementViews?.[cellId] === view) return base;
      return { paperElementViews: { ...base.paperElementViews, [cellId]: view } };
    });
  }

  public updatePaperLinkView(paperId: string, linkId: dia.Cell.ID, view: dia.LinkView) {
    this.updatePaperSnapshot(paperId, (current) => {
      const base = current ?? { linkViews: {}, linksData: {} };
      if (base.linkViews?.[linkId] === view) return base;
      return { linkViews: { ...base.linkViews, [linkId]: view } };
    });
  }

  private removePaper = (id: string) => {
    const paperStore = this.papers.get(id);
    paperStore?.destroy();
    this.papers.delete(id);
    this.internalState.setState((previous) => {
      const newPapers: Record<string, PaperStoreSnapshot> = {};
      for (const [key, value] of Object.entries(previous.papers)) {
        if (key !== id) newPapers[key] = value;
      }
      return { ...previous, papers: newPapers };
    });
  };

  public addPaper = (id: string, paperOptions: AddPaperOptions) => {
    const paperStore = new PaperStore({ ...paperOptions, graphStore: this, id });
    this.papers.set(id, paperStore);
    return () => this.removePaper(id);
  };

  /**
   * Registers a ReactPaper's ControlledPaper with the graph store.
   * This allows flushLayoutState to read link geometry from the paper's views.
   * @param options - The ReactPaperStore options (paper, paperId)
   * @returns Cleanup function to unregister the paper
   */
  public addReactPaper = (options: ReactPaperStoreOptions) => {
    const reactPaperStore = new ReactPaperStore(options);
    this.papers.set(options.paperId, reactPaperStore);
    return () => this.removePaper(options.paperId);
  };

  public hasMeasuredNode = (id: dia.Cell.ID) => this.observer.has(id);
  public setMeasuredNode = (options: SetMeasuredNodeOptions) => this.observer.add(options);
  public getPaperStore = (id: string) => this.papers.get(id);

  public subscribeToCellChange = (callback: (change: OnChangeOptions) => () => void) => {
    return listenToCellChange(this.graph, (change) => callback(change));
  };

  public updateExternalStore = (newStore: ExternalStoreLike<GraphStoreSnapshot>) => {
    this.publicState = newStore;
  };

  // --- Port API (uses BatchCache) ---

  public setPort = (elementId: dia.Cell.ID, portId: string, portData: dia.Element.Port) => {
    this.portCache.update(elementId, (entry) => setPortEntry(entry, portId, portData));
  };

  public removePort = (elementId: dia.Cell.ID, portId: string) => {
    this.portCache.update(elementId, (entry) => removePortEntry(entry, portId));
  };

  public setPortGroup = (
    elementId: dia.Cell.ID,
    groupId: string,
    groupData: dia.Element.PortGroup
  ) => {
    this.portCache.update(elementId, (entry) => setPortGroupEntry(entry, groupId, groupData));
  };

  public removePortGroup = (elementId: dia.Cell.ID, groupId: string) => {
    this.portCache.update(elementId, (entry) => removePortGroupEntry(entry, groupId));
  };

  // --- Paper API ---

  public registerPaperUpdate = (callback: () => void): (() => void) => {
    this.paperUpdateCallbacks.add(callback);
    return () => this.paperUpdateCallbacks.delete(callback);
  };

  /**
   * Schedules graph updates (link/port/clearView) via the single scheduler.
   * Marks that graph updates need to be flushed in the next onFlush.
   */
  private scheduleGraphUpdate = () => {
    this.isGraphUpdateScheduled = true;
    // Schedule an empty update to trigger onFlush
    this.scheduler.scheduleData((data) => data);
  };

  public schedulePaperUpdate = () => this.scheduleGraphUpdate();

  // --- ClearView API ---

  public scheduleClearView = (options: {
    readonly cellId: dia.Cell.ID;
    readonly onValidateLink?: (link: dia.Link) => boolean;
  }) => {
    // check clear-view.ts for more info
    const existing = this.clearViewCache.get(options.cellId);
    const merged = mergeClearViewValidators(existing, { onValidateLink: options.onValidateLink });
    this.clearViewCache.set(options.cellId, merged);
    this.scheduleGraphUpdate();
  };

  public flushClearView = () => {
    if (this.clearViewCache.isEmpty) return;
    this.flushClearViewInternal();
  };

  public flushPendingUpdates = () => {
    if (this.portCache.isEmpty && this.clearViewCache.isEmpty) return;
    for (const callback of this.paperUpdateCallbacks) {
      callback();
    }
    this.flushGraphUpdates();
  };
}
