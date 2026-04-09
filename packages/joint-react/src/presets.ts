import type { dia, routers } from '@joint/core';
import { anchors, connectionPoints, connectors, routers as routerFns } from '@joint/core';

/**
 * Default connection point function for React-rendered elements.
 *
 * Uses `rectangle` (model geometry) for:
 * - The root element (portal wrapper)
 * - Default port magnets (elements with a `port` attribute)
 *
 * Uses `boundary` for custom sub-elements registered via `selectorRef`.
 * @param endPathSegmentLine - The line segment approaching the end element
 * @param endView - The view of the end element
 * @param endMagnet - The SVG element used as the connection magnet
 * @param _opt - Connection point options (unused)
 * @param endType - The type of the link end (source or target)
 * @param linkView - The view of the link being connected
 * @returns The point on the element where the link should connect.
 */
export const connectionPoint: connectionPoints.ConnectionPoint = (
  endPathSegmentLine,
  endView,
  endMagnet,
  _opt,
  endType,
  linkView,
) => {
  const rectangleArgs = { useModelGeometry: true } as connectionPoints.ConnectionPointArgumentsMap['rectangle'];
  if (endMagnet === endView.el || endMagnet.getAttribute('port')) {
    return connectionPoints.rectangle(endPathSegmentLine, endView, endMagnet, rectangleArgs, endType, linkView);
  }
  const boundaryArgs = {} as connectionPoints.ConnectionPointArgumentsMap['boundary'];
  return connectionPoints.boundary(endPathSegmentLine, endView, endMagnet, boundaryArgs, endType, linkView);
};


const USE_MODEL_GEOMETRY = {
  useModelGeometry: true,
  // mode: 'horizontal'
} as const;

/**
 * Anchor that uses `center` with model geometry for the root element and ports,
 * and plain `center` (DOM-measured) for other magnets.
 */
export const modelCenterAnchor: anchors.Anchor = (
  elementView, magnet, ref, _, endType, linkView
) => {
  if (magnet === elementView.el) {
    return anchors.midSide(elementView, magnet, ref, USE_MODEL_GEOMETRY, endType, linkView);
  }
  if (magnet.getAttribute('port')) {
    return anchors.center(elementView, magnet, ref, USE_MODEL_GEOMETRY, endType, linkView);
  }
  return anchors.center(elementView, magnet, ref, _, endType, linkView);
};

/**
 * Connection point that shifts the anchor outward from the element center for ports.
 * For non-port magnets, falls back to `rectangle` with model geometry.
 */
export const outwardsConnectionPoint: connectionPoints.ConnectionPoint = (
  endPathSegmentLine,
  endView,
  endMagnet,
  _opt,
  endType,
  linkView,
) => {
  const element = (endView as dia.ElementView).model as dia.Element;
  const portId = endMagnet.getAttribute('port');
  const port = portId && element.getPort(portId);

  if (!port) {
    if (endMagnet === endView.el) {
      return endPathSegmentLine.end.clone();
    }
    const rectangleArgs = { useModelGeometry: true } as connectionPoints.ConnectionPointArgumentsMap['rectangle'];
    return connectionPoints.rectangle(endPathSegmentLine, endView, endMagnet, rectangleArgs, endType, linkView);
  }

  const anchor = endPathSegmentLine.end.clone();
  const portBBox = element.getPortBBox(portId);
  const side = portBBox.sideNearestToPoint(element.getCenter());
  switch (side) {
    case 'left': { anchor.x += portBBox.width / 2; break; }
    case 'right': { anchor.x -= portBBox.width / 2; break; }
    case 'top': { anchor.y += portBBox.height / 2; break; }
    case 'bottom': { anchor.y -= portBBox.height / 2; break; }
    // No default
  }
  return anchor;
};

// export const outwardsAnchor: anchors.Anchor = (
//   elementView,
//   magnet,
//   ref,
//   _,
//   endType,
//   linkView
// ) => {

//   if (magnet === elementView.el) {
//     // For the root <g> element, use midSide with model geometry.
//     return anchors.midSide(elementView, magnet, ref, USE_MODEL_GEOMETRY, endType, linkView);
//   }
//   const element = elementView.model as dia.Element;
//   const portId = magnet.getAttribute('port');
//   const port = portId && element.getPort(portId);

//   if (!port) {
//     // Don't use model geometry here, because the DOM node needs to be measured.
//     return anchors.center(elementView, magnet, ref, _, endType, linkView);
//   }

//   const portBBox = element.getPortBBox(portId);
//   const anchorOptions: anchors.BBoxAnchorArguments = {
//     useModelGeometry: true,
//     dx: 0,
//     dy: 0,
//   };

//   const side = portBBox.sideNearestToPoint(element.getCenter());
//   switch (side) {
//     case 'left': {
//       anchorOptions.dx = portBBox.width / 2;
//       break;
//     }
//     case 'right': {
//       anchorOptions.dx = -portBBox.width / 2;
//       break;
//     }
//     case 'top': {
//       anchorOptions.dy = portBBox.height / 2;
//       break;
//     }
//     case 'bottom': {
//       anchorOptions.dy = -portBBox.height / 2;
//       break;
//     }
//     // No default
//   }

//   return anchors.center(elementView, magnet, ref, anchorOptions, endType, linkView);
// };

/**
 * Wraps a router so it falls back to straight-line routing when either end
 * of the link is a point (not connected to an element), e.g. while dragging.
 * @param router - The router function to wrap.
 * @returns A router that delegates to `router` when both ends are connected,
 *          or returns vertices unchanged (straight line) when an end is a point.
 */
export function directUntilConnected(router: routers.Router): routers.Router {
  return (vertices: dia.Point[], args: routers.RouterArguments | undefined, linkView?: dia.LinkView) => {
    if (!linkView) return vertices;
    const link = linkView.model;
    if (!link.getSourceCell() || !link.getTargetCell()) {
      return vertices;
    }
    return router(vertices, args, linkView);
  };
}

/**
 * Wraps a connection point so it falls back to the base `connectionPoint`
 * (rectangle for root/ports, boundary for the rest) while dragging
 * (when either end is not connected to an element).
 * @param cp - The connection point function to wrap.
 * @returns A connection point that delegates to `cp` when both ends are connected,
 *          or uses the base `connectionPoint` while dragging.
 */
export function boundaryUntilConnected(cp: connectionPoints.ConnectionPoint): connectionPoints.ConnectionPoint {
  return (endPathSegmentLine, endView, endMagnet, opt, endType, linkView) => {
    const link = linkView.model;
    if (!link.getSourceCell() || !link.getTargetCell()) {
      return connectionPoint(endPathSegmentLine, endView, endMagnet, opt, endType, linkView);
    }
    return cp(endPathSegmentLine, endView, endMagnet, opt, endType, linkView);
  };
}

/**
 * Ready-made Paper configurations for common link routing styles.
 * Spread a preset onto `<Paper>` to apply its router, connector, anchor,
 * and connection point settings.
 * @example
 * ```tsx
 * import { orthogonalLinks } from '@joint/react/presets';
 *
 * <Paper {...orthogonalLinks} />
 * ```
 */

import type { PaperProps } from './components/paper/paper.types';

type LinkPreset = Pick<
  PaperProps,
  'defaultRouter' | 'defaultConnector' | 'defaultAnchor' | 'defaultConnectionPoint'
>;

/**
 * Direct (straight-line) links between elements.
 * The shortest path with no routing — a single line from source to target.
 */
export const directLinks: LinkPreset = {
  defaultRouter: { name: 'normal' },
  defaultConnector: { name: 'straight' },
  defaultAnchor: { name: 'center' },
  defaultConnectionPoint: { name: 'boundary' },
};

/**
 * Orthogonal (right-angle) links between elements.
 * Routes links with horizontal and vertical segments only, avoiding element overlap.
 */
export const orthogonalLinks: LinkPreset = {
  defaultRouter: directUntilConnected(routerFns.rightAngle),
  defaultConnector: {
    name: 'straight',
    args: { cornerType: 'cubic', cornerRadius: 8 }
  },
  defaultAnchor: modelCenterAnchor,
  defaultConnectionPoint: boundaryUntilConnected(outwardsConnectionPoint)
};

/**
 * Smooth curved links between elements.
 * Renders links as bezier curves for a softer, more organic look.
 */
export const curveLinks: LinkPreset = {
  defaultRouter: { name: 'normal' },
  defaultConnector: {
    name: 'curve',
    args: {
      sourceDirection: 'outwards',
      targetDirection: 'outwards'
    }
  },
  defaultAnchor: modelCenterAnchor,
  defaultConnectionPoint: outwardsConnectionPoint
};
