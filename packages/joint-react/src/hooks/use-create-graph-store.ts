import { dia, shapes } from '@joint/core';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { listenToCellChange } from '../utils/cell/listen-to-cell-change';
import { ReactElement } from '../models/react-element';
import type { BaseElement, BaseLink } from '../types/cell.types';
import { setCells } from '../utils/cell/set-cells';
import { useStore } from './use-store';
import type { GraphElement, GraphLink } from '../utils/cell/get-cell';
import type { GraphElements, GraphLinks } from '../utils/cell/cell-map';
import { GraphData } from '../utils/cell/cell-map';

interface Options {
  /**
   * Graph instance to use. If not provided, a new graph instance will be created.
   * @see https://docs.jointjs.com/api/dia/Graph
   * @default new dia.Graph({}, { cellNamespace: shapes })
   */
  readonly graph?: dia.Graph;
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
  readonly defaultElements?: (dia.Element | BaseElement)[];

  /**
   * Initial links to be added to graph
   * It's loaded just once, so it cannot be used as React state.
   */
  readonly defaultLinks?: Array<dia.Link | BaseLink>;
}

export interface GraphStore<Data = undefined> {
  /**
   * The JointJS graph instance.
   */
  readonly graph: dia.Graph;
  /**
   * Subscribes to the store changes.
   */
  readonly subscribe: (onStoreChange: () => void) => () => void;
  /**
   * Get elements
   */
  readonly getElements: () => GraphElements<Data>;
  /**
   * Get element by id
   */
  readonly getElement: (id: dia.Cell.ID) => GraphElement<Data>;
  /**
   *  Get links
   */
  readonly getLinks: () => GraphLinks;
  /**
   * Get link by id
   */
  readonly getLink: (id: dia.Cell.ID) => GraphLink;
}

const DEFAULT_CELL_NAMESPACE = { ...shapes, ReactElement };

/**
 * Store for listen to cell changes and updates on the graph elements (nodes) and links (edges).
 * It use `useSyncExternalStore` to avoid memory leaks and cells (state) duplicates.
 *
 * @group Hooks
 *
 * @param options - Options for creating the graph store.
 * @returns The graph store instance.
 */
export function useCreateGraphStore(options: Options): GraphStore {
  const {
    cellNamespace = DEFAULT_CELL_NAMESPACE,
    defaultElements,
    defaultLinks,
    cellModel,
  } = options;

  const graphId = useId();

  // initialize graph instance and save it in the store
  const [graph] = useState(() => {
    const newGraph = options.graph ?? new dia.Graph({}, { cellNamespace, cellModel });
    newGraph.id = graphId;
    setCells({
      graph: newGraph,
      defaultElements,
      defaultLinks,
    });
    return newGraph;
  });

  const data = useRef(new GraphData(graph));

  const update = useCallback(() => {
    data.current.update(graph);
  }, [graph]);

  const store = useStore(update);

  const handleCellsChange = useCallback(() => {
    if (graph.hasActiveBatch()) {
      return;
    }
    return store.notifySubscribers();
  }, [store, graph]);

  const handleOnBatchStop = useCallback(() => {
    store.notifySubscribers();
  }, [store]);

  // On-load effect
  useEffect(() => {
    const unsubscribe = listenToCellChange(graph, handleCellsChange);
    graph.on('batch:stop', handleOnBatchStop);
    return () => {
      unsubscribe();
      graph.off('batch:stop', handleOnBatchStop);
    };
  }, [graph, handleCellsChange, handleOnBatchStop]);

  return useMemo(
    (): GraphStore => ({
      graph,
      subscribe: store.subscribe,
      getElements() {
        return data.current.elements;
      },
      getLinks() {
        return data.current.links;
      },
      getElement(id) {
        return data.current.elements.get(id)!;
      },
      getLink(id) {
        return data.current.links.get(id)!;
      },
    }),
    [graph, store.subscribe]
  );
}
