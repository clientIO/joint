import type { dia } from '@joint/core';
import { jsx } from '../utils/joint-jsx/jsx-to-markup';

interface MarkerOptions {
  /** Scale factor. Default: `1`. */
  readonly size?: number;
  /** Fill color. Default: `'context-stroke'`. Use `'none'` for outline. */
  readonly fill?: string;
  /** Stroke color. Default: `'context-stroke'`. */
  readonly stroke?: string;
  /** Stroke width. Default: `2`. */
  readonly strokeWidth?: number;
}

const FILL = 'context-stroke';
const STROKE = 'context-stroke';
const SW = 2;

function defaults(opts: MarkerOptions = {}) {
  const { size = 1, fill = FILL, stroke = STROKE, strokeWidth = SW } = opts;
  return { size, fill, stroke, strokeWidth };
}

/**
 * Filled triangle arrow. Tip at the link end, body extends outward.
 */
export function linkMarkerArrow(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { size: s, fill, stroke, strokeWidth } = defaults(opts);
  const w = 8 * s;
  const h = 4 * s;
  const o = -7;
  return {
    markup: jsx(
      <path d={`M ${w + o} ${-h} L ${o} 0 L ${w + o} ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
    ),
  };
}

/**
 * Open chevron arrow (no back edge). Tip at the link end.
 */
export function linkMarkerArrowOpen(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { size: s, stroke, strokeWidth } = defaults(opts);
  const w = 8 * s;
  const h = 4 * s;
  const o = -2;
  return {
    markup: jsx(
      <path d={`M ${w + o} ${-h} L ${o} 0 L ${w + o} ${h}`} fill="none" stroke={stroke} stroke-width={strokeWidth} />
    ),
  };
}

/**
 * Arrow with a concave (sunken) back edge.
 */
export function linkMarkerArrowSunken(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { size: s, fill, stroke, strokeWidth } = defaults(opts);
  const w = 10 * s;
  const h = 5 * s;
  const indent = 3 * s;
  const o = -7;
  return {
    markup: jsx(
      <path d={`M ${w + o} ${-h} L ${o} 0 L ${w + o} ${h} L ${w - indent + o} 0 z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
    ),
  };
}

/**
 * Arrow with a split/quill back — back edges form an open V (don't meet).
 */
export function linkMarkerArrowQuill(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { size: s, fill, stroke, strokeWidth } = defaults(opts);
  const w = 10 * s;
  const h = 5 * s;
  const notch = 4 * s;
  const o = -5;
  return {
    markup: jsx(
      <path d={`M ${notch + o} 0 L ${w + o} ${-h} L ${o} 0 L ${w + o} ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
    ),
  };
}

/**
 * Double arrow (two nested triangles).
 */
export function linkMarkerArrowDouble(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { size: s, fill, stroke, strokeWidth } = defaults(opts);
  const w = 7 * s;
  const h = 4 * s;
  const gap = 6 * s;
  const o = -13;
  return {
    markup: jsx(
      <g>
        <path d={`M ${w + o} ${-h} L ${o} 0 L ${w + o} ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
        <path d={`M ${w + gap + o} ${-h} L ${gap + o} 0 L ${w + gap + o} ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
      </g>
    ),
  };
}

/**
 * Circle marker. Use `fill: 'none'` for outline.
 */
export function linkMarkerCircle(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { size: s, fill, stroke, strokeWidth } = defaults(opts);
  const r = 4 * s;
  return {
    markup: jsx(
      <circle cx={-r} r={r} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
    ),
  };
}

/**
 * Diamond (losangle) marker. Use `fill: 'none'` for outline.
 */
export function linkMarkerDiamond(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { size: s, fill, stroke, strokeWidth } = defaults(opts);
  const w = 5 * s;
  const h = 5 * s;
  return {
    markup: jsx(
      <path d={`M 0 0 L ${-w} ${-h} L ${-w * 2} 0 L ${-w} ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
    ),
  };
}

/**
 * Vertical bar at the link end.
 */
export function linkMarkerBar(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { size: s, stroke, strokeWidth } = defaults(opts);
  const h = 5 * s;
  return {
    markup: jsx(
      <path d={`M 0 ${-h} V ${h}`} stroke={stroke} stroke-width={strokeWidth} />
    ),
  };
}

/**
 * Cross (X) centered at the link end.
 */
export function linkMarkerCross(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { size: s, stroke, strokeWidth } = defaults(opts);
  const d = 5 * s;
  return {
    markup: jsx(
      <path d={`M ${-d} ${-d} L ${d} ${d} M ${-d} ${d} L ${d} ${-d}`} stroke={stroke} stroke-width={strokeWidth} />
    ),
  };
}

/**
 * Fork — same shape as arrow but pointing the opposite direction.
 */
export function linkMarkerFork(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { size: s, fill, stroke, strokeWidth } = defaults(opts);
  const w = 8 * s;
  const h = 4 * s;
  return {
    markup: jsx(
      <path d={`M ${-w} ${-h} L 0 0 L ${-w} ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
    ),
  };
}

/**
 * Fork with a closing vertical bar at the tip.
 */
export function linkMarkerForkClose(opts?: MarkerOptions): dia.SVGMarkerJSON {
  const { size: s, fill, stroke, strokeWidth } = defaults(opts);
  const w = 8 * s;
  const h = 4 * s;
  return {
    markup: jsx(
      <g>
        <path d={`M ${-w} ${-h} L 0 0 L ${-w} ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} />
        <path d={`M 0 ${-h} V ${h}`} stroke={stroke} stroke-width={strokeWidth} />
      </g>
    ),
  };
}
