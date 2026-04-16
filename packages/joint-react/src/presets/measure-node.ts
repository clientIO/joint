import type { dia } from '@joint/core';
import { g, V } from '@joint/core';

/**
 * Default measureNode function that uses the model's bounding box for the root element node.
 * For sub-nodes (e.g. referenced by selectors), we use the actual SVG bounding box measurement.
 * @param node - The SVG element node to measure
 * @param view - The cell view containing the node
 * @returns A rectangle representing the measured bounds of the node.
 */
export const measureNode: dia.Paper.MeasureNodeCallback = (node, view): g.Rect => {

  if (node === view.el && view.model.isElement()) {
    const size = view.model.size();
    return new g.Rect({ width: size.width, height: size.height, x: 0, y: 0 });
  }

  // For sub-nodes and links, use the SVG bounding box measurement.
  return V(node).getBBox();
};
