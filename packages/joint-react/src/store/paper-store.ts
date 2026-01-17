/* eslint-disable sonarjs/cognitive-complexity */
import { dia, util, type Vectorizer } from '@joint/core';
import type { OverWriteResult } from '../context';
import type { RenderElement, RenderLink } from '../components';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
import type { GraphState, GraphStore } from './graph-store';
import { REACT_TYPE } from '../models/react-element';

const DEFAULT_CLICK_THRESHOLD = 10;
export const PORTAL_SELECTOR = 'react-port-portal';
export const LINK_LABEL_PORTAL_SELECTOR = 'react-link-label-portal';
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
  /** The underlying JointJS Paper instance */
  public paper: dia.Paper;
  /** Unique identifier for this paper instance */
  public paperId: string;
  /** Reference to the overwrite result if custom rendering is used */
  public overWriteResultRef?: OverWriteResult;
  /** Optional custom element renderer */
  private renderElement?: RenderElement<GraphElement>;
  /** Optional custom link renderer */
  public renderLink?: RenderLink<GraphLink>;

  public ReactElementView: typeof dia.ElementView;

  /**
   * Cleanup function to unregister paper update callback from GraphStore.
   * @internal
   */
  private unregisterPaperUpdate?: () => void;
  public ReactLinkView: typeof dia.LinkView;

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

    const hasRenderElement = renderElement !== undefined;
    this.ReactElementView = dia.ElementView.extend({
      renderMarkup() {
        const ele: HTMLElement = this.vel;
        // add magnet false to the element
        ele.setAttribute('magnet', 'false');
      },
      onRender() {
        // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
        const view: dia.ElementView = this;
        const cellId = view.model.id as dia.Cell.ID;
        cache.elementViews = {
          ...cache.elementViews,
          [cellId]: view,
        };
        graphStore.schedulePaperUpdate();
      },
      _renderPorts() {
        // @ts-expect-error we use private jointjs api
        dia.ElementView.prototype._renderPorts.call(this);
        // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
        const view: dia.ElementView = this;
        const portElementsCache: Record<string, PortElementsCacheEntry> = this._portElementsCache;
        const newPorts = store.getNewPorts({
          state: graphStore.internalState,
          cellId: view.model.id as dia.Cell.ID,
          portElementsCache,
          portsData: cache.portsData,
        });
        cache.portsData = newPorts ?? {};

        graphStore.schedulePaperUpdate();
      },
    });

    const hasRenderLink = renderLink !== undefined;
    this.ReactLinkView = dia.LinkView.extend({
      // renderMarkup() {},
      onRender() {
        // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
        const view: dia.LinkView = this;
        const linkId = view.model.id as dia.Cell.ID;

        cache.linkViews = {
          ...cache.linkViews,
          [linkId]: view,
        };
        // Flush pending updates to ensure labels are synced before rendering
        graphStore.flushPendingUpdates();
        graphStore.schedulePaperUpdate();
      },
      renderLabels() {
        // Call parent implementation to render labels
        // @ts-expect-error renderLabels exists on LinkView but not in types
        dia.LinkView.prototype.renderLabels.call(this);

        // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
        const view: dia.LinkView = this;
        const linkId = view.model.id as dia.Cell.ID;
        const link = view.model;
        // @ts-expect-error we use private jointjs api
        const labelCache: Record<number, SVGElement> = view._labelCache;
        // @ts-expect-error we use private jointjs api
        const labelSelectors: Record<number, Record<string, SVGElement>> = view._labelSelectors;

        if (!labelCache || !labelSelectors) {
          return this;
        }

        const newLinksData = { ...cache.linksData };
        let isChanged = false;

        // Get all existing label IDs for this link
        const existingLabelIds = new Set<string>();
        for (const labelId in cache.linksData) {
          if (labelId.startsWith(`${linkId}-label-`)) {
            existingLabelIds.add(labelId);
          }
        }

        // Update or add entries for current labels
        // Get labels from the link model to check for React labels (those with labelId)
        const linkLabels = link.isLink() ? link.labels() : [];
        for (const labelIndex in labelCache) {
          const index = Number.parseInt(labelIndex, 10);
          const label = linkLabels[index];

          // Only process React labels (those with labelId property)
          if (!label || !('labelId' in label)) {
            continue;
          }

          // Use the label container element directly from labelCache
          const portalElement = labelCache[index];
          if (!portalElement) {
            continue;
          }

          const linkLabelId = store.getLinkLabelId(linkId, index);
          existingLabelIds.delete(linkLabelId);

          if (util.isEqual(newLinksData[linkLabelId], portalElement)) {
            continue;
          }
          if (!portalElement.isConnected) {
            continue;
          }
          isChanged = true;
          // Use the label container element directly as the portal target
          newLinksData[linkLabelId] = portalElement;
        }

        // Remove entries for labels that no longer exist
        // Clean up orphaned entries that are not in the current labelCache
        // Only skip cleanup if link has labels but cache is empty (labels are still rendering)
        if (existingLabelIds.size > 0) {
          const hasRenderedLabels = Object.keys(labelCache).length > 0;
          const linkHasLabels = link.isLink() && link.labels().length > 0;
          // Clean up if labels are rendered OR link has no labels (safe to clean up)
          if (hasRenderedLabels || !linkHasLabels) {
            for (const removedLabelId of existingLabelIds) {
              // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
              delete newLinksData[removedLabelId];
            }
            isChanged = true;
          }
        }

        if (isChanged && !util.isEqual(cache.linksData, newLinksData)) {
          cache.linksData = newLinksData;
          graphStore.schedulePaperUpdate();
        }

        return this;
      },
    });
    // Create a new JointJS Paper with the provided options

    const { ReactElementView, ReactLinkView } = this;
    this.paper = new dia.Paper({
      async: true,
      sorting: dia.Paper.sorting.APPROX,
      preventDefaultBlankAction: false,
      frozen: true,
      model: graph,
      elementView: (element) => {
        if (hasRenderElement && element.get('type') === REACT_TYPE) {
          return ReactElementView;
        }
        return undefined as unknown as typeof dia.ElementView;
      },
      linkView: () => {
        if (hasRenderLink) {
          return ReactLinkView;
        }
        return undefined as unknown as typeof dia.LinkView;
      },
      // 👇 override to always allow connection
      validateConnection: () => true,
      // 👇 also, allow links to start or end on empty space
      validateMagnet: () => true,
      ...paperOptions,
      viewManagement: paperOptions.viewManagement ?? true,
      clickThreshold: paperOptions.clickThreshold ?? DEFAULT_CLICK_THRESHOLD,
    });

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
        throw new Error(
          `Portal element not found for port id: ${portId} via ${PORTAL_SELECTOR} selector`
        );
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
}
