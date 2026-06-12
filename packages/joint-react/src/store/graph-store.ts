import { dia, shapes } from '@joint/core';
import type { ElementJSONInit, LinkJSONInit, CellId } from '../types/cell.types';
import type { AddPaperOptions } from './paper-store';

import { PaperStore, getDefaultPaperState } from './paper-store';
import {
  createElementsSizeObserver,
  type GraphStoreObserver,
  type SetMeasuredNodeOptions,
} from './create-elements-size-observer';
import { ELEMENT_MODEL_TYPE, ElementModel } from '../mvc/element-model';
import { LINK_MODEL_TYPE, LinkModel } from '../mvc/link-model';
import { isElementType, isLinkType } from '../utils/cell-type';
import { clearConnectedLinkViews } from './clear-view';
import { LAYOUT_UPDATE_EVENT } from './graph-changes';
import { createAtom, type Atom } from './state-container';
import type { IncrementalChange } from '../state/incremental.types';
import type { Feature } from '../types/feature.types';
import {
  graphProjection,
  type GraphProjection,
  type OnIncrementalCellsChange,
} from './graph-projection';
import { simpleScheduler } from '../utils/scheduler';
import { cellInputToModel } from '../utils/normalize-cell-input';
import type { CellInput } from '../types/cell.types';
import { warnDuplicatePapers } from '../utils/dev-warnings';

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
/**
 * Reference point that stays fixed when an auto-sized element's measured size
 * changes. Mirrors CSS `transform-origin` semantics.
 *
 * - `'top-left'` (default): element grows right/down — top-left stays put.
 * - `'center'`: element grows symmetrically — geometric center stays put.
 *
 * Only affects writes from the `useMeasureElement` pipeline. Manual `cell.resize()`,
 * interactive resize tools, and direct `cell.set('size', ...)` calls are unaffected.
 */
export type AutoSizeOrigin = 'top-left' | 'center';

/**
 * Options for creating a `GraphStore` in controlled mode. Requires the full cells
 */
export interface GraphStoreOptions<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
> {
  readonly graph?: dia.Graph;
  readonly cellNamespace?: unknown;
  readonly cellModel?: typeof dia.Cell;
  /**
   * Reference point that stays fixed when an auto-sized element's measured size
   * changes. See {@link AutoSizeOrigin}.
   * @default 'top-left'
   */
  readonly autoSizeOrigin?: AutoSizeOrigin;
  readonly initialCells?: ReadonlyArray<CellInput<Element, Link>>;
}

/**
 * Central store for managing graph state, synchronization, and paper instances.
 */
export class GraphStore<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
> {
  public readonly graphProjection: GraphProjection<Element, Link>;
  public readonly internalState: Atom<GraphStoreInternalSnapshot>;
  public readonly measureState: Atom<number> = createAtom(0);
  public readonly graph: dia.Graph;
  public readonly autoSizeOrigin: AutoSizeOrigin;
  public paperStores = new Map<string, PaperStore>();
  public features: Record<string, Feature> = {};

  private observer: GraphStoreObserver;
  private onIncrementalCellsChange?: OnIncrementalCellsChange<Element, Link>;

  constructor(public readonly config: GraphStoreOptions<Element, Link>) {
    const {
      cellModel,
      cellNamespace = DEFAULT_CELL_NAMESPACE,
      graph,
      autoSizeOrigin = 'top-left',
      initialCells,
    } = config;
    this.autoSizeOrigin = autoSizeOrigin;

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

    this.graphProjection = graphProjection<Element, Link>({
      graph: this.graph,
      onIncrementalCellsChange: (changes) => {
        this.onIncrementalCellsChange?.(changes);
      },
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
        const map = new Map<CellId, ElementJSONInit>();
        for (const cell of this.graphProjection.cells.getAll()) {
          if (cell.id === undefined) continue;
          if (this.isElement(cell)) {
            map.set(cell.id, cell);
          }
        }
        return map;
      },
      onBatchUpdate: (updatedElements) => {
        this.graph.startBatch('auto-size');
        for (const [id, data] of Object.entries(updatedElements)) {
          const model = this.graph.getCell(id);
          if (!model?.isElement()) continue;
          // `autoSize: true` marks writes that originate from the
          // ResizeObserver pipeline so `change:size` listeners can tell our
          // own writes apart from external ones (controlled-mode sync,
          // direct `cell.resize`, etc.) and avoid feedback loops.
          const attributes: dia.Cell.Attributes = {
            size: { width: data.width, height: data.height },
          };

          if (data.x !== undefined && data.y !== undefined) {
            attributes.position = { x: data.x, y: data.y };
          } else if (this.autoSizeOrigin === 'center') {
            // Center-anchored auto-size: keep the geometric center fixed.
            const center = model.getCenter();
            attributes.position = {
              x: center.x - data.width / 2,
              y: center.y - data.height / 2,
            };
          }

          model.set(attributes, { autoSize: true });
          // Top-left auto-size (default): don't write position — the cell's
          // top-left stays put implicitly and it grows right/down.
        }
        this.graph.stopBatch('auto-size');
      },
      getCellTransform: (id) => {
        const model = this.graph.getCell(id);
        if (!model?.isElement()) throw new Error('Cell not found or not an element: ' + id);
        return {
          model,
          ...model.size(),
          ...model.position().toJSON(),
          angle: model.angle(),
        };
      },
    });

    if (initialCells && initialCells.length > 0) {
      // Replace existing graph state with the seed cells. The graph-changes
      // listener handles `reset` synchronously and populates the cells
      // container — no manual `syncFromGraph` needed.
      const models = initialCells.map((cell) => cellInputToModel(cell, this.graph));
      this.graph.resetCells(models);
    } else if (this.graph.getCells().length > 0) {
      // External graph already has cells — populate the cells container
      // directly without calling resetCells(). resetCells() would destroy
      // and recreate all paper element views, breaking external references
      // (e.g. stencil drag's cloneView).
      this.graphProjection.syncFromGraph();
    }
  }

  public setOnIncrementalCellsChange = (callback: OnIncrementalCellsChange<Element, Link>) => {
    this.onIncrementalCellsChange = callback;
  };

  /**
   * Apply a controlled cells snapshot (called by GraphProvider when the
   * parent-owned `cells` prop changes). Equivalent to `graphProjection.updateGraph`
   * with the react-origin flag set.
   * @param cells - new cells snapshot from the parent
   */
  public applyControlled(cells: ReadonlyArray<Element | Link>) {
    this.graphProjection.updateGraph({ cells, flag: 'updateFromReact' });
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
  public isElement = (cell: Element | Link): cell is Element => {
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
  public isLink = (cell: Element | Link): cell is Link => {
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
    this.graphProjection.destroy();
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
    if (this.features[feature.id] === feature) return;
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
    if (paperStore.features[feature.id] === feature) return;
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
    if (process.env.NODE_ENV !== 'production') {
      warnDuplicatePapers(id, this.paperStores.keys());
    }
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
        if (store.paper == paper) {
          store.addPendingLinkChanges(linkChanges);
          break;
        }
      }
    }
  };
}
