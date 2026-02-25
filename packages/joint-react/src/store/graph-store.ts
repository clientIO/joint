import { dia, shapes, util } from '@joint/core';
import type { GraphLink } from '../types/link-types';
import type { GraphElement } from '../types/element-types';
import type { AddPaperOptions, PaperStoreSnapshot } from './paper-store';
import { PaperStore } from './paper-store';
import {
  createElementsSizeObserver,
  type GraphStoreObserver,
  type SetMeasuredNodeOptions,
} from './create-elements-size-observer';
import { ReactElement } from '../models/react-element';
import { ReactLink } from '../models/react-link';
import type { ExternalStoreLike, State } from '../utils/create-state';
import { createState, derivedState } from '../utils/create-state';
import { stateSync, type StateSync } from '../state/state-sync';
import type { GraphStateSelectors } from '../state/graph-state-selectors';
import {
  defaultMapDataToElementAttributes,
  defaultMapDataToLinkAttributes,
  defaultMapElementAttributesToData,
  defaultMapLinkAttributesToData,
} from '../state/data-mapping';
import { listenToCellChange, type OnChangeOptions } from '../utils/cell/listen-to-cell-change';
import { Scheduler } from '../utils/scheduler';
import type { GraphSchedulerData } from '../types/scheduler.types';
import { createClearViewCache, type BatchCache } from './batch-cache';
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

  private papers = new Map<string, PaperStore>();
  private observer: GraphStoreObserver;
  private stateSync: StateSync;

  private clearViewCache: BatchCache<dia.Cell.ID, ClearViewCacheEntry>;
  private readonly scheduler: Scheduler<GraphSchedulerData>;
  private paperUpdateCallbacks = new Set<() => void>();
  private isGraphUpdateScheduled = false;
  private isLayoutUpdateScheduled = false;

  private readonly graphToElementSelector: (
    options: { readonly id: string; readonly cell: dia.Element; readonly graph: dia.Graph } & {
      readonly previousData?: GraphElement;
    }
  ) => GraphElement;
  private readonly graphToLinkSelector: (
    options: { readonly id: string; readonly cell: dia.Link; readonly graph: dia.Graph } & {
      readonly previousData?: GraphLink;
    }
  ) => GraphLink;
  public readonly mapDataToElementAttributes: (options: {
    readonly data: GraphElement;
    readonly graph: dia.Graph;
  }) => dia.Cell.JSON;
  private readonly mapDataToLinkAttributes: (options: {
    readonly data: GraphLink;
    readonly graph: dia.Graph;
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
      mapElementAttributesToData = defaultMapElementAttributesToData,
      mapLinkAttributesToData = defaultMapLinkAttributesToData,
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

        // 2. Flush graph updates (clearView cache)
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

    this.clearViewCache = createClearViewCache(() => this.scheduleGraphUpdate());

    this.stateSync = stateSync({
      graph: this.graph,
      scheduler: this.scheduler,
      mapDataToElementAttributes,
      mapDataToLinkAttributes,
      graphToElementSelector: this.graphToElementSelector,
      graphToLinkSelector: this.graphToLinkSelector,
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
   */
  private scheduleLayoutUpdate = () => {
    this.isLayoutUpdateScheduled = true;
    this.scheduler.scheduleData((data) => data);
  };

  // --- Graph Updates Flush ---

  private flushGraphUpdates = () => {
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
      const base = current ?? { paperElementViews: {} };
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
    // Initialize paper snapshot in state if it doesn't exist
    this.internalState.setState((previous) => {
      if (previous.papers[id]) {
        return previous;
      }
      return { ...previous, papers: { ...previous.papers, [id]: {} } };
    });
    return () => this.removePaper(id);
  };

  /**
   * Checks if a node with the given ID is currently being observed for size changes. This can be used by paper views to determine if they should register a node for measurement.
   * @param id - The ID of the node to check.
   * @returns True if the node is being observed, false otherwise.
   */
  public hasMeasuredNode = (id: dia.Cell.ID) => this.observer.has(id);
  /**
   * Registers a node to be observed for size changes. The observer will call the provided callback with batches of size updates, which are then synced to the graph and trigger layout updates.
   * @param options - Configuration options for the measured node, including its ID and a callback to receive size updates.
   * @returns A function to unregister the node from observation.
   */
  public setMeasuredNode = (options: SetMeasuredNodeOptions) => this.observer.add(options);
  /**
   * Get not-reactive paper snapshot for a given paper ID. This is used internally by the paper views to access their own state without causing re-renders.
   * @param id - The id of the paper to access.
   * @returns The paper snapshot or undefined if not found.
   */
  public getPaperStore = (id: string) => this.papers.get(id);

  /**
   * Subscribes to cell changes in the graph and calls the provided callback with change details. This allows external code to react to changes in cells (elements and links) without directly subscribing to the entire graph state.
   * @param callback - A function that receives change details and returns an unsubscribe function.
   * @returns A function to unsubscribe from cell changes.
   */
  public subscribeToCellChange = (callback: (change: OnChangeOptions) => () => void) => {
    return listenToCellChange(this.graph, (change) => callback(change));
  };

  /**
   * Updates the public state of the graph store with a new snapshot. This can be used to replace the entire graph state from an external source, such as when integrating with another state management solution.
   * @param newStore - The new graph store snapshot to replace the current state.
   */
  public updateExternalStore = (newStore: ExternalStoreLike<GraphStoreSnapshot>) => {
    this.publicState = newStore;
  };

  // --- Paper API ---

  public registerPaperUpdate = (callback: () => void): (() => void) => {
    this.paperUpdateCallbacks.add(callback);
    return () => this.paperUpdateCallbacks.delete(callback);
  };

  /**
   * Schedules graph updates (clearView and paper updates) via the single scheduler.
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
    if (this.clearViewCache.isEmpty) return;
    for (const callback of this.paperUpdateCallbacks) {
      callback();
    }
    this.flushGraphUpdates();
  };
}
