import { dia } from '@joint/core';

// Event name for when the portal is ready
export type PortalEvent = 'portal:ready';
export const PAPER_PORTAL_RENDER_EVENT: PortalEvent = 'portal:ready';
// Interface for Paper options, extending JointJS Paper options
export interface PaperOptions extends dia.Paper.Options {
  readonly scale?: number;
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
  const { scale, ...restOptions } = options ?? {};

  const elementView = dia.ElementView.extend({
    onRender() {
      this.notify(PAPER_PORTAL_RENDER_EVENT, this.el);
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
