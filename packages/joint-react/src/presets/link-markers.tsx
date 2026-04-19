/* eslint-disable jsdoc/require-param */
/* eslint-disable jsdoc/require-returns */

import { jsx } from '../utils/joint-jsx/jsx-to-markup';
import type { LinkMarkerRecord } from '../theme/named-link-markers';

export interface LinkMarkerOptions {
  /** Unique ID for the marker. If not provided, a default ID will be generated based on the options. */
  /** Scale factor. Default: `1`. */
  readonly scale?: number;
  /** Fill color. Default: `'context-stroke'`. Use `'none'` for outline. */
  readonly fill?: string;
  /** Stroke color. Default: `'context-stroke'`. */
  readonly stroke?: string;
  /** Stroke width. Default: `2`. */
  readonly strokeWidth?: number;
}
/** Default fill color for markers. */
const FILL = 'inherit';
/** Default stroke color for markers. */
const STROKE = 'inherit';
/** Default stroke width for markers. */
const SW = 2;

/**
 * Helper function to apply default options for link markers.
 */
function defaults(options: LinkMarkerOptions = {}) {
  const {
    scale = 1,
    fill = FILL,
    stroke = STROKE,
    strokeWidth = SW,
  } = options;
  return { scale, fill, stroke, strokeWidth };
}

/**
 * Filled triangle arrow. Tip at 0, body extends into positive X.
 */
export function linkMarkerArrow(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, fill, stroke, strokeWidth } = defaults(options);
  const w = 8 * scale;
  const h = 4 * scale;
  return {
    markup: jsx(
      <path d={`M 0 ${-h} L ${-w} 0 L 0 ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
    ),
    // the mitered join can extend beyond the path, so add 1px of padding
    length: w + strokeWidth + 1,
  };
}

/**
 * Open chevron arrow (no back edge). Tip at 0.
 */
export function linkMarkerArrowOpen(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, stroke, strokeWidth } = defaults(options);
  const w = 8 * scale;
  const h = 4 * scale;
  return {
    markup: jsx(
      <path d={`M ${w} ${-h} L 0 0 L ${w} ${h}`} fill="none" stroke={stroke} stroke-width={strokeWidth} />
    ),
    // the mitered join can extend beyond the path, so add 1px of padding
    length: strokeWidth + 1,
  };
}

/**
 * Arrow with a concave (sunken) back edge.
 */
export function linkMarkerArrowSunken(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, fill, stroke, strokeWidth } = defaults(options);
  const w = 10 * scale;
  const h = 5 * scale;
  const indent = 3 * scale;
  return {
    markup: jsx(
      <path d={`M ${indent} ${-h} L ${indent - w} 0 L ${indent} ${h} L 0 0 z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
    ),
    length: w - indent + strokeWidth + 1,
  };
}

/**
 * Arrow with a split/quill back — back edges form an open V (don't meet).
 */
export function linkMarkerArrowQuill(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, fill, stroke, strokeWidth } = defaults(options);
  const w = 10 * scale;
  const h = 5 * scale;
  const indent = 3 * scale;
  return {
    markup: jsx(
      <path d={`
        M ${indent} ${-h}
        H ${2 * indent - w}
        L ${indent - w} 0
        L ${2 * indent - w} ${h}
        H ${indent}
        L 0 0 z`
      } fill={fill} stroke={stroke} stroke-width={strokeWidth} />
    ),
    length: w - indent + strokeWidth,
  };
}

/**
 * Double arrow (two nested triangles).
 */
export function linkMarkerArrowDouble(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, fill, stroke, strokeWidth } = defaults(options);
  const w = 7 * scale;
  const h = 4 * scale;
  const gap = 8 * scale;
  return {
    markup: jsx(
      <>
        <path d={`M ${-gap} ${-h} L ${-(w + gap)} 0 L ${-gap} ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
        <path d={`M 0 ${-h} L ${-w} 0 L 0 ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
      </>
    ),
    length: w + gap + strokeWidth + 1,
  };
}

/**
 * Circle marker. Use `fill: 'none'` for outline.
 */
export function linkMarkerCircle(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, fill, stroke, strokeWidth } = defaults(options);
  const r = 4 * scale;
  return {
    markup: jsx(
      <circle cx={-r} r={r} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
    ),
    length: r * 2 + strokeWidth,
  };
}

/**
 * Diamond (losangle) marker. Use `fill: 'none'` for outline.
 */
export function linkMarkerDiamond(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, fill, stroke, strokeWidth } = defaults(options);
  const w = 5 * scale;
  const h = 5 * scale;
  return {
    markup: jsx(
      <path d={`M 0 0 L ${-w} ${-h} L ${-w * 2} 0 L ${-w} ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
    ),
    length: w * 2 + strokeWidth,
  };
}

/**
 * Vertical bar at the link end.
 */
export function linkMarkerLine(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, stroke, strokeWidth } = defaults(options);
  const h = 5 * scale;
  return {
    markup: jsx(
      <path d={`M 0 ${-h} V ${h}`} stroke={stroke} stroke-width={strokeWidth} />
    ),
    length: strokeWidth,
  };
}

/**
 * Cross (X) centered at the link end.
 */
export function linkMarkerCross(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, stroke, strokeWidth } = defaults(options);
  const d = 5 * scale;
  return {
    markup: jsx(
      <path d={`M ${-d} ${-d} L ${d} ${d} M ${-d} ${d} L ${d} ${-d}`} stroke={stroke} stroke-width={strokeWidth} />
    ),
    length: d + strokeWidth,
  };
}

/**
 * Fork — same shape as arrow but pointing the opposite direction.
 */
export function linkMarkerFork(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, fill, stroke, strokeWidth } = defaults(options);
  const w = 8 * scale;
  const h = 4 * scale;
  return {
    markup: jsx(
      <path d={`M ${-w} ${-h} L 0 0 L ${-w} ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
    ),
    length: w + strokeWidth,
  };
}

/**
 * Fork with a closing vertical bar at the tip.
 */
export function linkMarkerForkClose(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, fill, stroke, strokeWidth } = defaults(options);
  const w = 8 * scale;
  const h = 4 * scale;
  return {
    markup: jsx(
      <>
        <path d={`M ${-w} ${-h} L 0 0 L ${-w} ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
        <path d={`M 0 ${-h} V ${h}`} stroke={stroke} stroke-width={strokeWidth} />
      </>
    ),
    length: w + strokeWidth,
  };
}

/**
 * Crow's foot — three lines spreading from a point (ER "many").
 */
export function linkMarkerMany(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, stroke, strokeWidth } = defaults(options);
  const w = 8 * scale;
  const h = 4 * scale;
  return {
    markup: jsx(
      <>
        <path d={`M ${-w} ${-h} L 0 0 L ${-w} ${h}`} fill="none" stroke={stroke} stroke-width={strokeWidth} />
        <path d={`M ${-w} 0 L 0 0`} fill="none" stroke={stroke} stroke-width={strokeWidth} />
      </>
    ),
    length: w + strokeWidth - 1,
  };
}

/**
 * Crow's foot with circle — ER "many optional".
 */
export function linkMarkerManyOptional(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, stroke, strokeWidth } = defaults(options);
  const w = 8 * scale;
  const h = 4 * scale;
  const r = 4 * scale;
  const crowX = -(r * 2);
  return {
    markup: jsx(
      <>
        <circle cx={-r} r={r} fill="none" stroke={stroke} stroke-width={strokeWidth} />
        <path d={`M ${crowX - w} ${-h} L ${crowX} 0 L ${crowX - w} ${h} M ${crowX - w} 0 L ${crowX} 0`} fill="none" stroke={stroke} stroke-width={strokeWidth} stroke-linejoin="bevel"/>
      </>
    ),
    length: w - crowX + strokeWidth - 1,
  };
}

/**
 * Two parallel vertical bars — ER "one".
 */
export function linkMarkerOne(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, stroke, strokeWidth } = defaults(options);
  const h = 5 * scale;
  return {
    markup: jsx(
      <>
        <path d={`M ${h} ${-h} V ${h}`} stroke={stroke} stroke-width={strokeWidth} />
      </>
    ),
    length: 0
  };
}

/**
 * Vertical bar with circle — ER "one optional".
 */
export function linkMarkerOneOptional(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, stroke, strokeWidth } = defaults(options);
  const h = 5 * scale;
  const r = 4 * scale;
  const circleX = -r;
  return {
    markup: jsx(
      <>
        <path d={`M ${h} ${-h} V ${h}`} stroke={stroke} stroke-width={strokeWidth} />
        <circle cx={circleX} r={r} fill="none" stroke={stroke} stroke-width={strokeWidth} />
      </>
    ),
    length: r - circleX + strokeWidth,
  };
}

/**
 * Crow's foot with vertical bar — ER "one or many".
 */
export function linkMarkerOneOrMany(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, stroke, strokeWidth } = defaults(options);
  const w = 8 * scale;
  const h = 4 * scale;
  return {
    markup: jsx(
      <>
        <path d={`M ${-w} ${-h} L 0 0 L ${-w} ${h} M ${-w} 0 L 0 0`} fill="none" stroke={stroke} stroke-width={strokeWidth} />
        <path d={`M ${0} ${-h} V ${h}`} stroke={stroke} stroke-width={strokeWidth} />
      </>
    ),
    length: w + strokeWidth - 1,
  };
}
