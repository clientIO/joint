import { dia, type Vectorizer } from '@joint/core';
import { PORTAL_SELECTOR } from 'src/components/port/port-item';

export type OnPaperRenderElement = (element: dia.Element, portalElement: SVGElement) => void;
export type OnPaperRenderPort = (portId: string, portalElement: SVGElement) => void;
// Interface for Paper options, extending JointJS Paper options
export interface PaperOptions extends dia.Paper.Options {
  readonly scale?: number;
  /**
   * A function that is called when the paper is ready.
   * @param element - The element that is being rendered
   * @param portalElement  - The portal element that is being rendered
   * @returns
   */
  readonly onRenderElement?: OnPaperRenderElement;
  readonly onRenderPort?: OnPaperRenderPort;
}

interface PortElementsCacheEntry {
  portElement: Vectorizer;
  portLabelElement?: Vectorizer | null;
  portSelectors: Record<string, SVGElement | SVGElement[]>;
  portLabelSelectors?: Record<string, SVGElement | SVGElement[]>;
  portContentElement: Vectorizer;
  portContentSelectors?: Record<string, SVGElement | SVGElement[]>;
}

/**
 * Function to create a new JointJS Paper
 * @group utils
 * @param graph - The graph instance to attach the paper to
 * @param options - The options to create the paper with
 * @returns The created paper instance
 * @example
 * ```ts
 * import { createPaper } from '@joint/react';
 * import { graph } from './graph';
 *
 * const paper = createPaper(graph, options);
 * ```
 */

export function createPaper(graph: dia.Graph, options?: PaperOptions) {
  const { scale, onRenderElement, onRenderPort, ...restOptions } = options ?? {};

  const elementView = dia.ElementView.extend({
    // Render element using react, `elementView.el` is used as portal gate for react (createPortal)
    onRender() {
      if (onRenderElement) {
        // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias, no-shadow, @typescript-eslint/no-shadow
        const elementView: dia.ElementView = this;
        onRenderElement(elementView.model, elementView.el as SVGGElement);
      }
    },
    // Render port using react, `portData.portElement.node` is used as portal gate for react (createPortal)
    _renderPorts() {
      // @ts-expect-error we use private jointjs api method, it throw error here.
      dia.ElementView.prototype._renderPorts.call(this);
      const portElementsCache: Record<string, PortElementsCacheEntry> = this._portElementsCache;
      // Example: log all rendered port elements
      for (const portId in portElementsCache) {
        const { portSelectors } = portElementsCache[portId];
        const portalElement = portSelectors[PORTAL_SELECTOR];
        if (onRenderPort && portalElement) {
          onRenderPort(portId, Array.isArray(portalElement) ? portalElement[0] : portalElement);
        }
      }
    },
  });

  // Create a new JointJS Paper with the provided options
  const paper = new dia.Paper({
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    preventDefaultBlankAction: false,
    // TODO: It is possible to override it. We need to instruct
    // the users to trigger the PORTAL_READY_EVENT event manually
    // or find a better way to do it (e.g. trigger the event in JointJS)
    elementView,
    ...restOptions,
    frozen: true,
    model: graph,
  });

  // Return the created paper
  if (scale) {
    paper.scale(scale);
  }
  return paper;
}
