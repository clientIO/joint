import { dia, shapes, util } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { FlatLinkData } from '../types/link-types';
import type { FlatElementData } from '../types/element-types';
import type { AddPaperOptions, PaperStoreSnapshot } from './paper-store';
import { PaperStore, createPaperStoreSnapshot } from './paper-store';
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
import { scheduler } from '../utils/scheduler';
import { executeClearViewForCell } from './clear-view';
import { updateLayoutState } from './update-layout-state';

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
export interface GraphStoreSnapshot<ElementData = FlatElementData, LinkData = FlatLinkData> {
  readonly elements: Record<CellId, ElementData>;
  readonly links: Record<CellId, LinkData>;
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
  readonly elements: Record<CellId, NodeLayout>;
  readonly links: Record<string, Record<CellId, LinkLayout>>;
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
export interface GraphStoreOptions<ElementData = FlatElementData, LinkData = FlatLinkData>
  extends GraphStateSelectors<ElementData, LinkData> {
  readonly graph?: dia.Graph;
  readonly cellNamespace?: unknown;
  readonly cellModel?: typeof dia.Cell;
  readonly initialElements?: Record<CellId, FlatElementData>;
  readonly initialLinks?: Record<CellId, FlatLinkData>;
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

  public paperStores = new Map<string, PaperStore>();
  private observer: GraphStoreObserver;
  private stateSync!: StateSync;
  private unsubscribePublicState?: () => void;

  private readonly graphToElementSelector: (
    options: { readonly id: string; readonly element: dia.Element; readonly graph: dia.Graph } & {
      readonly previousData?: FlatElementData;
    }
  ) => FlatElementData;
  private readonly graphToLinkSelector: (
    options: { readonly id: string; readonly link: dia.Link; readonly graph: dia.Graph } & {
      readonly previousData?: FlatLinkData;
    }
  ) => FlatLinkData;
  public readonly mapDataToElementAttributes: (options: {
    readonly data: FlatElementData;
    readonly graph: dia.Graph;
  }) => dia.Cell.JSON;
  public readonly mapDataToLinkAttributes: (options: {
    readonly data: FlatLinkData;
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

    this.publicState = scheduler.wrap(
      externalStore ??
        createState<GraphStoreSnapshot>({
          name: 'JointJs/Data',
          newState: () => ({ elements: {}, links: {} }),
        })
    );

    this.internalState = scheduler.wrap(
      createState<GraphStoreInternalSnapshot>({
        name: 'Jointjs/Internal',
        newState: () => ({ papers: {} }),
      })
    );

    this.layoutState = scheduler.wrap(
      createState<GraphStoreLayoutSnapshot>({
        name: 'Jointjs/Layout',
        newState: () => ({ elements: {}, links: {} }),
        isEqual: util.isEqual,
      })
    );

    this.areElementsMeasuredState = derivedState({
      name: 'Jointjs/AreElementsMeasured',
      state: [this.layoutState, this.internalState],
      selector: (layoutSnapshot, internalSnapshot) => {
        // Wait for each paper to publish at least one view metadata snapshot.
        // This avoids reporting "ready" before ReactPaper has mounted views.
        const papers = Object.values(internalSnapshot.papers);
        if (papers.length === 0) return false;
        for (const paper of papers) {
          if (!paper.hasElementViewSnapshot) return false;
        }
        const layoutEntries = Object.values(layoutSnapshot.elements);
        if (layoutEntries.length === 0) return false;
        return layoutEntries.every((layout) => layout.width > 1 && layout.height > 1);
      },
    });

    // Initial layout update.
    updateLayoutState({
      graph: this.graph,
      layoutState: this.layoutState,
      papers: this.paperStores,
    });

    this.observer = createElementsSizeObserver({
      getPublicSnapshot: this.publicState.getSnapshot,
      onBatchUpdate: (newElements) => {
        this.publicState.setState((previous) => {
          return { ...previous, elements: newElements };
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
      !externalStore &&
      (!graphHasCells ||
        Object.keys(initialElements).length > 0 ||
        Object.keys(initialLinks).length > 0)
    ) {
      this.publicState.setState((previous) => ({
        ...previous,
        elements: initialElements,
        links: initialLinks,
      }));
    }

    // Bind sync after initial seed so stateSync can hydrate graph from pending snapshot immediately.
    this.bindPublicState();

    // Update layout after initial sync (graph now has cells with sizes)
    this.scheduleLayoutUpdate();
  }

  // --- Layout State ---

  /**
   * Updates layout state from current graph and paper view snapshots.
   */
  private scheduleLayoutUpdate = () => {
    updateLayoutState({
      graph: this.graph,
      layoutState: this.layoutState,
      papers: this.paperStores,
    });
  };

  private bindPublicState(): void {
    this.stateSync = stateSync({
      graph: this.graph,
      mapDataToElementAttributes: this.mapDataToElementAttributes,
      mapDataToLinkAttributes: this.mapDataToLinkAttributes,
      graphToElementSelector: this.graphToElementSelector,
      graphToLinkSelector: this.graphToLinkSelector,
      onGraphUpdated: this.scheduleLayoutUpdate,
      store: this.publicState,
    });
    this.unsubscribePublicState = this.publicState.subscribe(this.scheduleLayoutUpdate);
  }

  private unbindPublicState(): void {
    this.stateSync.cleanup();
    this.unsubscribePublicState?.();
    this.unsubscribePublicState = undefined;
  }

  // --- Public API ---

  public destroy = (isGraphExternal: boolean) => {
    for (const paperStore of this.paperStores.values()) {
      paperStore.destroy();
    }
    this.paperStores.clear();
    this.internalState.clean();
    this.layoutState.clean();
    this.areElementsMeasuredState.clean();
    if ('clean' in this.publicState && typeof this.publicState.clean === 'function') {
      this.publicState.clean();
    }
    this.observer.clean();
    this.unbindPublicState();
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

  private setPaperElementViewMountedState(
    paperId: string,
    cellId: CellId,
    isMounted: boolean
  ): boolean {
    let isChanged = false;
    this.internalState.setState((previous) => {
      const currentPaper = previous.papers[paperId];
      if (!currentPaper && !isMounted) {
        return previous;
      }

      const basePaper = currentPaper ?? createPaperStoreSnapshot();
      const hadCell = !!basePaper.elementViewIds[cellId];
      if ((isMounted && hadCell) || (!isMounted && !hadCell)) {
        return previous;
      }

      const nextElementViewIds = { ...basePaper.elementViewIds };
      if (isMounted) {
        nextElementViewIds[cellId] = true;
      } else {
        Reflect.deleteProperty(nextElementViewIds, cellId);
      }

      isChanged = true;
      const nextPaper: PaperStoreSnapshot = {
        ...basePaper,
        hasElementViewSnapshot: basePaper.hasElementViewSnapshot || isMounted,
        elementViewIds: nextElementViewIds,
      };
      return { ...previous, papers: { ...previous.papers, [paperId]: nextPaper } };
    });
    return isChanged;
  }

  private setPaperLinkViewMountedState(
    paperId: string,
    linkId: CellId,
    isMounted: boolean
  ): boolean {
    let isChanged = false;
    this.internalState.setState((previous) => {
      const currentPaper = previous.papers[paperId];
      if (!currentPaper && !isMounted) {
        return previous;
      }

      const basePaper = currentPaper ?? createPaperStoreSnapshot();
      const hadLink = !!basePaper.linkViewIds[linkId];
      if ((isMounted && hadLink) || (!isMounted && !hadLink)) {
        return previous;
      }

      const nextLinkViewIds = { ...basePaper.linkViewIds };
      if (isMounted) {
        nextLinkViewIds[linkId] = true;
      } else {
        Reflect.deleteProperty(nextLinkViewIds, linkId);
      }

      isChanged = true;
      const nextPaper: PaperStoreSnapshot = {
        ...basePaper,
        linkViewIds: nextLinkViewIds,
      };
      return { ...previous, papers: { ...previous.papers, [paperId]: nextPaper } };
    });
    return isChanged;
  }

  public markPaperElementViewMounted(paperId: string, cellId: CellId): void {
    const isChanged = this.setPaperElementViewMountedState(paperId, cellId, true);
    if (isChanged) {
      this.scheduleLayoutUpdate();
    }
  }

  public markPaperElementViewUnmounted(paperId: string, cellId: CellId): void {
    const isChanged = this.setPaperElementViewMountedState(paperId, cellId, false);
    if (isChanged) {
      this.scheduleLayoutUpdate();
    }
  }

  public markPaperLinkViewMounted(paperId: string, linkId: CellId): void {
    const isChanged = this.setPaperLinkViewMountedState(paperId, linkId, true);
    if (isChanged) {
      this.scheduleLayoutUpdate();
    }
  }

  public markPaperLinkViewUnmounted(paperId: string, linkId: CellId): void {
    const isChanged = this.setPaperLinkViewMountedState(paperId, linkId, false);
    if (isChanged) {
      this.scheduleLayoutUpdate();
    }
  }

  private removePaper = (id: string) => {
    const paperStore = this.paperStores.get(id);
    paperStore?.destroy();
    this.paperStores.delete(id);
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
    this.paperStores.set(id, paperStore);
    // Initialize paper snapshot in state if it doesn't exist
    this.internalState.setState((previous) => {
      if (previous.papers[id]) {
        return previous;
      }
      return { ...previous, papers: { ...previous.papers, [id]: createPaperStoreSnapshot() } };
    });
    return () => this.removePaper(id);
  };

  /**
   * Checks if a node with the given ID is currently being observed for size changes. This can be used by paper views to determine if they should register a node for measurement.
   * @param id - The ID of the node to check.
   * @returns True if the node is being observed, false otherwise.
   */
  public hasMeasuredNode = (id: CellId) => this.observer.has(id);
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
  public getPaperStore = (id: string) => this.paperStores.get(id);

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
    this.unbindPublicState();
    this.publicState = scheduler.wrap(newStore);
    this.bindPublicState();
  };

  // --- ClearView API ---

  public scheduleClearView = (options: {
    readonly cellId: CellId;
    readonly onValidateLink?: (link: dia.Link) => boolean;
  }) => {
    executeClearViewForCell(
      this.paperStores.values(),
      this.graph,
      options.cellId,
      options.onValidateLink
    );
    this.scheduleLayoutUpdate();
  };
}
