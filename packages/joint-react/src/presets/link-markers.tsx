import type { dia } from '@joint/core';
import { jsx } from '../utils/joint-jsx/jsx-to-markup';

interface MarkerOptions {
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
const FILL = 'context-stroke';
/** Default stroke color for markers. */
const STROKE = 'context-stroke';
/** Default stroke width for markers. */
const SW = 2;

function defaults(opts: MarkerOptions = {}) {
  const { scale = 1, fill = FILL, stroke = STROKE, strokeWidth = SW } = opts;
  return { scale, fill, stroke, strokeWidth };
}

/**
 * Filled triangle arrow. Tip at 0, body extends into positive X.
 */
export function linkMarkerArrow(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { scale: s, fill, stroke, strokeWidth } = defaults(opts);
  const w = 8 * s;
  const h = 4 * s;
  return {
    markup: jsx(
      <path d={`M 0 ${-h} L ${-w} 0 L 0 ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
    ),
    // the mitered join can extend beyond the path, so add 1px of padding
    length: w + strokeWidth + 1 * s,
  };
}

/**
 * Open chevron arrow (no back edge). Tip at 0.
 */
export function linkMarkerArrowOpen(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { scale: s, stroke, strokeWidth } = defaults(opts);
  const w = 8 * s;
  const h = 4 * s;
  return {
    markup: jsx(
      <path d={`M ${w} ${-h} L 0 0 L ${w} ${h}`} fill="none" stroke={stroke} stroke-width={strokeWidth} />
    ),
    // the mitered join can extend beyond the path, so add 1px of padding
    length: strokeWidth + 1 * s,
  };
}

/**
 * Arrow with a concave (sunken) back edge.
 */
export function linkMarkerArrowSunken(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { scale: s, fill, stroke, strokeWidth } = defaults(opts);
  const w = 10 * s;
  const h = 5 * s;
  const indent = 3 * s;
  return {
    markup: jsx(
      <path d={`M ${indent} ${-h} L ${indent - w} 0 L ${indent} ${h} L 0 0 z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
    ),
    length: w - indent + strokeWidth + 1 * s,
  };
}

/**
 * Arrow with a split/quill back — back edges form an open V (don't meet).
 */
export function linkMarkerArrowQuill(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { scale: s, fill, stroke, strokeWidth } = defaults(opts);
  const w = 10 * s;
  const h = 5 * s;
  const indent = 3 * s;
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
export function linkMarkerArrowDouble(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { scale: s, fill, stroke, strokeWidth } = defaults(opts);
  const w = 7 * s;
  const h = 4 * s;
  const gap = 8 * s;
  return {
    markup: jsx(
      <>
        <path d={`M ${-gap} ${-h} L ${-(w + gap)} 0 L ${-gap} ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
        <path d={`M 0 ${-h} L ${-w} 0 L 0 ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
      </>
    ),
    length: w + gap + strokeWidth + 1 * s,
  };
}

/**
 * Circle marker. Use `fill: 'none'` for outline.
 */
export function linkMarkerCircle(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { scale: s, fill, stroke, strokeWidth } = defaults(opts);
  const r = 4 * s;
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
export function linkMarkerDiamond(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { scale: s, fill, stroke, strokeWidth } = defaults(opts);
  const w = 5 * s;
  const h = 5 * s;
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
export function linkMarkerBar(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { scale: s, stroke, strokeWidth } = defaults(opts);
  const h = 5 * s;
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
export function linkMarkerCross(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { scale: s, stroke, strokeWidth } = defaults(opts);
  const d = 5 * s;
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
export function linkMarkerFork(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { scale: s, fill, stroke, strokeWidth } = defaults(opts);
  const w = 8 * s;
  const h = 4 * s;
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
export function linkMarkerForkClose(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { scale: s, fill, stroke, strokeWidth } = defaults(opts);
  const w = 8 * s;
  const h = 4 * s;
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
