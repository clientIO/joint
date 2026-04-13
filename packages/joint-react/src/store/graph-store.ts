import { dia, shapes } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { AddPaperOptions } from './paper-store';

import { PaperStore, getDefaultPaperState } from './paper-store';
import {
  createElementsSizeObserver,
  type GraphStoreObserver,
  type SetMeasuredNodeOptions,
} from './create-elements-size-observer';
import { ElementModel } from '../models/element-model';
import { LinkModel } from '../models/link-model';
import { clearConnectedLinkViews } from './clear-view';
import { LAYOUT_UPDATE_EVENT } from './graph-changes';
import { createAtom, type Atom } from './state-container';
import type { IncrementalChange } from '../state/incremental.types';
import type { Feature } from '../types/feature.types';
import { graphView, type GraphView, type IncrementalContainerChanges } from './graph-view';
import type { ElementRecord, LinkRecord } from '../types/data-types';
import { simpleScheduler } from '../utils/scheduler';

export const DEFAULT_CELL_NAMESPACE: Record<string, unknown> = {
  ...shapes,
  ElementModel,
  LinkModel,
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
 * Configuration options for creating a GraphStore instance.
 */
export interface GraphStoreOptions<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
> {
  readonly graph?: dia.Graph;
  readonly cellNamespace?: unknown;
  readonly cellModel?: typeof dia.Cell;
  readonly initialElements?: Record<CellId, ElementRecord<ElementData>>;
  readonly initialLinks?: Record<CellId, LinkRecord<LinkData>>;
  readonly onIncrementalChange?: (
    changes: IncrementalContainerChanges<ElementData, LinkData>
  ) => void;
  readonly onElementsChange?: (elements: Record<string, ElementRecord<ElementData>>) => void;
  readonly onLinksChange?: (links: Record<string, LinkRecord<LinkData>>) => void;
}
/**
 * Central store for managing graph state, synchronization, and paper instances.
 */
export class GraphStore<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
> {
  public readonly internalState: Atom<GraphStoreInternalSnapshot>;
  public readonly measureState: Atom<number> = createAtom(0);
  public readonly graph: dia.Graph;

  public paperStores = new Map<string, PaperStore>();
  public features: Record<string, Feature> = {};
  private observer: GraphStoreObserver;
  public readonly graphView: GraphView<ElementData, LinkData>;

  public getGraphView<
    N extends object = Record<string, unknown>,
    L extends object = Record<string, unknown>,
  >(): GraphView<N, L> {
    return this.graphView as unknown as GraphView<N, L>;
  }

  constructor(public readonly config: GraphStoreOptions<ElementData, LinkData>) {
    const {
      initialElements = {},
      initialLinks = {},
      cellModel,
      cellNamespace = DEFAULT_CELL_NAMESPACE,
      graph,
      onIncrementalChange,
      onElementsChange,
      onLinksChange,
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

    this.internalState = createAtom<GraphStoreInternalSnapshot>({
      papers: {},
      resetVersion: 0,
      graphFeaturesVersion: 1,
    });

    const elementsMeasured = new Set<string>();
    const onElementSizeChange = () => {
      if (elementsMeasured.size > 0) {
        this.measureState.set((previous) => previous + 1);
      }
    };
    this.graphView = graphView<ElementData, LinkData>({
      graph: this.graph,
      onIncrementalChange: this.buildIncrementalChangeHandler(
        onIncrementalChange,
        onElementsChange,
        onLinksChange
      ),
      onElementsSizeChange: (id, size) => {
        // Trigger re-measure of elements on size change
        if (size.width > 0 && size.height > 0) {
          elementsMeasured.add(id);
        } else {
          elementsMeasured.delete(id);
        }
        // we schedule it, so basically we can to it as single operation, that means, we can confidentially could say that
        // 1. measureState > 0 means that we have some measured elements (on-load)
        // 2. measureState changes means changes triggered.
        simpleScheduler(onElementSizeChange);
      },
    });

    this.observer = createElementsSizeObserver({
      getElements: () => this.graphView.elements.getFull() as Map<CellId, ElementRecord>,
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

    // Initial sync: populate graph from initial data or read existing graph cells
    const hasInitialData =
      Object.keys(initialElements).length > 0 || Object.keys(initialLinks).length > 0;

    if (hasInitialData) {
      this.graphView.updateGraph({
        elements: initialElements,
        links: initialLinks,
        flag: 'updateFromReact',
      });
    } else if (this.graph.getCells().length > 0) {
      // External graph already has cells — populate graphView containers
      // directly without calling resetCells(). resetCells() would destroy
      // and recreate all paper element views, breaking any external
      // references to those views (e.g. stencil drag's cloneView).
      this.graphView.syncFromGraph();
    }
  }

  private buildIncrementalChangeHandler(
    onIncrementalChange:
      | ((changes: IncrementalContainerChanges<ElementData, LinkData>) => void)
      | undefined,
    onElementsChange: ((elements: Record<string, ElementRecord<ElementData>>) => void) | undefined,
    onLinksChange: ((links: Record<string, LinkRecord<LinkData>>) => void) | undefined
  ): ((changes: IncrementalContainerChanges<ElementData, LinkData>) => void) | undefined {
    if (!onIncrementalChange && !onElementsChange && !onLinksChange) {
      return undefined;
    }
    return (changes) => {
      onIncrementalChange?.(changes);

      if (onElementsChange) {
        this.notifyElementsChange(changes, onElementsChange);
      }

      if (onLinksChange) {
        this.notifyLinksChange(changes, onLinksChange);
      }
    };
  }

  private notifyElementsChange(
    changes: IncrementalContainerChanges<ElementData, LinkData>,
    onElementsChange: (elements: Record<string, ElementRecord<ElementData>>) => void
  ) {
    const hasElementChanges =
      changes.elements.added.size > 0 ||
      changes.elements.changed.size > 0 ||
      changes.elements.removed.size > 0;

    if (!hasElementChanges) return;

    const elements: Record<string, ElementRecord<ElementData>> = {};
    for (const [id, item] of this.graphView.elements.getFull()) {
      elements[id] = item;
    }

    onElementsChange(elements);
  }

  private notifyLinksChange(
    changes: IncrementalContainerChanges<ElementData, LinkData>,
    onLinksChange: (links: Record<string, LinkRecord<LinkData>>) => void
  ) {
    const hasLinkChanges =
      changes.links.added.size > 0 ||
      changes.links.changed.size > 0 ||
      changes.links.removed.size > 0;

    if (!hasLinkChanges) return;

    const links = Object.fromEntries(
      [...this.graphView.links.getFull()].map(([id, item]) => {
        const { ...linkData } = item;
        return [id, linkData];
      })
    ) as Record<string, LinkRecord<LinkData>>;
    onLinksChange(links);
  }

  // --- Public API ---

  public destroy = (isGraphExternal: boolean) => {
    // Clean graph-level features first
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
    // bump version to trigger re-render of paper content with new feature
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
    // bump version to trigger re-render of paper content without removed feature
    this.bumpPaperVersion(paperId);
  }

  public setPaperViews(paperId: string, changes: Map<string, IncrementalChange<dia.Cell>>) {
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
    const linkChanges = clearConnectedLinkViews(paper, this.graph, cellId, onValidateLink);
    // Queue link changes — afterRender will flush them once JointJS finishes
    // its async render cycle and link views have correct geometry.
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
