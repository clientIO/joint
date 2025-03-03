import { dia, shapes } from '@joint/core';
import type { RefObject } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { listenToCellChange } from '../utils/cell/listen-to-cell-change';
import { ReactElement } from '../models/react-element';
import type { BaseElement, BaseLink } from '../types/cell.types';
import { setCells } from '../utils/cell/set-cells';
import { useStore } from './use-store';

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

export interface GraphStore {
  /**
   * The JointJS graph instance.
   */
  readonly graph: dia.Graph;
  /**
   * Subscribes to the store changes.
   */
  readonly subscribeToElements: (onStoreChange: () => void) => () => void;
  /**
   * Subscribes to the store changes.
   * @param onStoreChange
   * @returns
   */
  readonly subscribeToLinks: (onStoreChange: () => void) => () => void;
  /**
   * Map of elements ids to their index in the elements array.
   */
  readonly elementsIdsToIndexMap: RefObject<Map<dia.Cell.ID, number>>;
}
const DEFAULT_CELL_NAMESPACE = { ...shapes, ReactElement };

function getElementIdsIndexes(graph: dia.Graph): Map<dia.Cell.ID, number> {
  const elements = graph.getElements();
  return new Map(elements.map((element, index) => [element.id, index]));
}
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

  const onElementsChange = useCallback(() => {
    elementsIdsToIndexMap.current = getElementIdsIndexes(graph);
  }, [graph]);

  const elementsIdsToIndexMap = useRef(getElementIdsIndexes(graph));

  const elementsStore = useStore(onElementsChange);
  const linksStore = useStore();

  const handleCellsChange = useCallback(
    (cell: dia.Cell) => {
      if (graph.hasActiveBatch()) {
        return;
      }
      if (cell.isElement()) {
        return elementsStore.notifySubscribers();
      }
      if (cell.isLink()) {
        return linksStore.notifySubscribers();
      }
    },
    [elementsStore, graph, linksStore]
  );
  const handleOnBatchStop = useCallback(() => {
    elementsStore.notifySubscribers();
    linksStore.notifySubscribers();
  }, [elementsStore, linksStore]);

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
      subscribeToElements: elementsStore.subscribe,
      subscribeToLinks: linksStore.subscribe,
      elementsIdsToIndexMap,
    }),
    [elementsStore.subscribe, graph, linksStore.subscribe]
  );
}
