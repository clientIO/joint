import type { routers } from '@joint/core';
import { routers as routerFns } from '@joint/core';
import { getMarkerLength } from './utils';

/**
 * Creates a right-angle router with `useVertices: true`.
 * @param margin - distance kept from elements.
 * @param minPathMargin - minimum path margin used by the underlying router.
 */
export function rightAngleRouter(margin: number = 0, minPathMargin: number = 0): routers.Router {
  return (vertices, _args, linkView) => {
    const sourceMarkerLength = getMarkerLength(linkView!, 'source');
    const targetMarkerLength = getMarkerLength(linkView!, 'target');
    const effectiveSourceMargin = Math.max(margin - sourceMarkerLength, 0);
    const effectiveTargetMargin = Math.max(margin - targetMarkerLength, 0);
    return routerFns.rightAngle(vertices, {
      useVertices: true,
      sourceMargin: effectiveSourceMargin,
      targetMargin: effectiveTargetMargin,
      minPathMargin,
    }, linkView);
  };
}
