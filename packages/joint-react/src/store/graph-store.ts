import { dia, shapes, util } from '@joint/core';
import type { GraphLink } from '../types/link-types';
import type { GraphElement } from '../types/element-types';
import type { Dispatch, SetStateAction } from 'react';
import type { AddPaperOptions, PaperStoreSnapshot } from './paper-store';
import { PaperStore } from './paper-store';
import {
  createElementsSizeObserver,
  type GraphStoreObserver,
  type SetMeasuredNodeOptions,
} from './create-elements-size-observer';
import { ReactElement } from '../models/react-element';
import type { ExternalStoreLike, State } from '../utils/create-state';
import { createState, derivedState, getValue } from '../utils/create-state';
import { graphSync, type GraphSync } from './graph-sync';
import type { OnChangeOptions } from '../utils/cell/listen-to-cell-change';

export const DEFAULT_CELL_NAMESPACE: Record<string, unknown> = { ...shapes, ReactElement };

export type ExternalGraphStore<
  Element extends GraphElement,
  Link extends GraphLink,
> = ExternalStoreLike<GraphStorePublicSnapshot<Element, Link>>;

export type GraphState = State<GraphStoreSnapshot>;

export interface GraphStorePublicSnapshot<Element extends GraphElement, Link extends GraphLink> {
  readonly elements: Element[];
  readonly links: Link[];
}

export interface GraphStoreIdsSnapshot {
  readonly elementIds: Record<dia.Cell.ID, number>;
  readonly linkIds: Record<dia.Cell.ID, number>;
}

// full internal snapshot (what your state actually stores)
export interface GraphStoreSnapshot {
  readonly papers: Record<string, PaperStoreSnapshot>;
}

export interface GraphStoreOptions<
  Graph extends dia.Graph,
  Element extends GraphElement,
  Link extends GraphLink,
> {
  /**
   * Graph instance to use. If not provided, a new graph instance will be created.
   * @see https://docs.jointjs.com/api/dia/Graph
   * @default new dia.Graph({}, { cellNamespace: shapes })
   */
  readonly graph?: Graph;
  /**
   * Namespace for cell models.
   * @default shapes
   * @see https://docs.jointjs.com/api/shapes
   */
  readonly cellNamespace?: unknown;
  /**
   * Custom cell model to use.
   * @see https://docs.jointjs.com/api/dia/Cell
   */
  readonly cellModel?: typeof dia.Cell;
  /**
   * Initial elements to be added to graph
   * It's loaded just once, so it cannot be used as React state.
   */
  readonly elements?: Element[];

  /**
   * Initial links to be added to graph
   * It's loaded just once, so it cannot be used as React state.
   */
  readonly links?: Link[];

  readonly externalState?: ExternalGraphStore<Element, Link>;
}

export class GraphStore<
  Graph extends dia.Graph = dia.Graph,
  Element extends GraphElement = GraphElement,
  Link extends GraphLink = GraphLink,
> {
  /**
   * @internal
   */
  public readonly internalState: State<GraphStoreSnapshot>;
  /**
   * @internal
   */
  // public readonly publicState: State<GraphStorePublicSnapshot<Element, Link>>;
  public publicState: ExternalStoreLike<GraphStorePublicSnapshot<Element, Link>>;
  /**
   * @internal
   */
  public readonly idsStore: State<GraphStoreIdsSnapshot>;

  public readonly graph: Graph;

  private unsubscribeFromExternal?: () => void;

  private onElementsChange?: Dispatch<SetStateAction<Element[]>>;
  private onLinksChange?: Dispatch<SetStateAction<Link[]>>;

  private papers = new Map<string, PaperStore>();
  private observer: GraphStoreObserver;
  private graphSync: GraphSync;
  private isControlled: boolean;

  constructor(config: GraphStoreOptions<Graph, Element, Link>) {
    const {
      elements = [],
      links = [],
      cellModel,
      cellNamespace = DEFAULT_CELL_NAMESPACE,
      graph,
      externalState,
    } = config;

    const hasExternalState = typeof externalState === 'object';
    this.isControlled = hasExternalState;

    this.graph =
      graph ??
      (new dia.Graph(
        {},
        {
          cellNamespace: {
            ...DEFAULT_CELL_NAMESPACE,
            // @ts-expect-error Shapes is not a valid type for cellNamespace
            ...cellNamespace,
          },
          cellModel,
        }
      ) as Graph);

    if (externalState) {
      this.publicState = externalState;
    } else {
      this.publicState = createState<GraphStorePublicSnapshot<Element, Link>>({
        name: 'JointJs/Cells',
        newState: () => ({
          elements: [],
          links: [],
        }),
        isEqual: util.isEqual,
      });
    }
    this.internalState = createState<GraphStoreSnapshot>({
      name: 'Jointjs/Internal',
      newState: () => ({
        papers: {},
      }),
      isEqual: util.isEqual,
    });

    this.idsStore = derivedState({
      name: 'Jointjs/Ids',
      state: this.publicState,
      selector: (snapshot) => {
        const elementIds: Record<dia.Cell.ID, number> = {};
        const linkIds: Record<dia.Cell.ID, number> = {};
        for (const [index, element] of snapshot.elements.entries()) {
          elementIds[element.id] = index;
        }
        for (const [index, link] of snapshot.links.entries()) {
          linkIds[link.id] = index;
        }
        return { elementIds, linkIds };
      },
      isEqual: util.isEqual,
    });

    this.graphSync = graphSync({
      graph: this.graph,
      store: {
        getSnapshot: this.publicState.getSnapshot,
        subscribe: this.publicState.subscribe,
        setState: (updater) => {
          this.publicState.setState((previous) => ({
            ...previous,
            ...getValue(previous, updater),
          }));
        },
      },
    });

    // Observer for element sizes (uses state.getSnapshot)

    this.observer = createElementsSizeObserver({
      getIdsSnapshot: this.idsStore.getSnapshot,
      getPublicSnapshot: this.publicState.getSnapshot,
      onBatchUpdate: (newElements) => {
        this.publicState.setState((previous) => ({
          ...previous,
          elements: newElements,
        }));
      },
      getCellSize: (id) => {
        const cell = this.graph.getCell(id);
        if (!cell?.isElement()) throw new Error('Cell not valid');
        const size = cell.get('size');
        if (!size) throw new Error('Size not found');
        return {
          width: size.width,
          height: size.height,
        };
      },
    });

    // Initial sync: either from external store or from constructor elements/links
    this.publicState.setState((previous) => ({
      ...previous,
      elements,
      links,
    }));
  }

  public destroy = (isGraphExternal: boolean) => {
    this.internalState.clean();
    this.observer.clean();
    this.unsubscribeFromExternal?.();
    this.graphSync.cleanup();
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

      if (currentPaper === nextPaper) {
        return previous;
      }

      return {
        ...previous,
        papers: {
          ...previous.papers,
          [paperId]: nextPaper,
        },
      };
    });
  }

  public updatePaperElementView(paperId: string, cellId: dia.Cell.ID, view: dia.ElementView) {
    // silent update of the data.
    this.updatePaperSnapshot(paperId, (current) => {
      const base = current ?? { paperElementViews: {}, portsData: {} };

      const existingView = base.paperElementViews?.[cellId];
      if (existingView === view) return base;

      return {
        paperElementViews: {
          ...base.paperElementViews,
          [cellId]: view,
        },
      };
    });
  }

  private removePaper = (id: string) => {
    this.papers.delete(id);
    this.internalState.setState((previous) => {
      const newPapers: Record<string, PaperStoreSnapshot> = {};
      for (const [key, value] of Object.entries(previous.papers)) {
        if (key !== id) {
          newPapers[key] = value;
        }
      }
      return {
        ...previous,
        papers: newPapers,
      };
    });
  };
  public addPaper = (id: string, paperOptions: AddPaperOptions<Graph, Element, Link>) => {
    const paperStore = new PaperStore<Graph, Element, Link>({
      ...paperOptions,
      graphStore: this,
      id,
    });
    this.papers.set(id, paperStore);
    return () => {
      paperStore.cleanup();
      this.removePaper(id);
    };
  };

  public hasMeasuredNode = (id: dia.Cell.ID) => {
    return this.observer.has(id);
  };

  public setMeasuredNode = (options: SetMeasuredNodeOptions) => {
    return this.observer.add(options);
  };

  public getPaperStore = (id: string) => {
    return this.papers.get(id);
  };

  public subscribeToCellChange = (callback: (change: OnChangeOptions) => () => void) => {
    return this.graphSync.subscribeToCellChange(callback);
  };

  public updateExternalStore = (
    newStore: ExternalStoreLike<GraphStorePublicSnapshot<Element, Link>>
  ) => {
    this.publicState = newStore;
  };
}
