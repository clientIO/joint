import type { dia, routers, connectors as connectorTypes } from '@joint/core';
import { anchors, connectionPoints, connectors as connectorFns, routers as routerFns } from '@joint/core';

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


const USE_MODEL_GEOMETRY = { useModelGeometry: true } as const;

/**
 * Anchor that uses `center` with model geometry for the root element and ports,
 * and plain `center` (DOM-measured) for custom magnets.
 */
const modelCenterAnchor: anchors.Anchor = (
  elementView, magnet, ref, _, endType, linkView
) => {
  if (magnet === elementView.el || magnet.getAttribute('port')) {
    return anchors.center(elementView, magnet, ref, USE_MODEL_GEOMETRY, endType, linkView);
  }
  return anchors.center(elementView, magnet, ref, _, endType, linkView);
};

/** Mode for the `midSide` anchor used on root elements and custom magnets. */
export type AnchorMode = 'prefer-horizontal' | 'prefer-vertical' | 'horizontal' | 'vertical' | 'auto';

/**
 * Creates an anchor function that chooses the anchor position based on the magnet type:
 * - Root element → `midSide` with model geometry and the given `mode`.
 * - Port magnet → `center` with model geometry.
 * - Other magnets → `midSide` (DOM-based).
 * @param mode - The `midSide` mode. Default: `undefined` (midSide default).
 */
export function smartAnchor(mode: AnchorMode = 'auto', sourceOffset = 0, targetOffset = 0): anchors.Anchor {
  return (elementView, magnet, ref, _, endType, linkView) => {
    const padding = endType === 'source' ? sourceOffset : targetOffset;
    const rootArgs = { useModelGeometry: true, rotate: true, mode, padding };
    if (magnet === elementView.el) {
      return anchors.midSide(elementView, magnet, ref, rootArgs, endType, linkView);
    }
    if (magnet.getAttribute('port')) {
      return anchors.center(elementView, magnet, ref, USE_MODEL_GEOMETRY, endType, linkView);
    }
    const magnetArgs = { mode, rotate: true, padding } as anchors.MidSideAnchorArguments;
    return anchors.midSide(elementView, magnet, ref, magnetArgs, endType, linkView);
  };
}

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
    // The connection point is the anchor itself
    // (already on the boundary of the port / magnet)
    return endPathSegmentLine.end.clone();
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

/**
 * Wraps a router so it falls back to straight-line routing when either end
 * of the link is a point (not connected to an element), e.g. while dragging.
 * @param router - The router function to wrap.
 * @returns A router that delegates to `router` when both ends are connected,
 *          or returns vertices unchanged (straight line) when an end is a point.
 */
export function straightRouterUntilConnected(router: routers.Router): routers.Router {
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
/**
 * Wraps a connector so it falls back to the `straight` connector while dragging
 * (when either end is not connected to an element).
 * @param connector - The connector function to wrap.
 */
export function straightConnectorUntilConnected(connector: connectorTypes.Connector): connectorTypes.Connector {
  return (sourcePoint, targetPoint, routePoints, args, linkView) => {
    if (!linkView || !linkView.model.getSourceCell() || !linkView.model.getTargetCell()) {
      return connectorFns.straight(sourcePoint, targetPoint, routePoints, {}, linkView);
    }
    return connector(sourcePoint, targetPoint, routePoints, args, linkView);
  };
}

/**
 * Wraps an anchor so it falls back to `modelCenterAnchor` while dragging.
 */
function centerAnchorUntilConnected(anchor: anchors.Anchor): anchors.Anchor {
  return (elementView, magnet, ref, opt, endType, linkView) => {
    const link = linkView.model;
    if (!link.getSourceCell() || !link.getTargetCell()) {
      return modelCenterAnchor(elementView, magnet, ref, opt, endType, linkView);
    }
    return anchor(elementView, magnet, ref, opt, endType, linkView);
  };
}

export function boundaryUntilConnected(cp: connectionPoints.ConnectionPoint): connectionPoints.ConnectionPoint {
  return (endPathSegmentLine, endView, endMagnet, opt, endType, linkView) => {
    const link = linkView.model;
    if (!link.getSourceCell() || !link.getTargetCell()) {
      return connectionPoint(endPathSegmentLine, endView, endMagnet, opt, endType, linkView);
    }
    return cp.call(linkView, endPathSegmentLine, endView, endMagnet, opt, endType, linkView);
  };
}

/**
 * Ready-made Paper configurations for common link routing styles.
 * Each preset is a function that returns Paper props for router, connector,
 * anchor, and connection point. Call with no args for defaults, or pass
 * options to customize.
 * @example
 * ```tsx
 * import { orthogonalLinks } from '@joint/react/presets';
 *
 * const linkPreset = orthogonalLinks();
 * <Paper {...linkPreset} />
 * ```
 */

import type { PaperProps } from './components/paper/paper.types';

type LinkPreset = Pick<
  PaperProps,
  'defaultRouter' | 'defaultConnector' | 'defaultAnchor' | 'defaultConnectionPoint'
>;

interface BaseLinkOptions {
  /** Anchor mode for root elements and custom magnets. Passed to `midSide`. */
  readonly mode?: AnchorMode;
  /** Offset (in px) applied to the connection point at the source end. Default: `0`. */
  readonly sourceOffset?: number;
  /** Offset (in px) applied to the connection point at the target end. Default: `0`. */
  readonly targetOffset?: number;
  /** Use straight-line routing while dragging (when an end is not connected). Default: `true`. */
  readonly straightWhenDisconnected?: boolean;
}

/**
 * Wraps a connection point function and applies per-end offsets to the result.
 */
function withOffsets(
  cp: connectionPoints.ConnectionPoint,
  sourceOffset: number,
  targetOffset: number,
): connectionPoints.ConnectionPoint {
  if (sourceOffset === 0 && targetOffset === 0) return cp;
  return (endPathSegmentLine, endView, endMagnet, opt, endType, linkView) => {
    const point = cp(endPathSegmentLine, endView, endMagnet, opt, endType, linkView);
    const offset = endType === 'source' ? sourceOffset : targetOffset;
    if (offset === 0) return point;
    const ref = endPathSegmentLine.start;
    return point.move(ref, -offset);
  };
}

export interface StraightLinksOptions extends BaseLinkOptions {}

/**
 * Direct (straight-line) links between elements.
 * The shortest path with no routing — a single line from source to target.
 */
export function straightLinks(options: StraightLinksOptions = {}): LinkPreset {
  const { sourceOffset = 0, targetOffset = 0 } = options;
  return {
    defaultRouter: { name: 'normal' },
    defaultConnector: { name: 'straight' },
    defaultAnchor: modelCenterAnchor,
    defaultConnectionPoint: withOffsets(connectionPoint, sourceOffset, targetOffset),
  };
}

export interface OrthogonalLinksOptions extends BaseLinkOptions {
  /** Corner style. Default: `'cubic'`. */
  readonly cornerType?: 'point' | 'cubic' | 'line' | 'gap';
  /** Corner radius for the rounded connector (in px). Default: `8`. */
  readonly cornerRadius?: number;
}

/**
 * Orthogonal (right-angle) links between elements.
 * Routes links with horizontal and vertical segments only, avoiding element overlap.
 */
const rightAngleRouter: routers.Router = (vertices, _args, linkView) =>
  routerFns.rightAngle(vertices, { useVertices: true }, linkView);

export function orthogonalLinks(options: OrthogonalLinksOptions = {}): LinkPreset {
  const {
    cornerType = 'cubic',
    cornerRadius = 8,
    mode,
    sourceOffset = 0,
    targetOffset = 0,
    straightWhenDisconnected = true,
  } = options;

  if (straightWhenDisconnected) {
    return {
      defaultRouter: straightRouterUntilConnected(rightAngleRouter),
      defaultConnector: { name: 'straight', args: { cornerType, cornerRadius } },
      defaultAnchor: centerAnchorUntilConnected(smartAnchor(mode)),
      defaultConnectionPoint: withOffsets(boundaryUntilConnected(outwardsConnectionPoint), sourceOffset, targetOffset),
    };
  }

  return {
    defaultRouter: rightAngleRouter,
    defaultConnector: { name: 'straight', args: { cornerType, cornerRadius } },
    defaultAnchor: smartAnchor(mode),
    defaultConnectionPoint: withOffsets(outwardsConnectionPoint, sourceOffset, targetOffset),
  };
}

export interface CurvedLinksOptions extends BaseLinkOptions {}

/**
 * Smooth curved links between elements.
 * Renders links as bezier curves for a softer, more organic look.
 */
const outwardsCurveConnector: connectorTypes.Connector = (sourcePoint, targetPoint, routePoints, _args, linkView) =>
  connectorFns.curve(sourcePoint, targetPoint, routePoints, {
    sourceDirection: connectorFns.curve.TangentDirections.OUTWARDS,
    targetDirection: connectorFns.curve.TangentDirections.OUTWARDS,
  }, linkView);

export function curvedLinks(options: CurvedLinksOptions = {}): LinkPreset {
  const { mode, sourceOffset = 0, targetOffset = 0, straightWhenDisconnected = true } = options;

  if (straightWhenDisconnected) {
    return {
      defaultRouter: { name: 'normal' },
      defaultConnector: straightConnectorUntilConnected(outwardsCurveConnector),
      defaultAnchor: centerAnchorUntilConnected(smartAnchor(mode, sourceOffset, targetOffset)),
      defaultConnectionPoint: boundaryUntilConnected(outwardsConnectionPoint),
    };
  }

  return {
    defaultRouter: { name: 'normal' },
    defaultConnector: outwardsCurveConnector,
    defaultAnchor: smartAnchor(mode, sourceOffset, targetOffset),
    defaultConnectionPoint: outwardsConnectionPoint,
  };
}
