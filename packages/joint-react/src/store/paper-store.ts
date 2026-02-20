import { dia, g, util, V, type Vectorizer } from '@joint/core';
import type { OverWriteResult } from '../context';
import type { RenderElement, RenderLink } from '../components';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
import type { ReactPaper as ReactPaperType } from '../types/paper.types';
import type { GraphState, GraphStore } from './graph-store';
import { ReactPaper } from '../models/react-paper';

const DEFAULT_CLICK_THRESHOLD = 10;
const DEFAULT_CONNECTION_POINT = { name: 'rectangle', args: { useModelGeometry: true } };
/**
 * Default measureNode function that uses the model's bounding box for the root element node.
 * For sub-nodes (e.g. port magnets), falls back to the native SVG bounding box.
 * This ensures consistent measurement in React where elements are rendered via portals,
 * while still allowing port connection points to be calculated correctly.
 */
const DEFAULT_MEASURE_NODE = (
  node: SVGGraphicsElement,
  view: dia.ElementView<dia.Element>
): g.Rect => {
  if (node === view.el) {
    const { height, width } = view.model.size();
    return new g.Rect({ height, width, x: 0, y: 0 });
  }
  return V(node).getBBox();
};
export const PORTAL_SELECTOR = 'react-port-portal';

/**
 * Cache entry for port-related DOM elements and selectors.
 * Used internally to track port rendering state.
 */
export interface PortElementsCacheEntry {
  /** The main port element vectorizer */
  portElement: Vectorizer;
  /** Optional port label element vectorizer */
  portLabelElement?: Vectorizer | null;
  /** Selectors for port SVG elements */
  portSelectors: Record<string, SVGElement | SVGElement[]>;
  /** Optional selectors for port label SVG elements */
  portLabelSelectors?: Record<string, SVGElement | SVGElement[]>;
  /** The port content element vectorizer */
  portContentElement: Vectorizer;
  /** Optional selectors for port content SVG elements */
  portContentSelectors?: Record<string, SVGElement | SVGElement[]>;
}

/**
 * Options for adding a new paper instance to the graph store.
 */
export interface AddPaperOptions {
  /** JointJS Paper configuration options */
  readonly paperOptions: dia.Paper.Options;
  /** Optional function to override the default paper element rendering */
  readonly overWrite?: (paperStore: PaperStore) => OverWriteResult;
  /** The DOM element (HTML or SVG) where the paper will be rendered */
  readonly paperElement: HTMLElement | SVGElement;
  /** Optional initial scale for the paper */
  readonly scale?: number;
  /** Optional custom renderer for elements */
  readonly renderElement?: RenderElement<GraphElement>;
  /** Optional custom renderer for links */
  readonly renderLink?: RenderLink<GraphLink>;
}

/**
 * Options for creating a PaperStore instance.
 * Extends AddPaperOptions with required graph store and ID.
 */
export interface PaperStoreOptions extends AddPaperOptions {
  /** The graph store instance this paper belongs to */
  readonly graphStore: GraphStore;
  /** Unique identifier for this paper instance */
  readonly id: string;
}

/**
 * Snapshot of paper-specific state.
 * Contains element views and port data for this paper instance.
 */
export interface PaperStoreSnapshot {
  /** Map of cell IDs to their element views in this paper */
  paperElementViews?: Record<dia.Cell.ID, dia.ElementView>;
  /** Map of port IDs to their SVG elements */
  portsData?: Record<string, SVGElement>;
  /** Map of link IDs to their link views in this paper */
  linkViews?: Record<dia.Cell.ID, dia.LinkView>;
  /** Map of link label IDs to their SVG elements */
  linksData?: Record<string, SVGElement>;
}

/**
 * Store for managing a single Paper instance and its associated state.
 *
 * Each Paper component creates a PaperStore instance that:
 * - Manages the JointJS Paper instance
 * - Tracks element views for rendering
 * - Handles port rendering and caching
 * - Coordinates with the GraphStore for state updates
 */
export class PaperStore {
  /** The underlying JointJS Paper instance with React-specific properties */
  public paper: ReactPaper & ReactPaperType;
  /** Unique identifier for this paper instance */
  public paperId: string;
  /** Reference to the overwrite result if custom rendering is used */
  public overWriteResultRef?: OverWriteResult;
  /** Optional custom element renderer */
  public renderElement?: RenderElement<GraphElement>;
  /** Optional custom link renderer */
  public renderLink?: RenderLink<GraphLink>;

  /**
   * Cleanup function to unregister paper update callback from GraphStore.
   * @internal
   */
  private unregisterPaperUpdate?: () => void;

  constructor(options: PaperStoreOptions) {
    const {
      graphStore,
      paperOptions = {},
      overWrite,
      paperElement,
      scale,
      renderElement,
      renderLink,
      id,
    } = options;
    const { width, height } = paperOptions;
    const { graph } = graphStore;
    this.paperId = id;
    this.renderElement = renderElement;
    this.renderLink = renderLink;
    const cache: {
      portsData: Record<string, SVGElement>;
      elementViews: Record<dia.Cell.ID, dia.ElementView>;
      linkViews: Record<dia.Cell.ID, dia.LinkView>;
      linksData: Record<string, SVGElement>;
    } = {
      portsData: {},
      elementViews: {},
      linkViews: {},
      linksData: {},
    };
    // Register paper update callback with GraphStore's unified scheduler
    // This ensures paper updates are batched together with link/port updates
    const paperUpdateCallback = () => {
      graphStore.updatePaperSnapshot(options.id, (current) => {
        return {
          ...current,
          portsData: cache.portsData,
          paperElementViews: cache.elementViews,
          linkViews: cache.linkViews,
          linksData: cache.linksData,
        };
      });
    };
    this.unregisterPaperUpdate = graphStore.registerPaperUpdate(paperUpdateCallback);
    // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
    const store = this;

    // Create a new ReactPaper instance
    // ReactPaper handles view lifecycle internally via insertView/removeView
    // NOTE: We don't use cellVisibility to hide links because JointJS's
    // unmountedList.rotate() causes O(n) checks per frame when returning false.
    // Link visibility should be handled in React layer instead.
    const paper = new ReactPaper({
      async: true,
      sorting: dia.Paper.sorting.APPROX,
      preventDefaultBlankAction: false,
      frozen: true,
      model: graph,
      afterRender: (() => {
        // Re-entrance guard to prevent infinite loops
        let isProcessing = false;
        return function (this: ReactPaper) {
          if (isProcessing) {
            return;
          }
          isProcessing = true;

          // Check if any pending links can now be shown
          this.checkPendingLinks();

          // Iterate through all element views and capture port elements
          let hasPortsChanged = false;
          for (const view of Object.values(cache.elementViews)) {
            const portElementsCache = (
              view as dia.ElementView & {
                _portElementsCache?: Record<string, PortElementsCacheEntry>;
              }
            )._portElementsCache;
            if (!portElementsCache) {
              continue;
            }
            const newPorts = store.getNewPorts({
              state: graphStore.internalState,
              cellId: view.model.id as dia.Cell.ID,
              portElementsCache,
              portsData: cache.portsData,
            });
            if (newPorts && newPorts !== cache.portsData) {
              cache.portsData = newPorts;
              hasPortsChanged = true;
            }
          }

          // Only schedule update if ports actually changed
          if (hasPortsChanged) {
            graphStore.schedulePaperUpdate();
          }

          isProcessing = false;
        };
      })(),
      defaultConnectionPoint: DEFAULT_CONNECTION_POINT,
      measureNode: DEFAULT_MEASURE_NODE as unknown as dia.Paper.Options['measureNode'],
      ...paperOptions,
      clickThreshold: paperOptions.clickThreshold ?? DEFAULT_CLICK_THRESHOLD,
      autoFreeze: true,
      viewManagement: {
        disposeHidden: true,
        lazyInitialize: true,
      },
      graphStore,
    }) as ReactPaper & ReactPaperType;

    // Attach React-specific properties to the paper for view access
    paper.reactElementCache = {
      get elementViews() {
        return cache.elementViews;
      },
      set elementViews(value) {
        cache.elementViews = value;
      },
      get portsData() {
        return cache.portsData;
      },
      set portsData(value) {
        cache.portsData = value;
      },
    };
    paper.reactElementGraphStore = {
      schedulePaperUpdate: () => graphStore.schedulePaperUpdate(),
      get internalState() {
        return graphStore.internalState;
      },
    };
    paper.reactElementPaperStore = {
      getNewPorts: store.getNewPorts,
    };
    paper.reactLinkCache = {
      get linkViews() {
        return cache.linkViews;
      },
      set linkViews(value) {
        cache.linkViews = value;
      },
      get linksData() {
        return cache.linksData;
      },
      set linksData(value) {
        cache.linksData = value;
      },
    };
    paper.reactLinkGraphStore = {
      schedulePaperUpdate: () => graphStore.schedulePaperUpdate(),
      flushPendingUpdates: () => graphStore.flushPendingUpdates(),
    };
    paper.reactLinkPaperStore = {
      getLinkLabelId: store.getLinkLabelId,
    };

    this.paper = paper;

    if (!paperElement) {
      throw new Error('Paper HTML element is not available');
    }

    if (scale !== undefined) {
      this.paper.scale(scale);
    }

    this.renderPaper({ overWrite, element: paperElement });

    if (width !== undefined && height !== undefined) {
      this.paper.setDimensions(width, height);
    }
  }

  renderPaper = (options: {
    overWrite?: (ctx: PaperStore) => OverWriteResult;
    element: HTMLElement | SVGElement;
  }): OverWriteResult | undefined => {
    const { overWrite, element } = options;
    if (!this.paper) {
      throw new Error('Paper is not created');
    }
    let elementToRender: HTMLElement | SVGElement = this.paper.el;
    if (overWrite) {
      const overWriteResult = overWrite(this);

      elementToRender = overWriteResult?.element;
      this.overWriteResultRef = overWriteResult;
      if (overWriteResult?.contextUpdate) {
        Object.assign(this, overWriteResult.contextUpdate);
      }
    }

    if (!elementToRender) {
      throw new Error('overwriteDefaultPaperElement must return a valid HTML or SVG element');
    }

    element.replaceChildren(elementToRender);
    this.paper.unfreeze();
    return this.overWriteResultRef;
  };

  private getNewPorts = (options: {
    portsData: Record<string, SVGElement>;
    state: GraphState;
    cellId: dia.Cell.ID;
    portElementsCache: Record<string, PortElementsCacheEntry>;
  }) => {
    // silently update the ports data
    const { cellId, portElementsCache, portsData } = options;

    const nextPorts = { ...portsData };
    let isChanged = false;
    for (const portId in portElementsCache) {
      const { portSelectors } = portElementsCache[portId];
      const portalElement = portSelectors[PORTAL_SELECTOR];
      if (!portalElement) {
        // Port was defined via JointJS native API (not via React <Port> component),
        // so it doesn't have the portal selector. Skip it - it renders natively.
        continue;
      }

      const element = Array.isArray(portalElement) ? portalElement[0] : portalElement;
      const id = this.getPortId(cellId, portId);
      if (util.isEqual(nextPorts[id], element)) {
        continue;
      }
      isChanged = true;
      nextPorts[id] = element;
    }
    if (!isChanged) {
      return portsData;
    }
    const newPorts = { ...portsData, ...nextPorts };
    return newPorts;
  };

  /**
   * Generates a unique port ID by combining cell ID and port ID.
   * @param cellId - The ID of the cell containing the port
   * @param portId - The ID of the port
   * @returns A unique identifier for the port
   */
  public getPortId(cellId: dia.Cell.ID, portId: string) {
    return `${cellId}-${portId}`;
  }

  /**
   * Generates a unique link label ID by combining link ID and label index.
   * @param linkId - The ID of the link containing the label
   * @param labelIndex - The index of the label in the labels array
   * @returns A unique identifier for the link label
   */
  public getLinkLabelId(linkId: dia.Cell.ID, labelIndex: number) {
    return `${linkId}-label-${labelIndex}`;
  }

  /**
   * Cleans up the paper instance and all associated resources.
   * Should be called when the paper is being removed from the graph store.
   */
  public destroy = () => {
    // Unregister from GraphStore's update scheduler
    this.unregisterPaperUpdate?.();
    this.unregisterPaperUpdate = undefined;

    // Remove the JointJS paper instance - this cleans up:
    // - All event listeners on the paper
    // - All cell views
    // - The paper's DOM element
    this.paper.remove();
  };
}
