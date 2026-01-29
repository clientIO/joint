import type { dia } from '@joint/core';

interface Options {
  readonly graph: dia.Graph;
  readonly paper: dia.Paper;
  readonly cellId: dia.Cell.ID;
}

/**
 * Clear the view of the cell and the links connected to it.
 * @internal
 * @group Utils
 * @description This function is used to clear the view of the cell and the links connected to it.
 * It is used to ensure that the view is recalculated and the links are updated.
 *
 * NOTE: For internal React components, prefer using graphStore.scheduleClearView()
 * which batches multiple calls for the same cell, improving performance when
 * multiple ports exist on a single node.
 * @param options - The options for the clear view.
 */
export function clearView(options: Options) {
  const { graph, paper, cellId } = options;
  const elementView = paper.findViewByModel(cellId);
  elementView.cleanNodesCache();
  for (const link of graph.getConnectedLinks(elementView.model)) {
    const target = link.target();
    const source = link.source();
    const isElementLink = target.id === cellId || source.id === cellId;
    if (!isElementLink) {
      continue;
    }

    const linkView = link.findView(paper);
    // @ts-expect-error we use private jointjs api method, it throw error here.
    linkView._sourceMagnet = null;
    // @ts-expect-error we use private jointjs api method, it throw error here.
    linkView._targetMagnet = null;
    // @ts-expect-error we use private jointjs api method, it throw error here.
    linkView.requestConnectionUpdate({ async: false });
  }
}
