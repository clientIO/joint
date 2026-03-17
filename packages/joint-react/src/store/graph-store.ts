/* eslint-disable sonarjs/cognitive-complexity */
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
import { PortalElement } from '../models/portal-element';
import { PortalLink } from '../models/portal-link';
import type { ElementToGraphOptions, GraphToElementOptions } from '../state/data-mapping/element-mapper';
import type { LinkToGraphOptions, GraphToLinkOptions } from '../state/data-mapping/link-mapper';
import {
  defaultMapDataToElementAttributes,
  defaultMapDataToLinkAttributes,
  defaultMapElementAttributesToData,
  defaultMapLinkAttributesToData,
} from '../state/data-mapping';
import { clearConnectedLinkViews } from './clear-view';
import { graphState, LAYOUT_UPDATE_EVENT, type GraphState } from '../state/graph-state';
import { getLayout } from './update-layout-state';
import { createState, type ExternalStoreLike, type State } from '../utils/create-state';
import type { IncrementalChange, IncrementalStateChanges } from '../state/incremental.types';
import type { Feature } from '../hooks/use-create-paper-features';

export const DEFAULT_CELL_NAMESPACE: Record<string, unknown> = {
  ...shapes,
  PortalElement,
  PortalLink,
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
export interface ElementLayout {
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
 * Size of a single element.
 */
export interface ElementSize {
  readonly width: number;
  readonly height: number;
}

/**
 * Position of a single element.
 */
export interface ElementPosition {
  readonly x: number;
  readonly y: number;
}

/**
 * Layout snapshot for all elements, split into sizes, positions, and angles.
 * Each record preserves its reference when unrelated properties change —
 * e.g. a position-only change does not create a new `sizes` object.
 */
export interface ElementsLayoutSnapshot {
  readonly sizes: Record<CellId, ElementSize>;
  readonly positions: Record<CellId, ElementPosition>;
  readonly angles: Record<CellId, number>;
  /** Total number of elements in the graph. */
  readonly count: number;
  /** Number of elements whose width and height are both > 1 (considered measured). */
  readonly measuredElements: number;
}

/**
 * Layout snapshot for all links, keyed by paper ID then by link cell ID.
 */
export type LinksLayoutSnapshot = Record<string, Record<CellId, LinkLayout>>;

/**
 * Snapshot containing layout data for all elements and links (per paper).
 */
export interface GraphStoreLayoutSnapshot {
  readonly elements: ElementsLayoutSnapshot;
  readonly links: LinksLayoutSnapshot;
}

/**
 * Full internal snapshot of the graph store.
 */
export interface GraphStoreInternalSnapshot {
  papers: Record<string, PaperStoreSnapshot>;
  resetVersion: number;
}

/**
 * Configuration options for creating a GraphStore instance.
 */
export interface GraphStoreOptions<ElementData = FlatElementData, LinkData = FlatLinkData> {
  readonly mapDataToElementAttributes?: (
    options: ElementToGraphOptions<ElementData>
  ) => dia.Cell.JSON;
  readonly mapDataToLinkAttributes?: (options: LinkToGraphOptions<LinkData>) => dia.Cell.JSON;
  readonly mapElementAttributesToData?: (
    options: GraphToElementOptions<ElementData>
  ) => ElementData;
  readonly mapLinkAttributesToData?: (options: GraphToLinkOptions<LinkData>) => LinkData;
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
  public readonly dataState: ExternalStoreLike<GraphStoreSnapshot>;
  public readonly layoutState: ExternalStoreLike<GraphStoreLayoutSnapshot>;
  public readonly graph: dia.Graph;
  public readonly graphState: GraphState;

  public paperStores = new Map<string, PaperStore>();
  private observer: GraphStoreObserver;

  constructor(public readonly config: GraphStoreOptions) {
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

    this.internalState = createState<GraphStoreInternalSnapshot>({
      newState: () => ({ papers: {}, resetVersion: 0 }),
      name: 'JointJs/Internal',
    });

    this.graphState = graphState({
      graph: this.graph,
      papers: this.paperStores,

      onReset: () => {
        this.internalState.setState((previous) => ({
          ...previous,
          resetVersion: previous.resetVersion + 1,
        }));
      },
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

    this.dataState = this.graphState.dataState;
    this.layoutState = this.graphState.layoutState;

    this.observer = createElementsSizeObserver({
      getPublicSnapshot: () => this.dataState.getSnapshot(),
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
      // External graph already has cells — populate dataState/layoutState
      // directly without calling resetCells(). resetCells() would destroy
      // and recreate all paper element views, breaking any external
      // references to those views (e.g. stencil drag's cloneView).
      const existingElements: Record<string, FlatElementData> = {};
      const existingLinks: Record<string, FlatLinkData> = {};
      for (const cell of this.graph.getCells()) {
        const id = String(cell.id);
        if (cell.isElement()) {
          existingElements[id] = this.graphState.elementToData({
            element: cell,
          }) as FlatElementData;
        } else if (cell.isLink()) {
          existingLinks[id] = this.graphState.linkToData({ link: cell }) as FlatLinkData;
        }
      }
      this.dataState.setState(() => ({
        elements: existingElements,
        links: existingLinks,
      }));
      const layout = getLayout({ graph: this.graph, papers: this.paperStores });
      this.layoutState.setState(() => layout);
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
      return { ...previous, papers: { ...previous.papers, [paperId]: nextPaper } };
    });
  }

  public setPaperFeature(paperId: string, feature: Feature) {
    const paperStore = this.paperStores.get(paperId);
    if (!paperStore) {
      throw new Error(`Paper with id ${paperId} not found`);
    }
    paperStore.features[feature.id] = feature;
    // bump version to trigger re-render of paper content with new feature
    this.updatePaperSnapshot(paperId, (previous) => {
      if (!previous) {
        throw new Error(`Paper snapshot with id ${paperId} not found`);
      }
      return { ...previous, version: previous.version + 1 };
    });
  }

  public removePaperFeature(paperId: string, featureId: string) {
    const paperStore = this.paperStores.get(paperId);
    if (!paperStore) {
      return;
    }

    const feature = paperStore.features[featureId];
    if (!feature) {
      return;
    }
    feature.clean?.();
    Reflect.deleteProperty(paperStore.features, featureId);
    // bump version to trigger re-render of paper content without removed feature
    this.updatePaperSnapshot(paperId, (previous) => {
      if (!previous) {
        throw new Error(`Paper snapshot with id ${paperId} not found`);
      }
      return { ...previous, version: previous.version + 1 };
    });
  }

  public setPaperViews(paperId: string, changes: Map<string, IncrementalChange<dia.Cell>>) {
    this.internalState.setState((previous) => {
      const currentPaper = previous.papers[paperId];
      if (!currentPaper) {
        return previous;
      }

      const basePaper = currentPaper;
      let nextElementViewIds = { ...basePaper.elementViewIds };
      let nextLinkViewIds = { ...basePaper.linkViewIds };
      for (const [cellId, change] of changes) {
        switch (change.type) {
          case 'add':
          case 'change': {
            {
              if (change.data.isElement()) {
                nextElementViewIds[cellId] = true;
              } else {
                nextLinkViewIds[cellId] = true;
              }
            }
            break;
          }
          case 'remove': {
            Reflect.deleteProperty(nextElementViewIds, cellId);
            Reflect.deleteProperty(nextLinkViewIds, cellId);
            break;
          }
          case 'reset': {
            nextElementViewIds = {};
            nextLinkViewIds = {};
            for (const item of change.data) {
              if (item.isElement()) {
                Reflect.deleteProperty(nextElementViewIds, String(item.id));
              } else {
                Reflect.deleteProperty(nextLinkViewIds, String(item.id));
              }
            }
            break;
          }
        }
      }

      const nextPaper: PaperStoreSnapshot = {
        ...basePaper,
        elementViewIds: nextElementViewIds,
        linkViewIds: nextLinkViewIds,
      };
      return { ...previous, papers: { ...previous.papers, [paperId]: nextPaper } };
    });
    this.graph.trigger(LAYOUT_UPDATE_EVENT, { changes });
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
    this.internalState.setState((previous) => {
      if (previous.papers[id]) {
        return previous;
      }
      return { ...previous, papers: { ...previous.papers, [id]: createPaperStoreSnapshot() } };
    });
    return { paperStore, remove: () => this.removePaper(id) };
  };

  public hasMeasuredNode = (id: CellId) => this.observer.has(id);

  public setMeasuredNode = (options: SetMeasuredNodeOptions) => this.observer.add(options);

  public getPaperStore = (id: string) => {
    return this.paperStores.get(id);
  };

  /**
   * This method clears the cached view for a given element and its connected links on the specified paper.
   * It is used to force re-rendering of the element and its links when their layout might have changed.
   * The method accepts an optional `onValidateLink` callback to filter which connected links should be cleared.
   * @param options - An object containing the cellId of the element, an optional onValidateLink callback, and the paper instance.
   * @param options.cellId - The ID of the element whose view should be cleared.
   * @param options.onValidateLink - Optional callback to filter which connected links should be cleared.
   * @param options.paper - The paper instance to clear views from.
   */
  public clearViewForElementAndLinks = (options: {
    readonly cellId: CellId;
    readonly onValidateLink?: (link: dia.Link) => boolean;
    readonly paper: dia.Paper;
  }) => {
    const { cellId, onValidateLink, paper } = options;
    const elementView = paper.findViewByModel(cellId);
    if (!elementView) {
      return;
    }

    elementView.cleanNodesCache();
    const changes = clearConnectedLinkViews(paper, this.graph, cellId, onValidateLink);
    this.graph.trigger(LAYOUT_UPDATE_EVENT, { changes });
  };
}
