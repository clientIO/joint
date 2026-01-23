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
import { ReactLink } from '../models/react-link';
import type { ExternalStoreLike, State } from '../utils/create-state';
import { createState, derivedState, getValue } from '../utils/create-state';
import { stateSync, type StateSync, updateGraph } from '../state/state-sync';
import type { GraphStateSelectors } from '../state/graph-state-selectors';
import {
  defaultGraphToElementSelector,
  defaultElementToGraphSelector,
  defaultGraphToLinkSelector,
  defaultLinkToGraphSelector,
  createDefaultGraphToLinkMapper,
  createDefaultLinkMapper,
} from '../state/graph-state-selectors';
import type { OnChangeOptions } from '../utils/cell/listen-to-cell-change';
import { createScheduler } from '../utils/scheduler';

export const DEFAULT_CELL_NAMESPACE: Record<string, unknown> = {
  ...shapes,
  ReactElement,
  ReactLink,
};

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
  /** Rotation angle of the node in degrees */
  readonly angle: number;
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
 * Cache entry for batched link updates.
 * @internal
 */
interface LinkUpdateCacheEntry {
  /** Line attributes from BaseLink */
  attrs?: Record<string, unknown>;
  /** Labels by labelId from LinkLabel */
  labels?: Map<string, dia.Link.Label>;
  /** Label IDs to remove */
  labelsToRemove?: Set<string>;
  /** Mark entire link for removal */
  shouldRemove?: boolean;
}

/**
 * Link label with labelId property for identification.
 * @internal
 */
interface LinkLabelWithId extends dia.Link.Label {
  readonly labelId: string;
}

/**
 * Cache entry for batched port updates.
 * @internal
 */
interface PortUpdateCacheEntry {
  /** Ports to add or update by port ID */
  ports?: Map<string, dia.Element.Port>;
  /** Port IDs to remove */
  portsToRemove?: Set<string>;
  /** Port groups to add or update by group ID */
  groups?: Map<string, dia.Element.PortGroup>;
  /** Port group IDs to remove */
  groupsToRemove?: Set<string>;
}

/**
 * Cache entry for batched clearView updates.
 * @internal
 */
interface ClearViewCacheEntry {
  /** Callback to validate which links should be cleared */
  onValidateLink?: (link: dia.Link) => boolean;
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

  /**
   * Cache for batched link updates (attrs and labels).
   * Updates are collected here and flushed together via syncCells.
   * @internal
   */
  private linkUpdateCache = new Map<dia.Cell.ID, LinkUpdateCacheEntry>();

  /**
   * Cache for batched port updates (items and groups).
   * Updates are collected here and flushed together via syncCells.
   * @internal
   */
  private portUpdateCache = new Map<dia.Cell.ID, PortUpdateCacheEntry>();

  /**
   * Cache for batched clearView updates.
   * Updates are collected here and flushed together.
   * Key is cellId, value contains optional onValidateLink validator.
   * @internal
   */
  private clearViewCache = new Map<dia.Cell.ID, ClearViewCacheEntry>();

  /**
   * Unified scheduler for batching link, port, and paper snapshot updates.
   * Triggers flushGraphUpdates when scheduled, which processes all batched updates.
   * @internal
   */
  private graphUpdateScheduler: ReturnType<typeof createScheduler>;

  /**
   * Registered callbacks for paper snapshot updates.
   * Each PaperStore registers its update callback here to be batched together.
   * @internal
   */
  private paperUpdateCallbacks = new Set<() => void>();

  private readonly graphToElementSelector: (
    options: { readonly cell: dia.Element; readonly graph: dia.Graph } & {
      readonly previous?: GraphElement;
      readonly defaultMapper: () => GraphElement;
    }
  ) => GraphElement;
  private readonly graphToLinkSelector: (
    options: { readonly cell: dia.Link; readonly graph: dia.Graph } & {
      readonly previous?: GraphLink;
      readonly defaultMapper: () => GraphLink;
    }
  ) => GraphLink;
  private readonly elementToGraphSelector: (options: {
    readonly element: GraphElement;
    readonly graph: dia.Graph;
    readonly defaultMapper: () => dia.Cell.JSON;
  }) => dia.Cell.JSON;
  private readonly linkToGraphSelector: (options: {
    readonly link: GraphLink;
    readonly graph: dia.Graph;
    readonly defaultMapper: () => dia.Cell.JSON;
  }) => dia.Cell.JSON;

  constructor(config: GraphStoreOptions) {
    const {
      initialElements = [],
      initialLinks = [],
      cellModel,
      cellNamespace = DEFAULT_CELL_NAMESPACE,
      graph,
      externalStore: externalState,
      elementToGraphSelector = defaultElementToGraphSelector,
      linkToGraphSelector = defaultLinkToGraphSelector,
    } = config;

    // Store selectors as instance variables for use in onBatchUpdate
    // Always use default implementations for graph-to-state selectors (not configurable)
    this.graphToElementSelector = defaultGraphToElementSelector as (
      options: { readonly cell: dia.Element; readonly graph: dia.Graph } & {
        readonly previous?: GraphElement;
        readonly defaultMapper: () => GraphElement;
      }
    ) => GraphElement;
    this.graphToLinkSelector = defaultGraphToLinkSelector as (
      options: { readonly cell: dia.Link; readonly graph: dia.Graph } & {
        readonly previous?: GraphLink;
        readonly defaultMapper: () => GraphLink;
      }
    ) => GraphLink;
    this.elementToGraphSelector = elementToGraphSelector as (options: {
      readonly element: GraphElement;
      readonly graph: dia.Graph;
      readonly defaultMapper: () => dia.Cell.JSON;
    }) => dia.Cell.JSON;
    this.linkToGraphSelector = linkToGraphSelector as (options: {
      readonly link: GraphLink;
      readonly graph: dia.Graph;
      readonly defaultMapper: () => dia.Cell.JSON;
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

        isDevToolEnabled: true,
      });
    }
    this.internalState = createState<GraphStoreInternalSnapshot>({
      name: 'Jointjs/Internal',
      newState: () => ({
        papers: {},
      }),

      isDevToolEnabled: false,
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
    });

    this.stateSync = stateSync({
      areBatchUpdatesDisabled: config.areBatchUpdatesDisabled ?? false,
      graph: this.graph,
      getIdsSnapshot: () => this.derivedStore.getSnapshot(),
      elementToGraphSelector,
      linkToGraphSelector,
      store: {
        getSnapshot: () => this.publicState.getSnapshot(),
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
      isDevToolEnabled: true,
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
        const angle = element.get('angle') ?? 0;
        // Only track elements that have size (position defaults to 0,0 if not set)
        if (size) {
          const newLayout: NodeLayout = {
            x: position.x ?? 0,
            y: position.y ?? 0,
            width: size.width ?? 0,
            height: size.height ?? 0,
            angle,
          };

          // Only update if layout actually changed (optimization)
          const previousLayout = previousLayouts[element.id];
          if (
            !previousLayout ||
            previousLayout.x !== newLayout.x ||
            previousLayout.y !== newLayout.y ||
            previousLayout.width !== newLayout.width ||
            previousLayout.height !== newLayout.height ||
            previousLayout.angle !== newLayout.angle
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

    // Initialize unified scheduler for all graph-related updates
    // Batches link/port updates (syncCells) and paper snapshot updates together
    this.graphUpdateScheduler = createScheduler(() => {
      // Execute all registered paper update callbacks
      for (const callback of this.paperUpdateCallbacks) {
        callback();
      }
      // Then flush graph updates (links and ports)
      this.flushGraphUpdates();
    });

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
          getIdsSnapshot: this.derivedStore.getSnapshot,
          graph: this.graph,
          elements: newElements,
          links: currentLinks,
          graphToElementSelector: this.graphToElementSelector,
          graphToLinkSelector: this.graphToLinkSelector,
          elementToGraphSelector: this.elementToGraphSelector,
          linkToGraphSelector: this.linkToGraphSelector,
        });
      },
      getCellTransform: (id) => {
        const cell = this.graph.getCell(id);
        if (!cell?.isElement()) throw new Error('Cell not valid');
        const size = cell.get('size');
        const position = cell.get('position');
        const angle = cell.get('angle') ?? 0;
        if (!size) throw new Error('Size not found');
        return {
          width: size.width,
          height: size.height,
          element: cell,
          angle,
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
   * Merges label updates into the current labels array.
   * @param currentLabels - Current labels from the link
   * @param entry - Cache entry containing label updates
   * @returns Merged labels array
   * @internal
   */
  private mergeLinkLabels(
    currentLabels: dia.Link.Label[],
    entry: LinkUpdateCacheEntry
  ): dia.Link.Label[] {
    let mergedLabels = [...currentLabels];

    if (entry.labelsToRemove) {
      mergedLabels = mergedLabels.filter((l) => {
        const labelWithId = l as LinkLabelWithId;
        return !labelWithId.labelId || !entry.labelsToRemove!.has(labelWithId.labelId);
      });
    }

    if (entry.labels) {
      for (const [labelId, labelData] of entry.labels) {
        const existingIndex = mergedLabels.findIndex(
          (l) => (l as LinkLabelWithId).labelId === labelId
        );
        if (existingIndex === -1) {
          mergedLabels.push(labelData);
          continue;
        }
        mergedLabels[existingIndex] = labelData;
      }
    }

    return mergedLabels;
  }

  /**
   * Flushes all cached link updates and returns cells to sync.
   * Called automatically by the scheduler when updates are batched.
   * @returns Array of cell JSON objects to sync
   * @internal
   */
  private flushLinkUpdates = (): dia.Cell.JSON[] => {
    if (this.linkUpdateCache.size === 0) {
      return [];
    }

    // Build cells array for syncCells
    const cellsToSync: dia.Cell.JSON[] = [];

    for (const [linkId, entry] of this.linkUpdateCache) {
      const link = this.graph.getCell(linkId);
      if (!link?.isLink()) {
        continue;
      }

      // Convert link from graph to GraphLink format (preserves source/target correctly)
      const defaultGraphToLinkMapper = createDefaultGraphToLinkMapper(link);
      const graphLink = this.graphToLinkSelector({
        cell: link,
        graph: this.graph,
        defaultMapper: defaultGraphToLinkMapper,
      });

      // Merge cached attrs into the link
      const currentAttributes = graphLink.attrs ?? {};
      const updatedLink = entry.attrs
        ? {
            ...graphLink,
            attrs: {
              ...currentAttributes,
              ...entry.attrs,
            } as typeof graphLink.attrs,
          }
        : graphLink;

      // Convert back to Cell.JSON using linkToGraphSelector (reuses proper source/target handling)
      const linkMapper = createDefaultLinkMapper(updatedLink as GraphLink, this.graph);
      const cellJson = this.linkToGraphSelector({
        link: updatedLink as GraphLink,
        graph: this.graph,
        defaultMapper: linkMapper,
      });

      // Handle labels separately (labels are on the cell, not in GraphLink)
      if (entry.labels || entry.labelsToRemove) {
        const currentLabels = link.labels();
        cellJson.labels = this.mergeLinkLabels(currentLabels, entry);
      }

      cellsToSync.push(cellJson);
    }

    // Clear cache BEFORE sync to avoid re-triggering
    this.linkUpdateCache.clear();

    return cellsToSync;
  };

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

  /**
   * Updates the link view reference for a specific link in a paper.
   * Used internally to track link views for rendering and interaction.
   * @param paperId - The unique identifier of the paper
   * @param linkId - The ID of the link whose view is being updated
   * @param view - The JointJS link view instance
   */
  public updatePaperLinkView(paperId: string, linkId: dia.Cell.ID, view: dia.LinkView) {
    // silent update of the data.
    this.updatePaperSnapshot(paperId, (current) => {
      const base = current ?? { linkViews: {}, linksData: {} };

      const existingView = base.linkViews?.[linkId];
      if (existingView === view) return base;

      return {
        linkViews: {
          ...base.linkViews,
          [linkId]: view,
        },
      };
    });
  }

  private removePaper = (id: string) => {
    const paperStore = this.papers.get(id);
    // Cleanup paper update callback if it exists
    if (paperStore && 'unregisterPaperUpdate' in paperStore) {
      const unregister = (paperStore as unknown as { unregisterPaperUpdate?: () => void })
        .unregisterPaperUpdate;
      unregister?.();
    }
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

  /**
   * Sets link attributes (e.g., line styling from BaseLink).
   * Updates are batched and applied via syncCells for performance.
   * @param linkId - The ID of the link to update
   * @param attributes - Attributes to set on the link
   */
  public setLink = (linkId: dia.Cell.ID, attributes: Record<string, unknown>) => {
    const entry = this.linkUpdateCache.get(linkId) ?? {};
    entry.attrs = { ...entry.attrs, ...attributes };
    this.linkUpdateCache.set(linkId, entry);
    this.graphUpdateScheduler();
  };

  /**
   * Marks a link for removal.
   * Updates are batched and applied via syncCells for performance.
   * @param linkId - The ID of the link to remove
   */
  public removeLink = (linkId: dia.Cell.ID) => {
    const entry = this.linkUpdateCache.get(linkId) ?? {};
    entry.shouldRemove = true;
    this.linkUpdateCache.set(linkId, entry);
    this.graphUpdateScheduler();
  };

  /**
   * Sets or updates a link label (from LinkLabel component).
   * Updates are batched and applied via syncCells for performance.
   * @param linkId - The ID of the link
   * @param labelId - Unique identifier for the label
   * @param labelData - Label data to set
   */
  public setLinkLabel = (linkId: dia.Cell.ID, labelId: string, labelData: dia.Link.Label) => {
    const entry = this.linkUpdateCache.get(linkId) ?? {};
    entry.labels = entry.labels ?? new Map();
    entry.labels.set(labelId, labelData);
    this.linkUpdateCache.set(linkId, entry);
    this.graphUpdateScheduler();
  };

  /**
   * Removes a link label (from LinkLabel component unmount).
   * Updates are batched and applied via syncCells for performance.
   * @param linkId - The ID of the link
   * @param labelId - Unique identifier for the label to remove
   */
  public removeLinkLabel = (linkId: dia.Cell.ID, labelId: string) => {
    const entry = this.linkUpdateCache.get(linkId) ?? {};
    entry.labelsToRemove = entry.labelsToRemove ?? new Set();
    entry.labelsToRemove.add(labelId);
    this.linkUpdateCache.set(linkId, entry);
    this.graphUpdateScheduler();
  };

  /**
   * Merges port item updates into the current ports array.
   * @param currentPorts - Current port items array
   * @param entry - Cache entry containing port updates
   * @returns Merged port items array
   * @internal
   */
  private mergePortItems(
    currentPorts: dia.Element.Port[],
    entry: PortUpdateCacheEntry
  ): dia.Element.Port[] {
    // Start with current ports, filter out removed ones
    const filteredPorts = entry.portsToRemove
      ? currentPorts.filter((p) => {
          const portId = p.id;
          if (!portId) {
            return true;
          }
          return !entry.portsToRemove!.has(portId);
        })
      : [...currentPorts];

    // Add/update ports
    if (!entry.ports) {
      return filteredPorts;
    }

    const mergedPorts = [...filteredPorts];
    for (const [portId, portData] of entry.ports) {
      const existingIndex = mergedPorts.findIndex((p) => p.id === portId);
      if (existingIndex === -1) {
        mergedPorts.push(portData);
        continue;
      }
      mergedPorts[existingIndex] = portData;
    }

    return mergedPorts;
  }

  /**
   * Merges port group updates into the current groups object.
   * @param currentGroups - Current port groups object
   * @param entry - Cache entry containing port updates
   * @returns Merged port groups object
   * @internal
   */
  private mergePortGroups(
    currentGroups: Record<string, dia.Element.PortGroup> | undefined,
    entry: PortUpdateCacheEntry
  ): Record<string, dia.Element.PortGroup> {
    const mergedGroups = { ...currentGroups };

    // Remove groups
    if (entry.groupsToRemove) {
      for (const groupId of entry.groupsToRemove) {
        if (groupId) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete mergedGroups[groupId];
        }
      }
    }

    // Add/update groups
    if (entry.groups) {
      for (const [groupId, groupData] of entry.groups) {
        mergedGroups[groupId] = groupData;
      }
    }

    return mergedGroups;
  }

  /**
   * Merges port updates into the current ports structure.
   * @param currentPorts - Current port items array
   * @param currentGroups - Current port groups object
   * @param entry - Cache entry containing port updates
   * @returns Merged ports and groups
   * @internal
   */
  private mergePortUpdates(
    currentPorts: dia.Element.Port[],
    currentGroups: Record<string, dia.Element.PortGroup> | undefined,
    entry: PortUpdateCacheEntry
  ): {
    ports: dia.Element.Port[];
    groups: Record<string, dia.Element.PortGroup>;
  } {
    return {
      ports: this.mergePortItems(currentPorts, entry),
      groups: this.mergePortGroups(currentGroups, entry),
    };
  }

  /**
   * Flushes all cached port updates and returns cells to sync.
   * Called automatically by the scheduler when updates are batched.
   * @returns Array of cell JSON objects to sync
   * @internal
   */
  private flushPortUpdates = (): dia.Cell.JSON[] => {
    if (this.portUpdateCache.size === 0) {
      return [];
    }

    // Build cells array for syncCells
    const cellsToSync: dia.Cell.JSON[] = [];

    for (const [elementId, entry] of this.portUpdateCache) {
      const element = this.graph.getCell(elementId);
      if (!element?.isElement()) {
        continue;
      }

      // Get current ports structure from element
      const currentPorts = element.get('ports') || {};
      const currentPortItems = currentPorts.items || [];
      const currentGroups = currentPorts.groups || {};

      // Merge port updates
      const { ports, groups } = this.mergePortUpdates(currentPortItems, currentGroups, entry);

      // Build cell JSON with merged ports
      // Use toJSON to get current state, then update ports
      const cellJson = element.toJSON();

      // Update ports in cellJson
      cellJson.ports = {
        items: ports,
        groups,
      };

      cellsToSync.push(cellJson);
    }

    // Clear cache BEFORE sync to avoid re-triggering
    this.portUpdateCache.clear();

    return cellsToSync;
  };

  /**
   * Flushes all cached graph updates (links, ports, and clearView) in a single pass.
   * Called automatically by the unified scheduler when updates are batched.
   * @internal
   */
  private flushGraphUpdates = () => {
    const linkCells = this.flushLinkUpdates();
    const portCells = this.flushPortUpdates();

    // Combine all updates into single syncCells call for maximum efficiency
    const allCells = [...linkCells, ...portCells];

    if (allCells.length > 0) {
      this.graph.syncCells(allCells, { remove: false });
    }

    // Flush clearView after syncCells to ensure ports are applied first
    this.flushClearViewInternal();
  };

  /**
   * Flushes graph updates immediately (synchronously).
   * Used during initial render to ensure labels appear immediately with elements/links.
   * @internal
   */
  private flushGraphUpdatesImmediate = () => {
    // Execute all registered paper update callbacks
    for (const callback of this.paperUpdateCallbacks) {
      callback();
    }
    // Then flush graph updates (links, ports, and clearView)
    this.flushGraphUpdates();
  };

  /**
   * Flushes all pending graph updates synchronously.
   * Call this from useLayoutEffect to ensure updates are applied before paint.
   */
  public flushPendingUpdates = () => {
    if (
      this.linkUpdateCache.size === 0 &&
      this.portUpdateCache.size === 0 &&
      this.clearViewCache.size === 0
    ) {
      return;
    }
    this.flushGraphUpdatesImmediate();
  };

  /**
   * Sets or updates a port (from Port.Item component).
   * Updates are batched and applied via syncCells for performance.
   * @param elementId - The ID of the element containing the port
   * @param portId - Unique identifier for the port
   * @param portData - Port data to set
   */
  public setPort = (elementId: dia.Cell.ID, portId: string, portData: dia.Element.Port) => {
    const entry = this.portUpdateCache.get(elementId) ?? {};
    entry.ports = entry.ports ?? new Map();
    entry.ports.set(portId, portData);
    this.portUpdateCache.set(elementId, entry);
    this.graphUpdateScheduler();
  };

  /**
   * Removes a port (from Port.Item component unmount).
   * Updates are batched and applied via syncCells for performance.
   * @param elementId - The ID of the element containing the port
   * @param portId - Unique identifier for the port to remove
   */
  public removePort = (elementId: dia.Cell.ID, portId: string) => {
    const entry = this.portUpdateCache.get(elementId) ?? {};
    entry.portsToRemove = entry.portsToRemove ?? new Set();
    entry.portsToRemove.add(portId);
    this.portUpdateCache.set(elementId, entry);
    this.graphUpdateScheduler();
  };

  /**
   * Sets or updates a port group (from Port.Group component).
   * Updates are batched and applied via syncCells for performance.
   * @param elementId - The ID of the element containing the port group
   * @param groupId - Unique identifier for the port group
   * @param groupData - Port group data to set
   */
  public setPortGroup = (
    elementId: dia.Cell.ID,
    groupId: string,
    groupData: dia.Element.PortGroup
  ) => {
    const entry = this.portUpdateCache.get(elementId) ?? {};
    entry.groups = entry.groups ?? new Map();
    entry.groups.set(groupId, groupData);
    this.portUpdateCache.set(elementId, entry);
    this.graphUpdateScheduler();
  };

  /**
   * Removes a port group (from Port.Group component unmount).
   * Updates are batched and applied via syncCells for performance.
   * @param elementId - The ID of the element containing the port group
   * @param groupId - Unique identifier for the port group to remove
   */
  public removePortGroup = (elementId: dia.Cell.ID, groupId: string) => {
    const entry = this.portUpdateCache.get(elementId) ?? {};
    entry.groupsToRemove = entry.groupsToRemove ?? new Set();
    entry.groupsToRemove.add(groupId);
    this.portUpdateCache.set(elementId, entry);
    this.graphUpdateScheduler();
  };

  /**
   * Registers a paper update callback to be executed during batch flush.
   * Used by PaperStore to batch paper snapshot updates together with graph updates.
   * @param callback - Callback function to execute during batch flush
   * @returns Cleanup function to unregister the callback
   * @internal
   */
  public registerPaperUpdate = (callback: () => void): (() => void) => {
    this.paperUpdateCallbacks.add(callback);
    return () => {
      this.paperUpdateCallbacks.delete(callback);
    };
  };

  /**
   * Schedules a paper update to be batched with other updates.
   * Triggers the unified scheduler which will execute all registered callbacks.
   * @internal
   */
  public schedulePaperUpdate = () => {
    this.graphUpdateScheduler();
  };

  /**
   * Schedules a clearView operation to be batched.
   * Multiple calls for the same cell are deduplicated.
   * If called multiple times for the same cell, the last onValidateLink wins.
   * If any call has no onValidateLink (meaning "clear all"), that takes precedence.
   * @param options - Options for the clearView operation
   * @param options.cellId - The cell ID to clear
   * @param options.onValidateLink - Optional callback to determine which links to keep
   */
  public scheduleClearView = (options: {
    readonly cellId: dia.Cell.ID;
    readonly onValidateLink?: (link: dia.Link) => boolean;
  }) => {
    const { cellId, onValidateLink } = options;
    const existingEntry = this.clearViewCache.get(cellId);

    // If no existing entry, create new one
    if (!existingEntry) {
      this.clearViewCache.set(cellId, { onValidateLink });
      this.graphUpdateScheduler();
      return;
    }

    // Merge strategy:
    // - If new call has no validator (clear all links), remove any existing validator
    // - If new call has a validator but existing doesn't, keep clearing all
    // - If both have validators, the new validator should allow more links (union behavior)
    if (!onValidateLink) {
      // No validator means clear all links - this takes precedence
      this.clearViewCache.set(cellId, { onValidateLink: undefined });
    } else if (existingEntry.onValidateLink) {
      // Both have validators - create union validator
      const existingValidator = existingEntry.onValidateLink;
      const newValidator = onValidateLink;
      this.clearViewCache.set(cellId, {
        onValidateLink: (link: dia.Link) => existingValidator(link) || newValidator(link),
      });
    }
    // If existing has no validator but new does, keep existing (clear all)

    this.graphUpdateScheduler();
  };

  /**
   * Flushes all pending clearView operations synchronously.
   * Call this from useLayoutEffect to ensure views are cleared before paint.
   */
  public flushClearView = () => {
    if (this.clearViewCache.size === 0) {
      return;
    }
    this.flushClearViewInternal();
  };

  /**
   * Internal method to flush clearView cache.
   * @internal
   */
  private flushClearViewInternal = () => {
    // Process each cell in the cache
    for (const [cellId, entry] of this.clearViewCache) {
      this.executeClearViewForCell(cellId, entry.onValidateLink);
    }

    // Clear cache after processing
    this.clearViewCache.clear();
  };

  /**
   * Executes clearView for a single cell.
   * @internal
   * @param cellId - The cell ID to clear
   * @param onValidateLink - Optional callback to determine which links to keep
   */
  private executeClearViewForCell = (
    cellId: dia.Cell.ID,
    onValidateLink?: (link: dia.Link) => boolean
  ) => {
    // Get all papers and execute clearView on each
    for (const paperStore of this.papers.values()) {
      const { paper } = paperStore;
      if (!paper) {
        continue;
      }

      const elementView = paper.findViewByModel(cellId);
      if (!elementView) {
        continue;
      }

      elementView.cleanNodesCache();
      this.clearConnectedLinkViews(paper, cellId, onValidateLink);
    }
  };

  /**
   * Clears the connected link views for a cell.
   * @internal
   * @param paper - The JointJS Paper instance
   * @param cellId - The cell ID whose connected links to clear
   * @param onValidateLink - Optional callback to determine which links to keep
   */
  private clearConnectedLinkViews = (
    paper: dia.Paper,
    cellId: dia.Cell.ID,
    onValidateLink?: (link: dia.Link) => boolean
  ) => {
    const cell = this.graph.getCell(cellId);
    if (!cell) {
      return;
    }

    for (const link of this.graph.getConnectedLinks(cell)) {
      if (!this.shouldClearLink(link, cellId, onValidateLink)) {
        continue;
      }

      const linkView = link.findView(paper);
      if (!linkView) {
        continue;
      }

      // @ts-expect-error we use private jointjs api method
      linkView._sourceMagnet = null;
      // @ts-expect-error we use private jointjs api method
      linkView._targetMagnet = null;
      // @ts-expect-error we use private jointjs api method
      linkView.requestConnectionUpdate({ async: false });
    }
  };

  /**
   * Determines if a link should be cleared.
   * @internal
   * @param link - The link to check
   * @param cellId - The cell ID to check against
   * @param onValidateLink - Optional callback to determine if link should be cleared
   * @returns True if the link should be cleared
   */
  private shouldClearLink = (
    link: dia.Link,
    cellId: dia.Cell.ID,
    onValidateLink?: (link: dia.Link) => boolean
  ): boolean => {
    const target = link.target();
    const source = link.source();
    const isElementLink = target.id === cellId || source.id === cellId;

    return isElementLink && (!onValidateLink || onValidateLink(link));
  };
}
