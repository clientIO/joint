import { connectionPoints } from '@joint/core';
import type { PaperProps } from '../components/paper/paper.types';
import type { LinkMode } from './anchors';
import { centerAnchor, perpendicularAnchor, midSideAnchor } from './anchors';
import { boundaryPoint, anchorPoint, withOffsets } from './connection-points';
import { rightAngleRouter, outwardsCurveConnector } from './connectors';
import {
  straightRouterUntilConnected,
  straightConnectorUntilConnected,
  anchorWhenConnected,
  connectionPointWhenConnected,
} from './wrappers';

/**
 * Ready-made Paper configurations for common link routing styles.
 * Each preset is a function that returns Paper props for router, connector,
 * anchor, and connection point. Call with no args for defaults, or pass
 * options to customize.
 * @example
 * ```tsx
 * import { linkRoutingOrthogonal } from '@joint/react/presets';
 *
 * const linkPreset = linkRoutingOrthogonal();
 * <Paper {...linkPreset} />
 * ```
 */

export type LinkRouting = Pick<
  PaperProps,
  'defaultRouter' | 'defaultConnector' | 'defaultAnchor' | 'defaultConnectionPoint'
>;

interface BaseLinkOptions {
  /** Anchor mode for root elements and custom magnets. Passed to `midSide`. */
  readonly mode?: LinkMode;
  /** Offset (in px) applied to the connection point at the source end. Default: `0`. */
  readonly sourceOffset?: number;
  /** Offset (in px) applied to the connection point at the target end. Default: `0`. */
  readonly targetOffset?: number;
  /** Use straight-line routing when an end is not connected. Default: `true`. */
  readonly straightWhenDisconnected?: boolean;
  /** The attrs selector that holds the marker definitions. Default: `'line'`. */
  readonly markerSelector?: string;
}

export interface LinkRoutingStraightOptions extends BaseLinkOptions {
  /** Corner style at vertices. Default: `'point'`. */
  readonly cornerType?: 'point' | 'cubic' | 'line' | 'gap';
  /** Corner radius at vertices (in px). Default: `0`. */
  readonly cornerRadius?: number;
  /** Use perpendicular anchor instead of center. Default: `false`. */
  readonly perpendicular?: boolean;
}

/**
 * Straight-line links between elements.
 * The shortest path with no routing — a single line from source to target.
 * @param options
 */
export function linkRoutingStraight(options: LinkRoutingStraightOptions = {}): LinkRouting {
  const { sourceOffset = 0, targetOffset = 0, cornerType = 'point', cornerRadius = 0, perpendicular = false, markerSelector } = options;
  return {
    defaultRouter: { name: 'normal' },
    defaultConnector: {
      name: 'straight',
      args: { cornerType, cornerRadius, cornerPreserveAspectRatio: true }
    },
    defaultAnchor: perpendicular ? perpendicularAnchor : centerAnchor,
    defaultConnectionPoint: withOffsets(boundaryPoint, sourceOffset, targetOffset, markerSelector),
  };
}

export interface LinkRoutingOrthogonalOptions extends BaseLinkOptions {
  /** Corner style. Default: `'cubic'`. */
  readonly cornerType?: 'point' | 'cubic' | 'line' | 'gap';
  /** Corner radius for the rounded connector (in px). Default: `8`. */
  readonly cornerRadius?: number;
  /** Minimum distance (in px) the link keeps from elements when routing. */
  readonly margin?: number;
}

/**
 * Orthogonal (right-angle) links between elements.
 * Routes links with horizontal and vertical segments only, avoiding element overlap.
 * @param options
 */
export function linkRoutingOrthogonal(options: LinkRoutingOrthogonalOptions = {}): LinkRouting {
  const {
    cornerType = 'cubic',
    cornerRadius = 8,
    mode,
    sourceOffset = 0,
    targetOffset = 0,
    straightWhenDisconnected = true,
    margin,
    markerSelector,
  } = options;
  const router = rightAngleRouter(margin);

  if (straightWhenDisconnected) {
    return {
      defaultRouter: straightRouterUntilConnected(router),
      defaultConnector: {
        name: 'straight',
        args: { cornerType, cornerRadius, cornerPreserveAspectRatio: true }
      },
      defaultAnchor: anchorWhenConnected(midSideAnchor(mode, sourceOffset, targetOffset, markerSelector), centerAnchor),
      defaultConnectionPoint: connectionPointWhenConnected(anchorPoint, withOffsets(boundaryPoint, sourceOffset, targetOffset, markerSelector)),
    };
  }

  return {
    defaultRouter: router,
    defaultConnector: {
      name: 'straight',
      args: { cornerType, cornerRadius, cornerPreserveAspectRatio: true }
    },
    defaultAnchor: midSideAnchor(mode, sourceOffset, targetOffset, markerSelector),
    defaultConnectionPoint: anchorPoint,
  };
}

export type LinkRoutingSmoothOptions = BaseLinkOptions;

/**
 * Smooth curved links between elements.
 * Renders links as bezier curves for a softer, more organic look.
 * @param options
 */
export function linkRoutingSmooth(options: LinkRoutingSmoothOptions = {}): LinkRouting {
  const { mode, sourceOffset = 0, targetOffset = 0, straightWhenDisconnected = true, markerSelector } = options;

  if (straightWhenDisconnected) {
    return {
      defaultRouter: { name: 'normal' },
      defaultConnector: straightConnectorUntilConnected(outwardsCurveConnector),
      defaultAnchor: anchorWhenConnected(midSideAnchor(mode, sourceOffset, targetOffset, markerSelector), centerAnchor),
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
