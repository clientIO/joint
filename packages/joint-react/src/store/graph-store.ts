import { dia, shapes, util } from '@joint/core';
import { startTransition } from 'react';
import type { GraphLink } from '../types/link-types';
import type { GraphElement } from '../types/element-types';
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
import { stateSync, type StateSync, updateGraph } from '../state/state-sync';
import type { GraphStateSelectors } from '../state/graph-state-selectors';
import {
  defaultElementFromGraphSelector,
  defaultElementToGraphSelector,
  defaultLinkFromGraphSelector,
  defaultLinkToGraphSelector,
} from '../state/graph-state-selectors';
import type { OnChangeOptions } from '../utils/cell/listen-to-cell-change';
import { createScheduler } from '../utils/scheduler';

export const DEFAULT_CELL_NAMESPACE: Record<string, unknown> = { ...shapes, ReactElement };

/**
 * External store interface compatible with GraphStore.
 * Used for integrating with external state management libraries (Redux, Zustand, etc.).
 */
export type ExternalGraphStore = ExternalStoreLike<GraphStoreSnapshot>;

/**
 * Internal state type for GraphStore.
 * Contains the full internal snapshot including paper-specific data.
 */
export type GraphState = State<GraphStoreInternalSnapshot>;

/**
 * Public snapshot of the graph store containing elements and links.
 * This is the shape of data exposed to React components and external stores.
 * @template Element - The type of elements in the graph
 * @template Link - The type of links in the graph
 */
export interface GraphStoreSnapshot<
  Element extends GraphElement = GraphElement,
  Link extends GraphLink = GraphLink,
> {
  /** Array of all elements (nodes) in the graph */
  readonly elements: Element[];
  /** Array of all links (edges) in the graph */
  readonly links: Link[];
}

/**
 * Snapshot containing index mappings for elements and links by their IDs.
 * Used for efficient lookups and synchronization.
 */
export interface GraphStoreDerivedSnapshot {
  /** Map of element IDs to their index in the elements array */
  readonly elementIds: Record<dia.Cell.ID, number>;
  /** Map of link IDs to their index in the links array */
  readonly linkIds: Record<dia.Cell.ID, number>;
}

/**
 * Layout data for a single node (element).
 */
export interface NodeLayout {
  /** X position of the node */
  readonly x: number;
  /** Y position of the node */
  readonly y: number;
  /** Width of the node */
  readonly width: number;
  /** Height of the node */
  readonly height: number;
}

/**
 * Snapshot containing layout data (geometry) for all nodes by their IDs.
 * Computed from actual graph cell sizes and positions.
 */
export interface GraphStoreLayoutSnapshot {
  /** Map of element IDs to their layout data (x, y, width, height) */
  readonly layouts: Record<dia.Cell.ID, NodeLayout>;
  /** Flag indicating if elements have ever been measured (sticky behavior) */
  readonly wasEverMeasured: boolean;
}

/**
 * Full internal snapshot of the graph store.
 * Contains paper-specific data and is not directly exposed to consumers.
 */
export interface GraphStoreInternalSnapshot {
  /** Map of paper IDs to their store snapshots */
  readonly papers: Record<string, PaperStoreSnapshot>;
}

/**
 * Configuration options for creating a GraphStore instance.
 * @template Element - The type of elements in the graph
 * @template Link - The type of links in the graph
 */
export interface GraphStoreOptions<
  Element extends GraphElement = GraphElement,
  Link extends GraphLink = GraphLink,
> extends GraphStateSelectors<Element, Link> {
  /**
   * Graph instance to use. If not provided, a new graph instance will be created.
   * Useful when you need to share a graph instance across multiple stores or integrate with existing JointJS code.
   * @see https://docs.jointjs.com/api/dia/Graph
   * @default new dia.Graph({}, { cellNamespace: shapes })
   */
  readonly graph?: dia.Graph;
  /**
   * Namespace for cell models. Defines which cell types are available in the graph.
   * When provided, it will be merged with the default namespace (shapes + ReactElement).
   * It's loaded just once during initialization, so it cannot be used as React state.
   * @default shapes
   * @see https://docs.jointjs.com/api/shapes
   */
  readonly cellNamespace?: unknown;
  /**
   * Custom cell model to use as the base class for all cells in the graph.
   * It's loaded just once during initialization, so it cannot be used as React state.
   * @see https://docs.jointjs.com/api/dia/Cell
   */
  readonly cellModel?: typeof dia.Cell;
  /**
   * Initial elements to be added to the graph on creation.
   * These are loaded just once during initialization, so they cannot be used as React state.
   * For dynamic elements, use controlled mode with `elements` and `onElementsChange` props on GraphProvider.
   */
  readonly initialElements?: GraphElement[];

  /**
   * Initial links to be added to the graph on creation.
   * These are loaded just once during initialization, so they cannot be used as React state.
   * For dynamic links, use controlled mode with `links` and `onLinksChange` props on GraphProvider.
   */
  readonly initialLinks?: GraphLink[];

  /**
   * External store to use as the source of truth for elements and links.
   * When provided, GraphStore will treat this as the authoritative source and sync bidirectionally.
   * Compatible with any store that implements the ExternalStoreLike interface (Redux, Zustand, etc.).
   * Takes precedence over React-controlled mode (onElementsChange/onLinksChange).
   */
  readonly externalStore?: ExternalGraphStore;

  /**
   * If true, batch updates are disabled and synchronization will be real-time.
   * If false (default), batch updates are enabled for better performance.
   * @default false
   */
  readonly areBatchUpdatesDisabled?: boolean;
}

/**
 * Central store for managing graph state, synchronization, and paper instances.
 * Handles bidirectional synchronization between React state and JointJS graph,
 * manages element size observations, and coordinates multiple paper views.
 */
export class GraphStore {
  /**
   * Internal state containing paper-specific snapshots.
   * @internal
   */
  public readonly internalState: State<GraphStoreInternalSnapshot>;
  /**
   * Public state containing elements and links, exposed to React components.
   * Can be replaced with an external store for controlled mode.
   * @internal
   */
  public publicState: ExternalStoreLike<GraphStoreSnapshot>;
  /**
   * Derived state containing ID-to-index mappings for efficient lookups.
   * @internal
   */
  public readonly derivedStore: State<GraphStoreDerivedSnapshot>;
  /**
   * State tracking whether all elements have been measured (have width and height).
   * Computed based on actual graph cell sizes, not state data.
   * @internal
   */
  public readonly areElementsMeasuredState: State<boolean>;
  /**
   * State containing layout data (geometry) for all nodes by their IDs.
   * Computed from actual graph cell sizes and positions.
   * @internal
   */
  public readonly layoutState: State<GraphStoreLayoutSnapshot>;

  /** The underlying JointJS graph instance */
  public readonly graph: dia.Graph;

  private unsubscribeFromExternal?: () => void;

  private papers = new Map<string, PaperStore>();
  private observer: GraphStoreObserver;
  private stateSync: StateSync;
  private readonly elementFromGraphSelector: (
    options: { readonly cell: dia.Element; readonly graph: dia.Graph } & {
      readonly previous?: GraphElement;
    }
  ) => GraphElement;
  private readonly linkFromGraphSelector: (
    options: { readonly cell: dia.Link; readonly graph: dia.Graph } & {
      readonly previous?: GraphLink;
    }
  ) => GraphLink;
  private readonly elementToGraphSelector: (options: {
    readonly element: GraphElement;
    readonly graph: dia.Graph;
  }) => dia.Cell.JSON;
  private readonly linkToGraphSelector: (options: {
    readonly link: GraphLink;
    readonly graph: dia.Graph;
  }) => dia.Cell.JSON;

  constructor(config: GraphStoreOptions) {
    const {
      initialElements = [],
      initialLinks = [],
      cellModel,
      cellNamespace = DEFAULT_CELL_NAMESPACE,
      graph,
      externalStore: externalState,
      elementFromGraphSelector = defaultElementFromGraphSelector,
      elementToGraphSelector = defaultElementToGraphSelector,
      linkFromGraphSelector = defaultLinkFromGraphSelector,
      linkToGraphSelector = defaultLinkToGraphSelector,
    } = config;

    // Store selectors as instance variables for use in onBatchUpdate
    this.elementFromGraphSelector = elementFromGraphSelector as (
      options: { readonly cell: dia.Element; readonly graph: dia.Graph } & {
        readonly previous?: GraphElement;
      }
    ) => GraphElement;
    this.linkFromGraphSelector = linkFromGraphSelector as (
      options: { readonly cell: dia.Link; readonly graph: dia.Graph } & {
        readonly previous?: GraphLink;
      }
    ) => GraphLink;
    this.elementToGraphSelector = elementToGraphSelector as (options: {
      readonly element: GraphElement;
      readonly graph: dia.Graph;
    }) => dia.Cell.JSON;
    this.linkToGraphSelector = linkToGraphSelector as (options: {
      readonly link: GraphLink;
      readonly graph: dia.Graph;
    }) => dia.Cell.JSON;

    this.graph =
      graph ??
      new dia.Graph(
        {},
        {
          cellNamespace: {
            ...DEFAULT_CELL_NAMESPACE,
            // @ts-expect-error Shapes is not a valid type for cellNamespace
            ...cellNamespace,
          },
          cellModel,
        }
      );

    if (externalState) {
      this.publicState = externalState;
    } else {
      this.publicState = createState<GraphStoreSnapshot>({
        name: 'JointJs/Data',
        newState: () => ({
          elements: [],
          links: [],
        }),
        isEqual: util.isEqual,
      });
    }
    this.internalState = createState<GraphStoreInternalSnapshot>({
      name: 'Jointjs/Internal',
      newState: () => ({
        papers: {},
      }),
      isEqual: util.isEqual,
    });

    this.derivedStore = derivedState({
      name: 'Jointjs/DataIds',
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

    this.stateSync = stateSync({
      areBatchUpdatesDisabled: config.areBatchUpdatesDisabled ?? false,
      graph: this.graph,
      getIdsSnapshot: () => this.derivedStore.getSnapshot(),
      elementToGraphSelector,
      elementFromGraphSelector,
      linkToGraphSelector,
      linkFromGraphSelector,
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

    // Create state for tracking node layouts
    this.layoutState = createState<GraphStoreLayoutSnapshot>({
      name: 'Jointjs/Layout',
      newState: () => ({ layouts: {}, wasEverMeasured: false }),
      isEqual: util.isEqual,
    });

    // Derive areElementsMeasured from layout state
    this.areElementsMeasuredState = derivedState({
      name: 'Jointjs/AreElementsMeasured',
      state: this.layoutState,
      selector: (snapshot) => {
        // If we've ever been measured, always return true (sticky behavior)
        if (snapshot.wasEverMeasured) {
          return true;
        }

        const { layouts } = snapshot;
        const layoutEntries = Object.values(layouts);

        if (layoutEntries.length === 0) {
          return false;
        }

        for (const layout of layoutEntries) {
          if (layout.width <= 1 || layout.height <= 1) {
            return false;
          }
        }

        return true;
      },
      isEqual: util.isEqual,
    });

    // Function to update layout state from graph
    // Optimized to only update changed elements and use startTransition for better performance
    const updateLayoutState = () => {
      const layouts: Record<dia.Cell.ID, NodeLayout> = {};
      const elements = this.graph.getElements();
      const previousLayouts = this.layoutState.getSnapshot().layouts;

      for (const element of elements) {
        const size = element.get('size');
        const position = element.get('position') ?? { x: 0, y: 0 };
        // Only track elements that have size (position defaults to 0,0 if not set)
        if (size) {
          const newLayout: NodeLayout = {
            x: position.x ?? 0,
            y: position.y ?? 0,
            width: size.width ?? 0,
            height: size.height ?? 0,
          };

          // Only update if layout actually changed (optimization)
          const previousLayout = previousLayouts[element.id];
          if (
            !previousLayout ||
            previousLayout.x !== newLayout.x ||
            previousLayout.y !== newLayout.y ||
            previousLayout.width !== newLayout.width ||
            previousLayout.height !== newLayout.height
          ) {
            layouts[element.id] = newLayout;
          } else {
            // Reuse previous layout to avoid unnecessary updates
            layouts[element.id] = previousLayout;
          }
        }
      }

      // Compute if all elements are measured
      const layoutEntries = Object.values(layouts);
      let areAllMeasured = layoutEntries.length > 0;
      for (const layout of layoutEntries) {
        if (layout.width <= 1 || layout.height <= 1) {
          areAllMeasured = false;
          break;
        }
      }

      // Use startTransition for layout state updates to keep UI responsive
      startTransition(() => {
        this.layoutState.setState((previous) => ({
          layouts,
          wasEverMeasured: previous.wasEverMeasured || areAllMeasured,
        }));
      });
    };

    // Debounce layout state updates using scheduler to batch multiple changes
    const scheduleLayoutUpdate = createScheduler(updateLayoutState);

    // Subscribe to cell changes to update layout state
    // areElementsMeasured will be automatically derived from layout state
    this.stateSync.subscribeToGraphChange(() => {
      // Schedule layout state update (batched for performance)
      scheduleLayoutUpdate();

      // Return cleanup function (no-op since we don't need per-cell cleanup)
      return () => {
        // No cleanup needed
      };
    });

    // Initial layout state computation
    updateLayoutState();

    // Observer for element sizes (uses state.getSnapshot)

    this.observer = createElementsSizeObserver({
      getIdsSnapshot: this.derivedStore.getSnapshot,
      getPublicSnapshot: this.publicState.getSnapshot,
      onBatchUpdate: (newElements) => {
        // Get current links from state
        const snapshot = this.publicState.getSnapshot();
        const currentLinks = snapshot.links;

        // Update graph directly - this will trigger automatic state sync
        updateGraph({
          graph: this.graph,
          elements: newElements,
          links: currentLinks,
          elementFromGraphSelector: this.elementFromGraphSelector,
          linkFromGraphSelector: this.linkFromGraphSelector,
          elementToGraphSelector: this.elementToGraphSelector,
          linkToGraphSelector: this.linkToGraphSelector,
        });
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
          ...position,
        };
      },
    });

    // Initial sync: either from external store or from constructor elements/links
    // Only set initial elements/links if graph doesn't have existing cells
    // (if graph has cells, syncExistingGraphCellsToStore in stateSync will handle it)
    const graphHasCells = this.graph.getElements().length > 0 || this.graph.getLinks().length > 0;
    if (!graphHasCells || initialElements.length > 0 || initialLinks.length > 0) {
      this.publicState.setState((previous) => ({
        ...previous,
        elements: initialElements,
        links: initialLinks,
      }));
    }
  }

  /**
   * Cleans up all resources and subscriptions.
   * Should be called when the GraphStore is no longer needed.
   * @param isGraphExternal - Whether the graph instance was provided externally (should not be cleared)
   */
  public destroy = (isGraphExternal: boolean) => {
    this.internalState.clean();
    this.derivedStore.clean();
    this.layoutState.clean();
    this.areElementsMeasuredState.clean();
    // Only clean publicState if it's not an external store (external stores don't have clean method)
    if ('clean' in this.publicState && typeof this.publicState.clean === 'function') {
      this.publicState.clean();
    }
    this.observer.clean();
    this.unsubscribeFromExternal?.();
    this.stateSync.cleanup();
    if (!isGraphExternal) {
      this.graph.clear();
    }
  };

  /**
   * Updates the snapshot for a specific paper instance.
   * @param paperId - The unique identifier of the paper
   * @param updater - Function that receives the previous snapshot and returns the new one
   */
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

  /**
   * Updates the element view reference for a specific cell in a paper.
   * Used internally to track element views for rendering and interaction.
   * @param paperId - The unique identifier of the paper
   * @param cellId - The ID of the cell whose view is being updated
   * @param view - The JointJS element view instance
   */
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
  /**
   * Adds a new paper instance to the store.
   * @param id - Unique identifier for the paper
   * @param paperOptions - Configuration options for the paper
   * @returns Cleanup function to remove the paper
   */
  public addPaper = (id: string, paperOptions: AddPaperOptions) => {
    const paperStore = new PaperStore({
      ...paperOptions,
      graphStore: this,
      id,
    });
    this.papers.set(id, paperStore);
    return () => {
      this.removePaper(id);
    };
  };

  /**
   * Checks if a node is currently being measured for size.
   * @param id - The ID of the cell to check
   * @returns True if the node is being observed for size changes
   */
  public hasMeasuredNode = (id: dia.Cell.ID) => {
    return this.observer.has(id);
  };

  /**
   * Registers a node for size measurement observation.
   * The observer will automatically update the element's size when the DOM element changes.
   * @param options - Configuration for the measured node
   * @returns Cleanup function to stop observing
   */
  public setMeasuredNode = (options: SetMeasuredNodeOptions) => {
    return this.observer.add(options);
  };

  /**
   * Retrieves a paper store instance by its ID.
   * @param id - The unique identifier of the paper
   * @returns The PaperStore instance, or undefined if not found
   */
  public getPaperStore = (id: string) => {
    return this.papers.get(id);
  };

  /**
   * Subscribes to cell change events in the graph.
   * Useful for reacting to changes that occur outside of React's control.
   * @param callback - Function that receives change options and returns a cleanup function
   * @returns Unsubscribe function
   */
  public subscribeToCellChange = (callback: (change: OnChangeOptions) => () => void) => {
    return this.stateSync.subscribeToCellChange(callback);
  };

  /**
   * Updates the external store reference.
   * Used internally when switching between controlled and uncontrolled modes.
   * @param newStore - The new external store to use
   */
  public updateExternalStore = (newStore: ExternalStoreLike<GraphStoreSnapshot>) => {
    this.publicState = newStore;
  };
}
