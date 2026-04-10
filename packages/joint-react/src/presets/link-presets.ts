import { connectionPoints } from '@joint/core';
import type { PaperProps } from '../components/paper/paper.types';
import type { AnchorMode } from './anchors';
import { centerAnchor, midSideAnchor } from './anchors';
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
 * import { orthogonalLinks } from '@joint/react/presets';
 *
 * const linkPreset = orthogonalLinks();
 * <Paper {...linkPreset} />
 * ```
 */

export type LinkPreset = Pick<
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
  /** Use straight-line routing when an end is not connected. Default: `true`. */
  readonly straightWhenDisconnected?: boolean;
}

export interface StraightLinksOptions extends BaseLinkOptions {
  /** Corner style at vertices. Default: `'point'`. */
  readonly cornerType?: 'point' | 'cubic' | 'line' | 'gap';
  /** Corner radius at vertices (in px). Default: `0`. */
  readonly cornerRadius?: number;
}

/**
 * Straight-line links between elements.
 * The shortest path with no routing — a single line from source to target.
 */
export function straightLinks(options: StraightLinksOptions = {}): LinkPreset {
  const { sourceOffset = 0, targetOffset = 0, cornerType = 'point', cornerRadius = 0 } = options;
  return {
    defaultRouter: { name: 'normal' },
    defaultConnector: { name: 'straight', args: { cornerType, cornerRadius } },
    defaultAnchor: centerAnchor,
    defaultConnectionPoint: withOffsets(boundaryPoint, sourceOffset, targetOffset),
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
      defaultAnchor: anchorWhenConnected(midSideAnchor(mode, sourceOffset, targetOffset), centerAnchor),
      defaultConnectionPoint: connectionPointWhenConnected(anchorPoint, withOffsets(boundaryPoint, sourceOffset, targetOffset)),
    };
  }

  return {
    defaultRouter: rightAngleRouter,
    defaultConnector: { name: 'straight', args: { cornerType, cornerRadius } },
    defaultAnchor: midSideAnchor(mode, sourceOffset, targetOffset),
    defaultConnectionPoint: anchorPoint,
  };
}

export interface SmoothLinksOptions extends BaseLinkOptions {}

/**
 * Smooth curved links between elements.
 * Renders links as bezier curves for a softer, more organic look.
 */
export function smoothLinks(options: SmoothLinksOptions = {}): LinkPreset {
  const { mode, sourceOffset = 0, targetOffset = 0, straightWhenDisconnected = true } = options;

  if (straightWhenDisconnected) {
    return {
      defaultRouter: { name: 'normal' },
      defaultConnector: straightConnectorUntilConnected(outwardsCurveConnector),
      defaultAnchor: anchorWhenConnected(midSideAnchor(mode, sourceOffset, targetOffset), centerAnchor),
      defaultConnectionPoint: connectionPointWhenConnected(
        connectionPoints.anchor as connectionPoints.ConnectionPoint,
        withOffsets(boundaryPoint, sourceOffset, targetOffset)
      ),
    };
  }

  return {
    defaultRouter: { name: 'normal' },
    defaultConnector: outwardsCurveConnector,
    defaultAnchor: midSideAnchor(mode, sourceOffset, targetOffset),
    defaultConnectionPoint: { name: 'anchor' },
  };
}
