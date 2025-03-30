import { dia, shapes } from '@joint/core';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { listenToCellChange } from '../utils/cell/listen-to-cell-change';
import { ReactElement } from '../models/react-element';
import { useStore } from './use-store';
import { GraphStoreData } from '../data/graph-store-data';
import { processLink, setCells } from '../utils/cell/set-cells';
import { getLinkTargetAndSourceIds } from '@joint/react/src/utils/cell/get-link-targe-and-source-ids';
import type { GraphElementBase, GraphElements } from '@joint/react/src/types/element-types';
import type { GraphLink, GraphLinks } from '@joint/react';

export const DEFAULT_CELL_NAMESPACE = { ...shapes, ReactElement };

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
  readonly defaultElements?: Array<dia.Element | GraphElementBase>;

  /**
   * Initial links to be added to graph
   * It's loaded just once, so it cannot be used as React state.
   */
  readonly defaultLinks?: Array<dia.Link | GraphLink>;
}

export interface GraphStore {
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
  readonly getElements: () => GraphElements<GraphElementBase>;
  /**
   * Get element by id
   */
  readonly getElement: (id: dia.Cell.ID) => GraphElementBase;
  /**
   *  Get links
   */
  readonly getLinks: () => GraphLinks;
  /**
   * Get link by id
   */
  readonly getLink: (id: dia.Cell.ID) => GraphLink;
}

/**
 * Store for listen to cell changes and updates on the graph elements (nodes) and links (edges).
 * It use `useSyncExternalStore` to avoid memory leaks and cells (state) duplicates.
 *
 * @group Hooks
 * @internal
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
  // Track of element ids with not defined width and height
  // Its used to render links later, when they are defined.
  const unsizedLinks = useRef<Map<dia.Cell.ID, dia.Link | GraphLink>>(new Map());

  // initialize graph instance and save it in the store
  const [graph] = useState(() => {
    const newGraph =
      options.graph ??
      new dia.Graph(
        {},
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        { cellNamespace: { ...DEFAULT_CELL_NAMESPACE, ...cellNamespace }, cellModel }
      );
    newGraph.id = graphId;
    unsizedLinks.current = setCells({
      graph: newGraph,
      defaultElements,
      defaultLinks,
    });
    return newGraph;
  });

  const data = useRef(new GraphStoreData(graph));

  const hasSize = useCallback(
    (id?: dia.Cell.ID) => {
      if (!id) {
        return false;
      }
      const sourceElement = graph.getCell(id) as dia.Element;
      const { width, height } = sourceElement.size();
      return !!(width > 1 && height > 1);
    },
    [graph]
  );

  const update = useCallback(() => {
    data.current.update(graph);

    if (unsizedLinks.current.size === 0) {
      return;
    }

    for (const [id, link] of unsizedLinks.current) {
      const { source, target } = getLinkTargetAndSourceIds(link);
      if (!hasSize(source)) {
        continue;
      }
      if (hasSize(target)) {
        graph.addCell(processLink(link));
        unsizedLinks.current.delete(id);
      }
    }
  }, [graph, hasSize]);

  const store = useStore(update);

  const onCellChange = useCallback(() => {
    if (graph.hasActiveBatch()) {
      return;
    }
    return store.notifySubscribers();
  }, [store, graph]);

  const onBatchStop = useCallback(() => {
    store.notifySubscribers();
  }, [store]);

  // On-load effect
  useEffect(() => {
    const unsubscribe = listenToCellChange(graph, onCellChange);
    graph.on('batch:stop', onBatchStop);
    return () => {
      unsubscribe();
      graph.off('batch:stop', onBatchStop);
    };
  }, [graph, onCellChange, onBatchStop]);

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
        const item = data.current.elements.get(id);
        if (!item) {
          throw new Error(`Element with id ${id} not found`);
        }
        return item;
      },
      getLink(id) {
        const item = data.current.links.get(id);
        if (!item) {
          throw new Error(`Link with id ${id} not found`);
        }
        return item;
      },
    }),
    [graph, store.subscribe]
  );
}
