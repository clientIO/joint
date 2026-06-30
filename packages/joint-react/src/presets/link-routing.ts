import { connectionPoints, type dia } from '@joint/core';
import type { LinkMode } from './anchors';
import { centerAnchor, perpendicularAnchor, midSideAnchor } from './anchors';
import { boundaryPoint, anchorPoint, withOffsets } from './connection-points';
import { outwardsCurveConnector } from './connectors';
import { rightAngleRouter } from './routers';
import {
  straightRouterUntilConnected,
  straightConnectorUntilConnected,
  anchorWhenConnected,
  connectionPointWhenConnected,
} from './wrappers';

/**
 * Bundle of paper-level link defaults (router, connector, anchor, connection point)
 * produced by a routing preset like {@link linkRoutingStraight} or
 * {@link linkRoutingOrthogonal}.
 * @group Types
 */
export interface LinkRouting {
  /** Paper-level default router this preset installs for links that don't set their own. */
  readonly defaultRouter?: dia.Paper.Options['defaultRouter'];
  /** Paper-level default connector that draws the routed points into the link's path. */
  readonly defaultConnector?: dia.Paper.Options['defaultConnector'];
  /** Paper-level default anchor that decides where on an element each link end attaches. */
  readonly defaultAnchor?: dia.Paper.Options['defaultAnchor'];
  /** Paper-level default connection point where the link meets the element boundary. */
  readonly defaultConnectionPoint?: dia.Paper.Options['defaultConnectionPoint'];
}

interface BaseLinkOptions {
  /** Which side of an element or port each link end attaches to; see {@link LinkMode} for how each value behaves. @default 'auto' */
  readonly mode?: LinkMode;
  /** Offset (in px) applied to the connection point at the source end. @default 0 */
  readonly sourceOffset?: number;
  /** Offset (in px) applied to the connection point at the target end. @default 0 */
  readonly targetOffset?: number;
  /** Fall back to a straight line while either end is still unconnected (e.g. mid-drag). @default true */
  readonly straightWhenDisconnected?: boolean;
  /** The attrs selector that holds the marker definitions. @default 'line' */
  readonly markerSelector?: string;
}

/**
 * Options for {@link linkRoutingStraight}.
 * @remarks The inherited `mode` and `straightWhenDisconnected` options have no
 * effect on straight routing; they apply only to {@link linkRoutingOrthogonal}
 * and {@link linkRoutingSmooth}.
 * @group Types
 * @expand
 */
export interface LinkRoutingStraightOptions extends BaseLinkOptions {
  /** Corner style applied at manual vertices. @default 'point' */
  readonly cornerType?: 'point' | 'cubic' | 'line' | 'gap';
  /** Corner radius at vertices, in px. @default 0 */
  readonly cornerRadius?: number;
  /** Anchor links perpendicular to the element edge instead of at its center. @default false */
  readonly perpendicular?: boolean;
}

/**
 * Straight-line routing: links are drawn as a direct line from source to target,
 * with no obstacle avoidance. The simplest, lowest-overhead routing.
 *
 * Returns a `LinkRouting` bundle for the {@link Paper} `linkRouting` prop that
 * sets the paper's router, connector, anchor, and connection point in one step.
 * For other looks, reach for {@link linkRoutingOrthogonal} (right-angle segments
 * that steer around elements) or {@link linkRoutingSmooth} (curved links).
 * @param options - overrides for corner style, anchor, and connection-point offsets
 * @returns Paper link defaults for straight routing
 * @example
 * ```tsx
 * import { Paper, linkRoutingStraight } from '@joint/react';
 *
 * <Paper linkRouting={linkRoutingStraight()} />
 * ```
 * @group Presets
 */
export function linkRoutingStraight(options: LinkRoutingStraightOptions = {}): LinkRouting {
  const {
    sourceOffset = 0,
    targetOffset = 0,
    cornerType = 'point',
    cornerRadius = 0,
    perpendicular = false,
    markerSelector,
  } = options;
  return {
    defaultRouter: { name: 'normal' },
    defaultConnector: {
      name: 'straight',
      args: { cornerType, cornerRadius, cornerPreserveAspectRatio: true },
    },
    defaultAnchor: perpendicular ? perpendicularAnchor : centerAnchor,
    defaultConnectionPoint: withOffsets(boundaryPoint, sourceOffset, targetOffset, markerSelector),
  };
}

/**
 * Options for {@link linkRoutingOrthogonal}.
 * @group Types
 * @expand
 */
export interface LinkRoutingOrthogonalOptions extends BaseLinkOptions {
  /** Corner style at each bend. @default 'cubic' */
  readonly cornerType?: 'point' | 'cubic' | 'line' | 'gap';
  /** Corner radius of the rounded bends, in px. @default 8 */
  readonly cornerRadius?: number;
  /** Distance, in px, the route keeps clear of elements as it steers around them. @default 20 */
  readonly margin?: number;
  /** Smallest distance, in px, the router travels before it can turn. @default margin / 4 */
  readonly minPathMargin?: number;
}

/**
 * Orthogonal routing: links travel in horizontal and vertical segments only and
 * steer around elements, the right-angle look common in flowcharts and ER
 * diagrams.
 *
 * Returns a `LinkRouting` bundle for the {@link Paper} `linkRouting` prop.
 * @param options - overrides for corner style/radius, routing margins, and anchors
 * @returns Paper link defaults for orthogonal routing
 * @example
 * ```tsx
 * import { Paper, linkRoutingOrthogonal } from '@joint/react';
 *
 * // round the bends and keep links 24px clear of elements
 * <Paper linkRouting={linkRoutingOrthogonal({ cornerRadius: 12, margin: 24 })} />
 * ```
 * @group Presets
 */
export function linkRoutingOrthogonal(options: LinkRoutingOrthogonalOptions = {}): LinkRouting {
  const {
    cornerType = 'cubic',
    cornerRadius = 8,
    mode,
    sourceOffset = 0,
    targetOffset = 0,
    straightWhenDisconnected = true,
    margin = 20,
    minPathMargin = margin / 4,
    markerSelector,
  } = options;

  const router = rightAngleRouter(margin, minPathMargin);

  if (straightWhenDisconnected) {
    return {
      defaultRouter: straightRouterUntilConnected(router),
      defaultConnector: {
        name: 'straight',
        args: { cornerType, cornerRadius, cornerPreserveAspectRatio: true },
      },
      defaultAnchor: anchorWhenConnected(
        midSideAnchor(mode, sourceOffset, targetOffset, markerSelector),
        centerAnchor
      ),
      defaultConnectionPoint: connectionPointWhenConnected(
        anchorPoint,
        withOffsets(boundaryPoint, sourceOffset, targetOffset, markerSelector)
      ),
    };
  }

  return {
    defaultRouter: router,
    defaultConnector: {
      name: 'straight',
      args: { cornerType, cornerRadius, cornerPreserveAspectRatio: true },
    },
    defaultAnchor: midSideAnchor(mode, sourceOffset, targetOffset, markerSelector),
    defaultConnectionPoint: anchorPoint,
  };
}

/**
 * Options for {@link linkRoutingSmooth}.
 * @group Types
 * @expand
 */
export interface LinkRoutingSmoothOptions extends BaseLinkOptions {}

/**
 * Smooth routing: links are drawn as soft bezier curves instead of straight or
 * right-angle segments, for a more organic look.
 *
 * Returns a `LinkRouting` bundle for the {@link Paper} `linkRouting` prop.
 * @param options - overrides for anchor and connection-point offsets
 * @returns Paper link defaults for smooth routing
 * @example
 * ```tsx
 * import { Paper, linkRoutingSmooth } from '@joint/react';
 *
 * <Paper linkRouting={linkRoutingSmooth()} />
 * ```
 * @group Presets
 */
export function linkRoutingSmooth(options: LinkRoutingSmoothOptions = {}): LinkRouting {
  const {
    mode,
    sourceOffset = 0,
    targetOffset = 0,
    straightWhenDisconnected = true,
    markerSelector,
  } = options;

  if (straightWhenDisconnected) {
    return {
      defaultRouter: { name: 'normal' },
      defaultConnector: straightConnectorUntilConnected(outwardsCurveConnector),
      defaultAnchor: anchorWhenConnected(
        midSideAnchor(mode, sourceOffset, targetOffset, markerSelector),
        centerAnchor
      ),
      defaultConnectionPoint: connectionPointWhenConnected(
        connectionPoints.anchor as connectionPoints.ConnectionPoint,
        withOffsets(boundaryPoint, sourceOffset, targetOffset, markerSelector)
      ),
    };
  }

  return {
    defaultRouter: { name: 'normal' },
    defaultConnector: outwardsCurveConnector,
    defaultAnchor: midSideAnchor(mode, sourceOffset, targetOffset, markerSelector),
    defaultConnectionPoint: { name: 'anchor' },
  };
}
