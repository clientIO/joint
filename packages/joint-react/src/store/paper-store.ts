import { dia, util, type Vectorizer } from '@joint/core';
import type { OverWriteResult } from '../context';
import type { RenderElement } from '../components';
import type { GraphElement } from '../types/element-types';
import type { GraphState, GraphStore } from './graph-store';
import type { GraphLink } from '../types/link-types';
import { createScheduler } from '../utils/scheduler';

const DEFAULT_CLICK_THRESHOLD = 10;
export const PORTAL_SELECTOR = 'react-port-portal';

export interface PortElementsCacheEntry {
  portElement: Vectorizer;
  portLabelElement?: Vectorizer | null;
  portSelectors: Record<string, SVGElement | SVGElement[]>;
  portLabelSelectors?: Record<string, SVGElement | SVGElement[]>;
  portContentElement: Vectorizer;
  portContentSelectors?: Record<string, SVGElement | SVGElement[]>;
}

export interface AddPaperOptions<
  Graph extends dia.Graph = dia.Graph,
  Element extends GraphElement = GraphElement,
  Link extends GraphLink = GraphLink,
> {
  readonly paperOptions: dia.Paper.Options;
  readonly overWrite?: (paperStore: PaperStore<Graph, Element, Link>) => OverWriteResult;
  readonly paperElement: HTMLElement | SVGElement;
  readonly scale?: number;
  readonly renderElement?: RenderElement<GraphElement>;
}

export interface PaperStoreOptions<
  Graph extends dia.Graph = dia.Graph,
  Element extends GraphElement = GraphElement,
  Link extends GraphLink = GraphLink,
> extends AddPaperOptions<Graph, Element, Link> {
  readonly graphStore: GraphStore<Graph, Element, Link>;
  readonly id: string;
}

export interface PaperStoreSnapshot {
  paperElementViews?: Record<dia.Cell.ID, dia.ElementView>;
  portsData?: Record<string, SVGElement>;
}

export class PaperStore<
  Graph extends dia.Graph = dia.Graph,
  Element extends GraphElement = GraphElement,
  Link extends GraphLink = GraphLink,
> {
  public paper: dia.Paper;
  public paperId: string;
  public overWriteResultRef?: OverWriteResult;
  private renderElement?: RenderElement<GraphElement>;

  constructor(options: PaperStoreOptions<Graph, Element, Link>) {
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
    const elementView = dia.ElementView.extend({
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
    this.paper = new dia.Paper({
      async: true,
      sorting: dia.Paper.sorting.APPROX,
      preventDefaultBlankAction: false,
      frozen: true,
      model: graph,
      elementView,
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
    overWrite?: (ctx: PaperStore<Graph, Element, Link>) => OverWriteResult;
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

  public getPortId(cellId: dia.Cell.ID, portId: string) {
    return `${cellId}-${portId}`;
  }
}
