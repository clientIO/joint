import { dia, shapes } from '@joint/core';
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
import type { GraphStateSelectors } from '../state/graph-state-selectors';
import {
  defaultMapDataToElementAttributes,
  defaultMapDataToLinkAttributes,
  defaultMapElementAttributesToData,
  defaultMapLinkAttributesToData,
} from '../state/data-mapping';
import { executeClearViewForCell } from './clear-view';
import { graphState, LAYOUT_UPDATE_EVENT, type ListenOutput } from '../state/graph-state';
import {
  createState,
  derivedState,
  type ExternalStoreLike,
  type State,
} from '../utils/create-state';
import type { IncrementalStateChanges } from '../state/incremental.types';

export const DEFAULT_CELL_NAMESPACE: Record<string, unknown> = {
  ...shapes,
  ReactElement,
  ReactLink,
};

/**
 * Public snapshot of the graph store containing elements and links.
 */
export interface GraphStoreSnapshot<ElementData = FlatElementData, LinkData = FlatLinkData> {
  elements: Record<CellId, ElementData>;
  links: Record<CellId, LinkData>;
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
  elements: Record<CellId, NodeLayout>;
  links: Record<string, Record<CellId, LinkLayout>>;
}

/**
 * Full internal snapshot of the graph store.
 */
export interface GraphStoreInternalSnapshot {
  papers: Record<string, PaperStoreSnapshot>;
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

/**
 * Central store for managing graph state, synchronization, and paper instances.
 */
export class GraphStore {
  public readonly internalState: State<GraphStoreInternalSnapshot>;
  public readonly publicState: ExternalStoreLike<GraphStoreSnapshot>;
  public readonly areElementsMeasuredState: ExternalStoreLike<boolean>;
  public readonly layoutState: ExternalStoreLike<GraphStoreLayoutSnapshot>;
  public readonly graph: dia.Graph;
  public readonly graphState: ListenOutput;
  public readonly mapDataToElementAttributes: (options: {
    readonly data: FlatElementData;
    readonly id?: string;
    readonly graph: dia.Graph;
  }) => dia.Cell.JSON;
  public readonly mapDataToLinkAttributes: (options: {
    readonly data: FlatLinkData;
    readonly id?: string;
    readonly graph: dia.Graph;
  }) => dia.Cell.JSON;

  public paperStores = new Map<string, PaperStore>();
  private observer: GraphStoreObserver;

  constructor(config: GraphStoreOptions) {
    const {
      initialElements = {},
      initialLinks = {},
      cellModel,
      cellNamespace = DEFAULT_CELL_NAMESPACE,
      graph,
      onIncrementalChange,
      onElementsChange,
      onLinksChange,
      enableBatchUpdates,
      mapDataToElementAttributes = defaultMapDataToElementAttributes,
      mapDataToLinkAttributes = defaultMapDataToLinkAttributes,
      mapElementAttributesToData = defaultMapElementAttributesToData,
      mapLinkAttributesToData = defaultMapLinkAttributesToData,
    } = config;

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

    this.mapDataToElementAttributes = ((options: {
      data: FlatElementData;
      id?: string;
      graph: dia.Graph;
    }) => {
      // Normalize nested JointJS format (position/size) to flat format (x/y/width/height)
      const { position, size, ...rest } = options.data as FlatElementData & {
        position?: { x: number; y: number };
        size?: { width: number; height: number };
      };
      const normalized: FlatElementData = { ...rest };
      if (position) {
        normalized.x = position.x;
        normalized.y = position.y;
      }
      if (size) {
        normalized.width = size.width;
        normalized.height = size.height;
      }
      return mapDataToElementAttributes({
        ...options,
        id: options.id ?? '',
        data: normalized,
        toAttributes: (data) =>
          defaultMapDataToElementAttributes({
            id: options.id ?? '',
            data: data as FlatElementData,
          }),
      });
    }) as typeof this.mapDataToElementAttributes;

    this.mapDataToLinkAttributes = ((options: {
      data: FlatLinkData;
      id: string;
      graph: dia.Graph;
    }) =>
      mapDataToLinkAttributes({
        ...options,
        toAttributes: (data) =>
          defaultMapDataToLinkAttributes({ id: options.id, data: data as FlatLinkData }),
      })) as typeof this.mapDataToLinkAttributes;

    this.internalState = createState<GraphStoreInternalSnapshot>({
      newState: () => ({ papers: {} }),
      name: 'JointJs/Internal',
    });

    this.graphState = graphState({
      graph: this.graph,
      papers: this.paperStores,
      onIncrementalChange: onIncrementalChange as
        | ((changes: IncrementalStateChanges) => void)
        | undefined,
      onElementsChange: onElementsChange as
        | ((elements: Record<string, FlatElementData>) => void)
        | undefined,
      onLinksChange: onLinksChange as ((links: Record<string, FlatLinkData>) => void) | undefined,
      enableBatchUpdates,
      mappers: {
        mapDataToElementAttributes,
        mapDataToLinkAttributes,
        mapElementAttributesToData,
        mapLinkAttributesToData,
      },
    });

    this.publicState = this.graphState.publicState;
    this.layoutState = this.graphState.layoutState;

    this.areElementsMeasuredState = derivedState({
      state: [this.graphState.layoutState, this.internalState] as const,
      selector: (
        layoutSnapshot: GraphStoreLayoutSnapshot,
        internalSnapshot: GraphStoreInternalSnapshot
      ) => {
        const papers = Object.values(internalSnapshot.papers);
        if (papers.length === 0) return false;
        for (const paper of papers) {
          if (!paper.hasElementViewSnapshot) return false;
        }
        const layoutEntries = Object.values(layoutSnapshot.elements);
        if (layoutEntries.length === 0) return false;
        return layoutEntries.every((layout) => layout.width > 1 && layout.height > 1);
      },
      isEqual: (a, b) => a === b,
      name: 'JointJs/AreElementsMeasured',
    });

    this.observer = createElementsSizeObserver({
      getPublicSnapshot: () => this.publicState.getSnapshot(),
      onBatchUpdate: (updatedElements) => {
        this.graph.startBatch('resize');
        for (const [id, data] of Object.entries(updatedElements)) {
          const cell = this.graph.getCell(id);
          if (cell?.isElement()) {
            cell.set('size', { width: data.width, height: data.height });
            if (data.x !== undefined && data.y !== undefined) {
              cell.set('position', { x: data.x, y: data.y });
            }
          }
        }
        this.graph.stopBatch('resize');
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

    // Initial sync: populate graph from initial data or read existing graph cells
    const hasInitialData =
      Object.keys(initialElements).length > 0 || Object.keys(initialLinks).length > 0;

    if (hasInitialData) {
      this.graphState.updateGraph({
        elements: initialElements,
        links: initialLinks,
        flag: 'updateFromReact',
      });
    } else if (this.graph.getCells().length > 0) {
      // External graph already has cells — re-trigger reset so graphState
      // picks them up and populates publicState/layoutState
      this.graph.resetCells(this.graph.getCells());
    }
  }

  // --- Public API ---

  public destroy = (isGraphExternal: boolean) => {
    for (const paperStore of this.paperStores.values()) {
      paperStore.destroy();
    }
    this.paperStores.clear();
    this.graphState.destroy();
    this.internalState.clean();
    if ('clean' in this.areElementsMeasuredState) {
      (this.areElementsMeasuredState as State<boolean>).clean();
    }
    this.observer.clean();
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
      return { papers: { ...previous.papers, [paperId]: nextPaper } };
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
      return { papers: { ...previous.papers, [paperId]: nextPaper } };
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
      return { papers: { ...previous.papers, [paperId]: nextPaper } };
    });
    return isChanged;
  }

  public markPaperElementViewMounted(paperId: string, cellId: CellId): void {
    const isChanged = this.setPaperElementViewMountedState(paperId, cellId, true);
    if (isChanged) {
      this.graph.trigger(LAYOUT_UPDATE_EVENT);
    }
  }

  public markPaperElementViewUnmounted(paperId: string, cellId: CellId): void {
    const isChanged = this.setPaperElementViewMountedState(paperId, cellId, false);
    if (isChanged) {
      this.graph.trigger(LAYOUT_UPDATE_EVENT);
    }
  }

  public markPaperLinkViewMounted(paperId: string, linkId: CellId): void {
    const isChanged = this.setPaperLinkViewMountedState(paperId, linkId, true);
    if (isChanged) {
      this.graph.trigger(LAYOUT_UPDATE_EVENT);
    }
  }

  public markPaperLinkViewUnmounted(paperId: string, linkId: CellId): void {
    const isChanged = this.setPaperLinkViewMountedState(paperId, linkId, false);
    if (isChanged) {
      this.graph.trigger(LAYOUT_UPDATE_EVENT);
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
      return { papers: newPapers };
    });
  };

  public addPaper = (id: string, paperOptions: AddPaperOptions) => {
    const paperStore = new PaperStore({ ...paperOptions, graphStore: this, id });
    this.paperStores.set(id, paperStore);
    this.internalState.setState((previous) => {
      if (previous.papers[id]) {
        return previous;
      }
      return { papers: { ...previous.papers, [id]: createPaperStoreSnapshot() } };
    });
    return () => this.removePaper(id);
  };

  /**
   * Checks if a node with the given ID is currently being observed for size changes.
   */
  public hasMeasuredNode = (id: CellId) => this.observer.has(id);
  /**
   * Registers a node to be observed for size changes.
   */
  public setMeasuredNode = (options: SetMeasuredNodeOptions) => this.observer.add(options);
  /**
   * Get not-reactive paper snapshot for a given paper ID.
   */
  public getPaperStore = (id: string) => this.paperStores.get(id);

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
    this.graph.trigger(LAYOUT_UPDATE_EVENT);
  };
}
