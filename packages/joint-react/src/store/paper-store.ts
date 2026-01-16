import { dia, util, type Vectorizer } from '@joint/core';
import type { OverWriteResult } from '../context';
import type { RenderElement } from '../components';
import type { GraphElement } from '../types/element-types';
import type { GraphState, GraphStore } from './graph-store';
import { createScheduler } from '../utils/scheduler';
import { REACT_TYPE } from '../models/react-element';

const DEFAULT_CLICK_THRESHOLD = 10;
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

  public ReactElementView: typeof dia.ElementView;

  constructor(options: PaperStoreOptions) {
    const {
      graphStore,
      paperOptions = {},
      overWrite,
      paperElement,
      scale,
      renderElement,
      id,
    } = options;
    const { width, height } = paperOptions;
    const { graph } = graphStore;
    this.paperId = id;
    this.renderElement = renderElement;
    const cache: {
      portsData: Record<string, SVGElement>;
      elementViews: Record<dia.Cell.ID, dia.ElementView>;
    } = {
      portsData: {},
      elementViews: {},
    };
    const scheduler = createScheduler(() => {
      graphStore.updatePaperSnapshot(options.id, (current) => {
        return {
          ...current,
          portsData: cache.portsData,
          paperElementViews: cache.elementViews,
        };
      });
    });
    // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
    const store = this;

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
        scheduler();
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

        scheduler();
      },
    });
    // Create a new JointJS Paper with the provided options

    const { ReactElementView } = this;
    this.paper = new dia.Paper({
      async: true,
      sorting: dia.Paper.sorting.APPROX,
      preventDefaultBlankAction: false,
      frozen: true,
      model: graph,
      elementView: (element) => {
        if (element.get('type') === REACT_TYPE) {
          return ReactElementView;
        }
        return undefined as unknown as typeof dia.ElementView;
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
}
