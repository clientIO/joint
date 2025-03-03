import { dia, shapes } from '@joint/core';
import {
  isBaseElement,
  isBaseLink,
  isReactElement,
  type BaseElement,
  type BaseLink,
} from '../../types/cell.types';
import { ReactElement } from '../../models/react-element';

/**
 * Updating of graph cells inside use graph store - helper function
 */
export function setCells(options: {
  graph: dia.Graph;
  defaultLinks?: Array<dia.Link | BaseLink>;
  defaultElements?: (dia.Element | BaseElement)[];
}) {
  const { graph, defaultElements, defaultLinks } = options;
  if (defaultLinks !== undefined) {
    graph.addCells(
      defaultLinks.map((link) => {
        if (isBaseLink(link)) {
          return new shapes.standard.Link({
            ...link,
            source: { id: link.source },
            target: { id: link.target },
          });
        }
        return link;
      })
    );
  }
  if (defaultElements !== undefined) {
    graph.addCells(
      defaultElements.map((element) => {
        if (isBaseElement(element)) {
          if (isReactElement(element)) {
            return new ReactElement({
              position: { x: element.x, y: element.y },
              size: { width: element.width, height: element.height },
              ...element,
            });
          }
          return new dia.Cell({
            type: element.type ?? 'react',
            position: { x: element.x, y: element.y },
            size: { width: element.width, height: element.height },
            ...element,
          });
        }
        return element;
      })
    );
  }
}
