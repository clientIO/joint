import { dia } from '@joint/core';
import type { PortElementsCacheEntry } from '../data/create-ports-data';

const DEFAULT_CLICK_THRESHOLD = 10;

export type OnPaperRenderElement = (element: dia.Element, portalElement: SVGElement) => void;
export type OnPaperRenderPorts = (
  cellId: dia.Cell.ID,
  portElementsCache: Record<string, PortElementsCacheEntry>
) => void;

type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K ? never : K]: T[K];
};

export type ReactPaperOptions = Omit<RemoveIndexSignature<dia.Paper.Options>, 'frozen'>;

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
  readonly onRenderPorts?: OnPaperRenderPorts;
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
  const { scale, onRenderElement, onRenderPorts, ...restOptions } = options ?? {};

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
      // This is firing when the ports are rendered (updated, inserted, removed)
      // @ts-expect-error we use private jointjs api method, it throw error here.
      dia.ElementView.prototype._renderPorts.call(this);
      // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias, no-shadow, @typescript-eslint/no-shadow
      const elementView: dia.ElementView = this;

      const portElementsCache: Record<string, PortElementsCacheEntry> = this._portElementsCache;
      if (!onRenderPorts) {
        return;
      }
      onRenderPorts(elementView.model.id, portElementsCache);
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
    clickThreshold: restOptions?.clickThreshold ?? DEFAULT_CLICK_THRESHOLD,
    frozen: true,
    model: graph,
  });

  // Return the created paper
  if (scale) {
    paper.scale(scale);
  }
  return paper;
}
