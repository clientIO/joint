import { dia, shapes } from '@joint/core';
import type {
  BaseElementRecord,
  BaseLinkRecord,
  CellId,
} from '../types/cell.types';
import type { AddPaperOptions } from './paper-store';

import { PaperStore, getDefaultPaperState } from './paper-store';
import {
  createElementsSizeObserver,
  type GraphStoreObserver,
  type SetMeasuredNodeOptions,
} from './create-elements-size-observer';
import { ELEMENT_MODEL_TYPE, ElementModel } from '../models/element-model';
import { LINK_MODEL_TYPE, LinkModel } from '../models/link-model';
import { isElementType, isLinkType } from '../utils/cell-type';
import { clearConnectedLinkViews } from './clear-view';
import { LAYOUT_UPDATE_EVENT } from './graph-changes';
import { createAtom, type Atom } from './state-container';
import type { IncrementalChange } from '../state/incremental.types';
import type { Feature } from '../types/feature.types';
import { graphView, type GraphView, type IncrementalCellsChange } from './graph-view';
import type { ElementRecord } from '../types/cell.types';
import { mapCellToAttributes } from '../state/data-mapping';
import { simpleScheduler } from '../utils/scheduler';

export const DEFAULT_CELL_NAMESPACE: Record<string, unknown> = {
  ...shapes,
  [ELEMENT_MODEL_TYPE]: ElementModel,
  [LINK_MODEL_TYPE]: LinkModel,
};

/**
 * Paper snapshot is a simple version counter.
 * Incremented on every view mount/unmount change to trigger React re-renders.
 */
export interface PaperStoreState {
  readonly version: number;
  readonly featuresState?: Record<string, unknown>;
}

/**
 * Full internal snapshot of the graph store.
 */
export interface GraphStoreInternalSnapshot {
  readonly papers: Record<string, PaperStoreState>;
  readonly resetVersion: number;
  readonly graphFeaturesVersion: number;
}

/**
 * Options common to all `GraphStore` constructor variants.
 *
 * The controlled / uncontrolled split is modelled with a discriminated union
 * to rule out the nonsensical combination of `cells` and `initialCells`
 * being passed together.
 */
interface GraphStoreOptionsBase<
  Element extends BaseElementRecord = BaseElementRecord,
  Link extends BaseLinkRecord = BaseLinkRecord,
> {
  readonly graph?: dia.Graph;
  readonly cellNamespace?: unknown;
  readonly cellModel?: typeof dia.Cell;
  readonly onIncrementalCellsChange?: (changes: IncrementalCellsChange<Element, Link>) => void;
}

/** Uncontrolled mode: parent provides only seed data. */
interface GraphStoreOptionsUncontrolled<
  Element extends BaseElementRecord,
  Link extends BaseLinkRecord,
> extends GraphStoreOptionsBase<Element, Link> {
  readonly initialCells?: ReadonlyArray<Element | Link>;
  readonly cells?: never;
  readonly onCellsChange?: (cells: ReadonlyArray<Element | Link>) => void;
}

/** Controlled mode: parent is the source of truth; store applies snapshots. */
interface GraphStoreOptionsControlled<
  Element extends BaseElementRecord,
  Link extends BaseLinkRecord,
> extends GraphStoreOptionsBase<Element, Link> {
  readonly cells: ReadonlyArray<Element | Link>;
  readonly initialCells?: never;
  readonly onCellsChange?: (cells: ReadonlyArray<Element | Link>) => void;
}

export type GraphStoreOptions<
  Element extends BaseElementRecord = BaseElementRecord,
  Link extends BaseLinkRecord = BaseLinkRecord,
> =
  | GraphStoreOptionsUncontrolled<Element, Link>
  | GraphStoreOptionsControlled<Element, Link>;

/**
 * Central store for managing graph state, synchronization, and paper instances.
 */
export class GraphStore<
  Element extends BaseElementRecord = BaseElementRecord,
  Link extends BaseLinkRecord = BaseLinkRecord,
> {
  public readonly internalState: Atom<GraphStoreInternalSnapshot>;
  public readonly measureState: Atom<number> = createAtom(0);
  public readonly graph: dia.Graph;

  public paperStores = new Map<string, PaperStore>();
  public features: Record<string, Feature> = {};
  private observer: GraphStoreObserver;
  public readonly graphView: GraphView<Element, Link>;

  public getGraphView<
    E extends BaseElementRecord = BaseElementRecord,
    L extends BaseLinkRecord = BaseLinkRecord,
  >(): GraphView<E, L> {
    return this.graphView as unknown as GraphView<E, L>;
  }

  constructor(public readonly config: GraphStoreOptions<Element, Link>) {
    const {
      cellModel,
      cellNamespace = DEFAULT_CELL_NAMESPACE,
      graph,
      onCellsChange,
      onIncrementalCellsChange,
    } = config;
    const controlledCells = 'cells' in config ? config.cells : undefined;
    const initialCells = 'initialCells' in config ? config.initialCells : undefined;

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

    this.internalState = createAtom<GraphStoreInternalSnapshot>({
      papers: {},
      resetVersion: 0,
      graphFeaturesVersion: 1,
    });

    const elementsMeasured = new Set<CellId>();
    const onElementSizeChange = () => {
      if (elementsMeasured.size > 0) {
        this.measureState.set((previous) => previous + 1);
      }
    };
    this.graphView = graphView<Element, Link>({
      graph: this.graph,
      onIncrementalChange: this.buildIncrementalChangeHandler(
        onIncrementalCellsChange,
        onCellsChange
      ),
      onElementsSizeChange: (id, size) => {
        if (size.width > 0 && size.height > 0) {
          elementsMeasured.add(id);
        } else {
          elementsMeasured.delete(id);
        }
        simpleScheduler(onElementSizeChange);
      },
    });

    this.observer = createElementsSizeObserver({
      getElements: () => {
        // The observer only cares about element-typed cells. Build a Map on
        // demand from the unified cells container — cold path, called only
        // when the ResizeObserver fires.
        const map = new Map<CellId, ElementRecord>();
        for (const cell of this.graphView.cells.getAll()) {
          if (cell.id === undefined) continue;
          if (this.isElement(cell)) {
            map.set(cell.id, cell as unknown as ElementRecord);
          }
        }
        return map as unknown as Map<string, ElementRecord>;
      },
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
        const size = cell.size();
        const position = cell.get('position');
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
    const seedCells = controlledCells ?? initialCells;
    if (seedCells && seedCells.length > 0) {
      // Replace existing graph state with the seed cells. resetCells() is
      // called directly (not through graphView.updateGraph) so the seed
      // is treated as authoritative initial state rather than a React-side
      // diff. syncFromGraph then populates the cells container from the
      // resulting JointJS graph.
      const mapped = seedCells.map((cell) => mapCellToAttributes(cell, this.graph));
      this.graph.resetCells(mapped);
      this.graphView.syncFromGraph();
    } else if (this.graph.getCells().length > 0) {
      // External graph already has cells — populate the cells container
      // directly without calling resetCells(). resetCells() would destroy
      // and recreate all paper element views, breaking external references
      // (e.g. stencil drag's cloneView).
      this.graphView.syncFromGraph();
    }
  }

  /**
   * Build the incremental-change relay that fans out store-level callbacks.
   * Calling `onIncrementalCellsChange` with the raw `{added, changed, removed}`
   * summary, and `onCellsChange` with the full cells-array snapshot.
   * @param onIncrementalCellsChange - user callback for the summary
   * @param onCellsChange - user callback for the full-array snapshot
   * @returns combined handler, or undefined when both are absent (avoids allocation)
   */
  private buildIncrementalChangeHandler(
    onIncrementalCellsChange:
      | ((changes: IncrementalCellsChange<Element, Link>) => void)
      | undefined,
    onCellsChange:
      | ((cells: ReadonlyArray<Element | Link>) => void)
      | undefined
  ): ((changes: IncrementalCellsChange<Element, Link>) => void) | undefined {
    if (!onIncrementalCellsChange && !onCellsChange) {
      return undefined;
    }
    return (changes) => {
      onIncrementalCellsChange?.(changes);
      if (onCellsChange) {
        onCellsChange(
          this.graphView.cells.getAll() as ReadonlyArray<Element | Link>
        );
      }
    };
  }

  /**
   * Apply a controlled cells snapshot (called by GraphProvider when the
   * parent-owned `cells` prop changes). Equivalent to `graphView.updateGraph`
   * with the react-origin flag set.
   * @param cells - new cells snapshot from the parent
   */
  public applyControlled(cells: ReadonlyArray<Element | Link>) {
    this.graphView.updateGraph({ cells, flag: 'updateFromReact' });
  }

  /**
   * Type guard: does the input resolve to an element cell?
   *
   * Accepts a cell record, an existing cell id, or a bare type name. Falls
   * back to `graph.getTypeConstructor(type).prototype.isElement()` when the
   * type is not our default `ElementModel`, so any `dia.Element` subclass
   * registered in the cell namespace (`standard.Rectangle`, custom shapes,
   * etc.) is correctly recognised.
   * @param cell - cell record, cell id, or type name
   * @returns `true` when the resolved type extends `dia.Element`
   */
  public isElement = (cell: Element | Link): boolean => {
    const cellType = (cell as { readonly type?: string }).type;
    return cellType !== undefined && isElementType(cellType, this.graph);
  };

  /**
   * Type guard: does the input resolve to a link cell?
   *
   * Accepts a cell record, an existing cell id, or a bare type name. Falls
   * back to `graph.getTypeConstructor(type).prototype.isLink()` when the type
   * is not our default `LinkModel`, so any `dia.Link` subclass registered in
   * the cell namespace is correctly recognised.
   * @param cell - cell record, cell id, or type name
   * @returns `true` when the resolved type extends `dia.Link`
   */
  public isLink = (cell: Element | Link): boolean => {
    const cellType = (cell as { readonly type?: string }).type;
    return cellType !== undefined && isLinkType(cellType, this.graph);
  };

  // --- Public API ---

  public destroy = (isGraphExternal: boolean) => {
    for (const feature of Object.values(this.features)) {
      feature.clean?.();
    }
    this.features = {};

    for (const paperStore of this.paperStores.values()) {
      paperStore.destroy();
    }
    this.paperStores.clear();
    this.graphView.destroy();
    this.internalState.clean();
    this.observer.clean();
    if (!isGraphExternal) {
      this.graph.clear();
    }
  };

  public updatePaperSnapshot(
    paperId: string,
    updater: (previous: PaperStoreState) => PaperStoreState
  ) {
    this.internalState.setState((previous) => {
      const currentPaper = previous.papers[paperId];
      const nextPaper = updater(currentPaper);
      if (currentPaper === nextPaper) return previous;
      return { ...previous, papers: { ...previous.papers, [paperId]: nextPaper } };
    });
  }

  private bumpPaperVersion(paperId: string) {
    this.updatePaperSnapshot(paperId, (previous) => {
      const nextVersion = (previous?.version ?? 0) + 1;
      return { ...previous, version: nextVersion };
    });
  }

  private bumpGraphFeaturesVersion() {
    this.internalState.setState((previous) => ({
      ...previous,
      graphFeaturesVersion: (previous.graphFeaturesVersion ?? 0) + 1,
    }));
  }

  public setGraphFeature(feature: Feature) {
    this.features[feature.id] = feature;
    this.bumpGraphFeaturesVersion();
  }

  public removeGraphFeature(featureId: string) {
    const feature = this.features[featureId];
    if (!feature) return;
    feature.clean?.();
    Reflect.deleteProperty(this.features, featureId);
    this.bumpGraphFeaturesVersion();
  }

  public setPaperFeature(paperId: string, feature: Feature) {
    const paperStore = this.paperStores.get(paperId);
    if (!paperStore) {
      throw new Error(`Paper with id ${paperId} not found`);
    }
    paperStore.features[feature.id] = feature;
    this.bumpPaperVersion(paperId);
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
    this.bumpPaperVersion(paperId);
  }

  public setPaperViews(paperId: string, changes: Map<CellId, IncrementalChange<dia.Cell>>) {
    this.bumpPaperVersion(paperId);
    this.graph.trigger(LAYOUT_UPDATE_EVENT, { changes });
  }

  private removePaper = (id: string) => {
    const paperStore = this.paperStores.get(id);
    paperStore?.destroy();
    this.paperStores.delete(id);
    this.internalState.setState((previous) => {
      const newPapers: Record<string, PaperStoreState> = {};
      for (const [key, value] of Object.entries(previous.papers)) {
        if (key !== id) newPapers[key] = value;
      }
      return { ...previous, papers: newPapers };
    });
  };

  public addPaper = (id: string, paperOptions: AddPaperOptions) => {
    const paperStore = new PaperStore({ ...paperOptions, graphStore: this, id });
    this.paperStores.set(id, paperStore);
    this.updatePaperSnapshot(id, () => getDefaultPaperState());
    return { paperStore, remove: () => this.removePaper(id) };
  };

  public setMeasuredNode = (options: SetMeasuredNodeOptions) => this.observer.add(options);
  public getPaperStore = (id: string) => {
    return this.paperStores.get(id);
  };

  /**
   * Clear the cached view for an element and its connected links on a paper.
   * Forces re-rendering after layout might have changed.
   * @param options - element id, optional link filter, target paper
   * @param options.cellId - id of the element whose view to clear
   * @param options.onValidateLink - optional filter for which connected links to clear
   * @param options.paper - target paper instance
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
    const linkChanges = clearConnectedLinkViews(paper, this.graph, String(cellId), onValidateLink);
    if (linkChanges?.size) {
      for (const [, store] of this.paperStores) {
        if (store.paper === paper) {
          store.addPendingLinkChanges(linkChanges);
          break;
        }
      }
    }
  };
}
