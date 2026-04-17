import type { dia } from '@joint/core';
import { g } from '@joint/core';

/**
 * Default measureNode function that uses the model's bounding box for the root element node.
 * For sub-nodes (e.g. referenced by selectors), we use the actual SVG bounding box measurement.
 * @param node - The SVG element node to measure
 * @param view - The cell view containing the node
 * @returns A rectangle representing the measured bounds of the node.
 */
export const measureNode: dia.Paper.MeasureNodeCallback = (node, view): g.Rect => {

  // For the root node of an element, we can use the model's bounding box,
  // which is more performant and works even if the element is not visible
  // or attached to the DOM.
  if (node === view.el && view.model.isElement()) {
    const { width, height } = view.model.size();
    return new g.Rect({ width, height, x: 0, y: 0 });
  }

  // For sub-nodes and links, use the DOM bounding box measurement.
  return view.measureNodeBoundingRect(node);
};
