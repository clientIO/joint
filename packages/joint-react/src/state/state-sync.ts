/* eslint-disable sonarjs/cognitive-complexity */
import type { GraphStoreDerivedSnapshot, GraphStoreSnapshot } from '../store/graph-store';
import { listenToCellChange, type OnChangeOptions } from '../utils/cell/listen-to-cell-change';
import { removeDeepReadOnly, type ExternalStoreLike } from '../utils/create-state';
import { util, type dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
import type { GraphStateSelectors } from './graph-state-selectors';
import {
  defaultElementToGraphSelector,
  defaultElementFromGraphSelector,
  defaultLinkToGraphSelector,
  defaultLinkFromGraphSelector,
} from './graph-state-selectors';

/**
 * Configuration options for state synchronization.
 * @template Graph - The type of JointJS graph instance
 * @template Element - The type of elements in the graph
 * @template Link - The type of links in the graph
 */
interface Options<Graph extends dia.Graph, Element extends GraphElement, Link extends GraphLink>
  extends GraphStateSelectors<Element, Link> {
  /** The JointJS graph instance to synchronize */
  readonly graph: Graph;
  /** The external store containing elements and links to sync with */
  readonly store: ExternalStoreLike<GraphStoreSnapshot<Element, Link>>;
  readonly getIdsSnapshot: () => GraphStoreDerivedSnapshot;
  /**
   * If true, batch updates are disabled and synchronization will be real-time.
   * If false (default), batch updates are enabled for better performance.
   * @default false
   */
  readonly areBatchUpdatesDisabled?: boolean;
}
const BATCH_START_EVENT_NAME = 'batch:start';
const BATCH_STOP_EVENT_NAME = 'batch:stop';

/**
 * Configuration options for updating a JointJS graph.
 * @template Graph - The type of JointJS graph instance
 * @template Element - The type of elements in the graph
 * @template Link - The type of links in the graph
 */
export interface UpdateGraphOptions<
  Graph extends dia.Graph,
  Element extends GraphElement,
  Link extends GraphLink,
> {
  /** The JointJS graph instance to update */
  readonly graph: Graph;
  /** The elements to sync to the graph */
  readonly elements: readonly Element[];
  /** The links to sync to the graph */
  readonly links: readonly Link[];
  /** Selector to convert graph elements to Element format for comparison */
  readonly elementFromGraphSelector: (options: {
    readonly cell: dia.Element;
    readonly graph: Graph;
  }) => Element;
  /** Selector to convert graph links to Link format for comparison */
  readonly linkFromGraphSelector: (options: {
    readonly cell: dia.Link;
    readonly graph: Graph;
  }) => Link;
  /** Selector to convert Element to JointJS Cell JSON format */
  readonly elementToGraphSelector: (options: {
    readonly element: Element;
    readonly graph: Graph;
  }) => dia.Cell.JSON;
  /** Selector to convert Link to JointJS Cell JSON format */
  readonly linkToGraphSelector: (options: {
    readonly link: Link;
    readonly graph: Graph;
  }) => dia.Cell.JSON;
}

/**
 * Updates a JointJS graph with the provided elements and links.
 * Compares the current graph state with the provided state and only syncs if they differ.
 * @template Graph - The type of JointJS graph instance
 * @template Element - The type of elements in the graph
 * @template Link - The type of links in the graph
 * @param options - Configuration options for updating the graph
 * @returns true if the graph was synced, false if it was already in sync or skipped due to active batch
 */
export function updateGraph<
  Graph extends dia.Graph,
  Element extends GraphElement,
  Link extends GraphLink,
>(options: UpdateGraphOptions<Graph, Element, Link>): boolean {
  const {
    graph,
    elements,
    links,
    elementFromGraphSelector,
    linkFromGraphSelector,
    elementToGraphSelector,
    linkToGraphSelector,
  } = options;

  if (graph.hasActiveBatch()) {
    return false;
  }

  // Compare current graph state with provided state to avoid unnecessary syncs
  // This prevents syncing when graph and provided state are already in sync
  const graphElements = graph.getElements().map((element) =>
    elementFromGraphSelector({
      cell: element,
      graph,
    })
  );
  const graphLinks = graph.getLinks().map((link) =>
    linkFromGraphSelector({
      cell: link,
      graph,
    })
  );

  // Check if graph is already in sync with provided state
  if (util.isEqual(elements, graphElements) && util.isEqual(links, graphLinks)) {
    return false;
  }

  // Build items array using selectors
  const elementItems = elements.map((element) =>
    elementToGraphSelector({
      element: element as Element,
      graph,
    })
  );
  const linkItems = links.map((link) =>
    linkToGraphSelector({
      link: link as Link,
      graph,
    })
  );

  graph.syncCells([...elementItems, ...linkItems], { remove: true });
  return true;
}

/**
 * Creates a bidirectional synchronization system between a JointJS graph and an external store.
 *
 * This function handles:
 * - Syncing changes from the graph to the store (when users interact with the graph)
 * - Syncing changes from the store to the graph (when React state updates)
 * - Preventing circular update loops using flags and batch tracking
 * - Handling incremental updates efficiently
 * - Supporting batch operations for performance
 *
 * The synchronization uses several mechanisms to prevent infinite loops:
 * - `isSyncingFromState`: Prevents syncing graph changes back when we're syncing from state
 * - `isUpdatingStateFromGraph`: Prevents syncing state changes to graph when we're updating from graph
 * - Batch tracking: Groups multiple changes together to avoid intermediate syncs
 * @template Graph - The type of JointJS graph instance
 * @template Element - The type of elements in the graph
 * @template Link - The type of links in the graph
 * @param options - Configuration options for state synchronization
 * @returns StateSync instance with subscription and cleanup methods
 */
export function stateSync<
  Graph extends dia.Graph,
  Element extends GraphElement,
  Link extends GraphLink,
>(options: Options<Graph, Element, Link>): StateSync {
  const {
    graph,
    store,
    areBatchUpdatesDisabled = false,
    getIdsSnapshot,
    elementFromGraphSelector = defaultElementFromGraphSelector,
    linkFromGraphSelector = defaultLinkFromGraphSelector,
    elementToGraphSelector = defaultElementToGraphSelector,
    linkToGraphSelector = defaultLinkToGraphSelector,
  } = options;

  // We need to ensure several things:
  // 1. Graph can update itself, via onCellChange or via onBatchStop - this change is internal and must update the external store - but only if the external store do not trigger the same change.
  // 2. External store can update the graph via new elements or links - this change is external and must update the internal graph
  // But issue in the 2. is that the change of graph will re-run internal updates, so it will trigger onCellChange or onBatchStop.

  const changedCellIds = new Set<string>();
  let hasReset = false;
  let isSyncingFromState = false;
  let syncFromStateCounter = 0;
  let isUpdatingStateFromGraph = false;
  let updatingStateFromGraphCounter = 0;
  let batchCounter = 0;

  const onIncrementalChange = () => {
    // Skip syncing back to React if we're currently syncing from React
    // This prevents circular updates: React → Graph → React
    if (isSyncingFromState) {
      return;
    }

    // Check if there are any changes to process
    if (!hasReset && changedCellIds.size === 0) return;

    // Capture current state of changes
    const isReset = hasReset;
    const ids = [...changedCellIds];

    // Clear for next batch
    hasReset = false;
    changedCellIds.clear();

    if (isReset) {
      // unfortunately this will create always new object references, so we need to compare them with more deeply
      const graphElements = graph.getElements().map((element) =>
        elementFromGraphSelector({
          cell: element,
          graph,
        })
      );
      const graphLinks = graph.getLinks().map((link) =>
        linkFromGraphSelector({
          cell: link,
          graph,
        })
      );
      const snapshot = store.getSnapshot();
      const elements = removeDeepReadOnly(snapshot.elements);
      const links = removeDeepReadOnly(snapshot.links);

      const isEqual = util.isEqual(elements, graphElements) && util.isEqual(links, graphLinks);
      if (isEqual) return;

      return;
    }
    if (!store.setState) {
      throw new Error('Store does not have setState method');
    }
    // Incremental update
    // Set flag to prevent this state update from triggering another graph sync
    updatingStateFromGraphCounter++;
    isUpdatingStateFromGraph = true;

    // Get IDs snapshot for O(1) lookups
    const idsSnapshot = getIdsSnapshot();

    store.setState((previous: GraphStoreSnapshot<Element, Link>) => {
      const updates = new Map<string, { type: 'link' | 'element'; data: Element | Link }>();
      const removals = new Set<string>();

      for (const id of ids) {
        const cell = graph.getCell(id);
        if (cell) {
          if (cell.isLink()) {
            // Get previous link using O(1) lookup
            const linkIndex = idsSnapshot.linkIds[id];
            const previousLink =
              linkIndex != null && linkIndex >= 0 && linkIndex < previous.links.length
                ? previous.links[linkIndex]
                : undefined;

            const updatedLink = linkFromGraphSelector({
              cell: cell as dia.Link,
              graph,
              previous: previousLink,
            });
            updates.set(id, { type: 'link', data: updatedLink as Link });
          } else {
            // Get previous element using O(1) lookup
            const elementIndex = idsSnapshot.elementIds[id];
            const previousElement =
              elementIndex != null && elementIndex >= 0 && elementIndex < previous.elements.length
                ? previous.elements[elementIndex]
                : undefined;

            const updatedElement = elementFromGraphSelector({
              cell: cell as dia.Element,
              graph,
              previous: previousElement,
            });
            updates.set(id, { type: 'element', data: updatedElement as Element });
          }
        } else {
          removals.add(id);
        }
      }

      // Elements
      const nextElements: Element[] = [];
      let elementsChanged = false;

      for (const cellElement of previous.elements) {
        const id = cellElement.id.toString();
        if (removals.has(id)) {
          elementsChanged = true;
          continue;
        }
        if (updates.has(id)) {
          const update = updates.get(id);
          if (update && update.type === 'element') {
            if (util.isEqual(cellElement, update.data)) {
              nextElements.push(cellElement);
            } else {
              nextElements.push(update.data as Element);
              elementsChanged = true;
            }
            updates.delete(id);
          } else {
            nextElements.push(cellElement);
          }
        } else {
          nextElements.push(cellElement);
        }
      }

      // Add new elements
      for (const [id, update] of updates) {
        if (update.type === 'element') {
          nextElements.push(update.data as Element);
          elementsChanged = true;
          updates.delete(id);
        }
      }

      // Links
      const nextLinks: Link[] = [];
      let linksChanged = false;

      for (const link of previous.links) {
        const id = link.id.toString();
        if (removals.has(id)) {
          linksChanged = true;
          continue;
        }
        if (updates.has(id)) {
          const update = updates.get(id);
          if (update && update.type === 'link') {
            if (util.isEqual(link, update.data)) {
              nextLinks.push(link);
            } else {
              nextLinks.push(update.data as Link);
              linksChanged = true;
            }
            updates.delete(id);
          } else {
            nextLinks.push(link);
          }
        } else {
          nextLinks.push(link);
        }
      }

      // Add new links
      for (const [, update] of updates) {
        if (update.type === 'link') {
          nextLinks.push(update.data as Link);
          linksChanged = true;
        }
      }

      if (!elementsChanged && !linksChanged) return previous;

      const newElements = elementsChanged ? nextElements : previous.elements;
      const newLinks = linksChanged ? nextLinks : previous.links;
      return {
        ...previous,
        elements: newElements as Element[],
        links: newLinks as Link[],
      };
    });
    // Reset the flag after setState completes
    // The subscription callback runs synchronously within setState (via ReactDOM.unstable_batchedUpdates),
    // so we can reset the flag immediately after setState returns
    // If there's a batch, onBatchStop will also handle resetting it as a safety measure
    updatingStateFromGraphCounter--;
    if (updatingStateFromGraphCounter === 0) {
      isUpdatingStateFromGraph = false;
    }
  };

  const cellChangeListeners = new Set<(change: OnChangeOptions) => () => void>();
  // Here we handle graph internal changes, it's skipped when there is an active batch
  const destroy = listenToCellChange(graph, (change) => {
    for (const listener of cellChangeListeners) {
      listener(change);
    }
    if (change.type === 'reset') {
      hasReset = true;
      changedCellIds.clear();
    } else {
      changedCellIds.add(change.cell.id.toString());
    }

    // Skip if we're syncing from state to prevent circular updates
    if (isSyncingFromState) return;
    if (!areBatchUpdatesDisabled && graph.hasActiveBatch()) return;
    onIncrementalChange();
  });

  // Track when batches start
  const onBatchStart = (event: { batchName?: string }) => {
    batchCounter++;
    // If we're syncing from state and this is a sync-cells batch, track it
    if (isSyncingFromState && event.batchName === 'sync-cells') {
      // This batch is from our syncCells call, so we should ignore its stop event
    }
  };

  // We only update batch when there is last one.
  const onBatchStop = (_event: { batchName?: string }) => {
    batchCounter--;
    if (batchCounter > 0) return; // Still in a nested batch
    if (!areBatchUpdatesDisabled && graph.hasActiveBatch()) return;

    // Reset the flag after batch completes
    const wasSyncingFromState = isSyncingFromState;
    if (syncFromStateCounter > 0) {
      syncFromStateCounter--;
      isSyncingFromState = syncFromStateCounter > 0;
    }

    // Reset the updatingStateFromGraph flag after batch completes
    // This ensures the flag stays set during the entire batch lifecycle
    if (updatingStateFromGraphCounter > 0) {
      updatingStateFromGraphCounter--;
      if (updatingStateFromGraphCounter === 0) {
        isUpdatingStateFromGraph = false;
      }
    }

    // Skip syncing back to React if we were syncing from React
    // This prevents circular updates: React → Graph (via syncCells) → batch:stop → React
    if (wasSyncingFromState) return;
    onIncrementalChange();
  };

  // If graph has existing cells but store is empty, sync those cells to the store first
  const syncExistingGraphCellsToStore = () => {
    if (!store.setState) {
      return;
    }

    const snapshot = store.getSnapshot();
    const storeElements = removeDeepReadOnly(snapshot.elements);
    const storeLinks = removeDeepReadOnly(snapshot.links);

    // Only sync if store is empty and graph has cells
    if (storeElements.length === 0 && storeLinks.length === 0) {
      const existingElements = graph.getElements().map((element) =>
        elementFromGraphSelector({
          cell: element,
          graph,
        })
      ) as Element[];
      const existingLinks = graph.getLinks().map((link) =>
        linkFromGraphSelector({
          cell: link,
          graph,
        })
      ) as Link[];

      if (existingElements.length > 0 || existingLinks.length > 0) {
        // Set flag to prevent syncing graph changes back to React during initialization
        updatingStateFromGraphCounter++;
        isUpdatingStateFromGraph = true;

        store.setState((previous) => ({
          ...previous,
          elements: existingElements,
          links: existingLinks,
        }));

        updatingStateFromGraphCounter--;
        if (updatingStateFromGraphCounter === 0) {
          isUpdatingStateFromGraph = false;
        }
      }
    }
  };

  const updateGraphInternal = () => {
    // Skip if we're updating state from graph changes
    // This prevents circular updates: Graph → State → Graph
    if (isUpdatingStateFromGraph) {
      return;
    }

    const snapshot = store.getSnapshot();
    const elements = removeDeepReadOnly(snapshot.elements) as Element[];
    const links = removeDeepReadOnly(snapshot.links) as Link[];

    // Set flag to prevent syncing graph changes back to React
    // This prevents circular updates: React → Graph → React
    syncFromStateCounter++;
    isSyncingFromState = true;

    const wasSynced = updateGraph({
      graph,
      elements,
      links,
      elementFromGraphSelector: elementFromGraphSelector as (options: {
        readonly cell: dia.Element;
        readonly graph: Graph;
      }) => Element,
      linkFromGraphSelector: linkFromGraphSelector as (options: {
        readonly cell: dia.Link;
        readonly graph: Graph;
      }) => Link,
      elementToGraphSelector: elementToGraphSelector as (options: {
        readonly element: Element;
        readonly graph: Graph;
      }) => dia.Cell.JSON,
      linkToGraphSelector: linkToGraphSelector as (options: {
        readonly link: Link;
        readonly graph: Graph;
      }) => dia.Cell.JSON,
    });

    // Only reset the flag if there's no batch (events were processed synchronously)
    // If there's a batch, onBatchStop will handle resetting it
    // We need to check after syncCells because it might have started a batch
    const shouldResetImmediately =
      !wasSynced || (wasSynced && batchCounter === 0 && !graph.hasActiveBatch());
    if (shouldResetImmediately) {
      syncFromStateCounter--;
      isSyncingFromState = syncFromStateCounter > 0;
    }
    // If wasSynced is true but batch is active, onBatchStop will handle resetting the flag
  };
  // Here we get the external changes and update the graph
  const clean = store.subscribe(() => {
    // Check if we should skip this update (we're updating state from graph)
    if (isUpdatingStateFromGraph) {
      return;
    }
    updateGraphInternal();
  });
  // listen to batch start and stop events to track batch lifecycle
  graph.on(BATCH_START_EVENT_NAME, onBatchStart);
  graph.on(BATCH_STOP_EVENT_NAME, onBatchStop);
  const cleanup = () => {
    cellChangeListeners.clear();
    destroy();
    clean();
    graph.off(BATCH_START_EVENT_NAME, onBatchStart);
    graph.off(BATCH_STOP_EVENT_NAME, onBatchStop);
  };

  /**
   * Subscribes to cell changes in the graph.
   * Allows external code to react to changes that occur in the graph.
   * The callback receives change information and should return a cleanup function that will be called
   * when the cell is removed or the subscription is cancelled.
   * @param callback - The callback function that receives change options and returns a cleanup function
   * @returns A function to unsubscribe from cell changes
   */
  function subscribeToCellChange(callback: (change: OnChangeOptions) => () => void) {
    cellChangeListeners.add(callback);
    return () => {
      cellChangeListeners.delete(callback);
    };
  }
  // First, sync existing graph cells to store if store is empty
  syncExistingGraphCellsToStore();
  // Then, sync store to graph
  updateGraphInternal();
  return {
    subscribeToCellChange,
    cleanup,
  };
}

/**
 * Interface for state synchronization instance.
 * Provides methods to subscribe to cell changes and clean up resources.
 */
export interface StateSync {
  /**
   * Subscribes to cell change events in the graph.
   * The callback receives change information and should return a cleanup function.
   * @param callback - Function that receives change options and returns a cleanup function
   * @returns Unsubscribe function to remove the listener
   */
  subscribeToCellChange: (callback: (change: OnChangeOptions) => () => void) => () => void;
  /**
   * Cleans up all subscriptions and event listeners.
   * Should be called when the synchronization is no longer needed.
   */
  cleanup: () => void;
}
