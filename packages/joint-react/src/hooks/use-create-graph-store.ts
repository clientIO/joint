import { dia, shapes } from '@joint/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listenToCellChange } from '../utils/cell/listen-to-cell-change';
import { ReactElement } from '../models/react-element';
import type { BaseElement, BaseLink } from '../types/cell.types';
import { isBaseElement, isBaseLink, isReactElement } from '../types/cell.types';

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
  readonly subscribeToLinks: (onStoreChange: () => void) => () => void;
}
const DEFAULT_CELL_NAMESPACE = { ...shapes, ReactElement };

/**
 * Updating of graph cells inside use graph store - helper function
 */
function setGraphCells(options: {
  graph: dia.Graph;
  defaultLinks?: Array<dia.Link | BaseLink>;
  defaultElements?: (dia.Element | BaseElement)[];
}) {
  const { graph, defaultElements, defaultLinks } = options;
  if (defaultLinks !== undefined) {
    graph.addCells(
      defaultLinks.map((link) => {
        if (isBaseLink(link)) {
          return new shapes.standard.Link({
            ...link,
            source: { id: link.source },
            target: { id: link.target },
          });
        }
        return link;
      })
    );
  }
  if (defaultElements !== undefined) {
    graph.addCells(
      defaultElements.map((element) => {
        if (isBaseElement(element)) {
          if (isReactElement(element)) {
            return new ReactElement({
              position: { x: element.x, y: element.y },
              size: { width: element.width, height: element.height },
              ...element,
            });
          }
          return new dia.Cell({
            type: element.type ?? 'react',
            position: { x: element.x, y: element.y },
            size: { width: element.width, height: element.height },
            ...element,
          });
        }
        return element;
      })
    );
  }
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

  // Store subscribers
  const elementSubscribers = useRef(new Set<() => void>());
  const linkSubscribers = useRef(new Set<() => void>());

  // initialize graph instance and save it in the store
  const [graph] = useState(() => {
    const newGraph = options.graph ?? new dia.Graph({}, { cellNamespace, cellModel });
    setGraphCells({
      graph: newGraph,
      defaultElements,
      defaultLinks,
    });
    return newGraph;
  });

  const isScheduled = useRef(false);

  const notifySubscribers = useCallback((subscribers: Set<() => void>) => {
    if (!isScheduled.current) {
      isScheduled.current = true;
      requestAnimationFrame(() => {
        for (const subscriber of subscribers) {
          subscriber();
        }
        isScheduled.current = false;
      });
    }
  }, []);

  const handleCellsChange = useCallback(
    (cell: dia.Cell) => {
      if (graph.hasActiveBatch()) {
        return;
      }
      if (cell.isElement()) {
        return notifySubscribers(elementSubscribers.current);
      }
      if (cell.isLink()) {
        return notifySubscribers(linkSubscribers.current);
      }
    },
    [graph, notifySubscribers]
  );
  const handleOnBatchStop = useCallback(() => {
    notifySubscribers(elementSubscribers.current);
    notifySubscribers(linkSubscribers.current);
  }, [notifySubscribers]);

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
      subscribeToElements: (onStoreChange: () => void) => {
        elementSubscribers.current.add(onStoreChange);
        return () => {
          elementSubscribers.current.delete(onStoreChange);
        };
      },
      subscribeToLinks: (onStoreChange: () => void) => {
        linkSubscribers.current.add(onStoreChange);
        return () => {
          linkSubscribers.current.delete(onStoreChange);
        };
      },
    }),
    [graph]
  );
}
