import type { dia } from '@joint/core';
import { jsx } from '../utils/joint-jsx/jsx-to-markup';

/**
 * A link endpoint marker, an SVG complex-marker JSON plus an optional `length`.
 * Attach one to a {@link LinkStyle}'s `sourceMarker` / `targetMarker`. The
 * built-in `linkMarker*` factories return this shape, or you can hand-write one.
 * @group Types
 */
export interface LinkMarkerRecord extends dia.SVGComplexMarkerJSON {
  /**
   * The marker's visual length along the link, in px. Connection-point math pulls
   * the line tip back by this much so the line meets the marker instead of poking
   * through it. Omit it to apply no offset (treated as `0`).
   */
  readonly length?: number;
}

/**
 * Sizing, color, and stroke options shared by every built-in `linkMarker*`
 * factory. Build a marker, then attach it to a {@link LinkStyle}.
 * @group Types
 * @example
 * ```ts
 * import { linkStyle, linkMarkerArrow, linkMarkerCircle } from '@joint/react';
 *
 * const attrs = linkStyle({
 *   sourceMarker: linkMarkerCircle({ scale: 1.2 }),
 *   targetMarker: linkMarkerArrow({ fill: 'none' }),
 * });
 * ```
 */
export interface LinkMarkerOptions {
  /** Uniform scale factor applied to the marker geometry. @default 1 */
  readonly scale?: number;
  /** Fill color. Defaults to inheriting the link's stroke; use `'none'` for an outline-only marker. @default 'inherit' */
  readonly fill?: string;
  /** Stroke (outline) color. Defaults to inheriting the link's stroke. @default 'inherit' */
  readonly stroke?: string;
  /** Stroke width, in px. @default 2 */
  readonly strokeWidth?: number;
  /** Optional CSS class added to the marker root. */
  readonly className?: string;
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
    className
  } = options;
  return { scale, fill, stroke, strokeWidth, className };
}

/**
 * Filled triangle marker for link endpoints, the classic directed-edge arrow.
 * @returns A marker record for a {@link LinkStyle}'s `sourceMarker` / `targetMarker`
 * @example
 * ```ts
 * import { linkStyle, linkMarkerArrow } from '@joint/react';
 *
 * const attrs = linkStyle({ targetMarker: linkMarkerArrow() });
 * ```
 * @group Presets
 */
export function linkMarkerArrow(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, fill, stroke, strokeWidth, className } = defaults(options);
  const w = 6 * scale;
  const h = 3 * scale;
  return {
    markup: jsx(
      <path d={`M 0 ${-h} L ${-w} 0 L 0 ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} className={className} />
    ),
    // the mitered join can extend beyond the path, so add 1px of padding
    length: w + strokeWidth + 1,
  };
}

/**
 * Open chevron marker for link endpoints, two strokes meeting at a point,
 * no fill (no back edge).
 * @group Presets
 */
export function linkMarkerArrowOpen(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, stroke, strokeWidth, className } = defaults(options);
  const w = 6 * scale;
  const h = 3 * scale;
  return {
    markup: jsx(
      <path d={`M ${w} ${-h} L 0 0 L ${w} ${h}`} fill="none" stroke={stroke} stroke-width={strokeWidth} className={className} />
    ),
    // the mitered join can extend beyond the path, so add 1px of padding
    length: strokeWidth + 1,
  };
}

/**
 * Filled arrow marker with a concave (sunken) back edge, sharper, slimmer
 * silhouette than the plain {@link linkMarkerArrow}.
 * @group Presets
 */
export function linkMarkerArrowSunken(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, fill, stroke, strokeWidth, className } = defaults(options);
  const w = 6 * scale;
  const h = 3 * scale;
  const indent = 2 * scale;
  return {
    markup: jsx(
      <path d={`M ${indent} ${-h} L ${indent - w} 0 L ${indent} ${h} L 0 0 z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} className={className} />
    ),
    length: w - indent + strokeWidth + 1,
  };
}

/**
 * Filled arrow marker with a split/quill back, the back edges form an open
 * V instead of meeting in a single point.
 * @group Presets
 */
export function linkMarkerArrowQuill(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, fill, stroke, strokeWidth, className } = defaults(options);
  const w = 6 * scale;
  const h = 3 * scale;
  const indent = 2 * scale;
  return {
    markup: jsx(
      <path d={`
        M ${indent} ${-h}
        H ${2 * indent - w}
        L ${indent - w} 0
        L ${2 * indent - w} ${h}
        H ${indent}
        L 0 0 z`
      } fill={fill} stroke={stroke} stroke-width={strokeWidth} className={className} />
    ),
    length: w - indent + strokeWidth,
  };
}

/**
 * Double arrow marker, two stacked triangles drawn one behind the other along
 * the link, useful for "fast-forward" or "strong direction" semantics.
 * @group Presets
 */
export function linkMarkerArrowDouble(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, fill, stroke, strokeWidth, className } = defaults(options);
  const w = 6 * scale;
  const h = 3 * scale;
  const gap = 7 * scale;
  return {
    markup: jsx(
      <>
        <path d={`M ${-gap} ${-h} L ${-(w + gap)} 0 L ${-gap} ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} className={className} />
        <path d={`M 0 ${-h} L ${-w} 0 L 0 ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} className={className} />
      </>
    ),
    length: w + gap + strokeWidth + 1,
  };
}

/**
 * Circle marker for link endpoints. Pass `fill: 'none'` for an outline ring.
 * @group Presets
 */
export function linkMarkerCircle(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, fill, stroke, strokeWidth, className } = defaults(options);
  const r = 4 * scale;
  return {
    markup: jsx(
      <circle cx={-r} r={r} fill={fill} stroke={stroke} stroke-width={strokeWidth} className={className} />
    ),
    length: r * 2 + strokeWidth,
  };
}

/**
 * Diamond marker for link endpoints, used in UML for aggregation/composition.
 * Pass `fill: 'none'` for an outline-only diamond (aggregation).
 * @group Presets
 */
export function linkMarkerDiamond(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, fill, stroke, strokeWidth, className } = defaults(options);
  const w = 4 * scale;
  const h = 4 * scale;
  return {
    markup: jsx(
      <path d={`M 0 0 L ${-w} ${-h} L ${-w * 2} 0 L ${-w} ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} className={className} />
    ),
    length: w * 2 + strokeWidth,
  };
}

/**
 * Vertical bar marker at the link endpoint, a neutral terminator that adds
 * a visual stop without implying direction.
 * @group Presets
 */
export function linkMarkerLine(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, stroke, strokeWidth, className } = defaults(options);
  const h = 5 * scale;
  return {
    markup: jsx(
      <path d={`M 0 ${-h} V ${h}`} stroke={stroke} stroke-width={strokeWidth} className={className} />
    ),
    length: strokeWidth,
  };
}

/**
 * Cross (X) marker centered at the link endpoint, typically used to mark
 * a forbidden or "no entry" connection.
 * @group Presets
 */
export function linkMarkerCross(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, stroke, strokeWidth, className } = defaults(options);
  const d = 4 * scale;
  return {
    markup: jsx(
      <path d={`M ${-d} ${-d} L ${d} ${d} M ${-d} ${d} L ${d} ${-d}`} stroke={stroke} stroke-width={strokeWidth} className={className} />
    ),
    length: d + strokeWidth,
  };
}

/**
 * Fork marker, a reversed triangle, useful as a "return" or back-edge cap.
 * @group Presets
 */
export function linkMarkerFork(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, fill, stroke, strokeWidth, className } = defaults(options);
  const w = 6 * scale;
  const h = 3 * scale;
  return {
    markup: jsx(
      <path d={`M ${-w} ${-h} L 0 0 L ${-w} ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} className={className} />
    ),
    length: w + strokeWidth,
  };
}

/**
 * Fork marker with a closing vertical bar at the tip, a fork that
 * terminates on a solid wall.
 * @group Presets
 */
export function linkMarkerForkClose(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, fill, stroke, strokeWidth, className } = defaults(options);
  const w = 6 * scale;
  const h = 3 * scale;
  return {
    markup: jsx(
      <>
        <path d={`M ${-w} ${-h} L 0 0 L ${-w} ${h} z`} fill={fill} stroke={stroke} stroke-width={strokeWidth} className={className} />
        <path d={`M 0 ${-h} V ${h}`} stroke={stroke} stroke-width={strokeWidth} className={className} />
      </>
    ),
    length: w + strokeWidth,
  };
}

/**
 * Crow's foot marker for ER diagrams, denotes "many" cardinality on the
 * relation's end.
 * @group Presets
 */
export function linkMarkerMany(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, stroke, strokeWidth, className } = defaults(options);
  const w = 6 * scale;
  const h = 3 * scale;
  return {
    markup: jsx(
      <>
        <path d={`M ${-w} ${-h} L 0 0 L ${-w} ${h}`} fill="none" stroke={stroke} stroke-width={strokeWidth} className={className} />
        <path d={`M ${-w} 0 L 0 0`} fill="none" stroke={stroke} stroke-width={strokeWidth} className={className} />
      </>
    ),
    length: w + strokeWidth - 1,
  };
}

/**
 * Crow's foot with circle marker for ER diagrams, denotes "many optional"
 * (zero-or-many) cardinality.
 * @group Presets
 */
export function linkMarkerManyOptional(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, stroke, strokeWidth, className } = defaults(options);
  const w = 6 * scale;
  const h = 3 * scale;
  const r = 3 * scale;
  const crowX = -(r * 2);
  return {
    markup: jsx(
      <>
        <circle cx={-r} r={r} fill="none" stroke={stroke} stroke-width={strokeWidth} className={className} />
        <path d={`M ${crowX - w} ${-h} L ${crowX} 0 L ${crowX - w} ${h} M ${crowX - w} 0 L ${crowX} 0`} fill="none" stroke={stroke} stroke-width={strokeWidth} stroke-linejoin="bevel" className={className} />
      </>
    ),
    length: w - crowX + strokeWidth - 1,
  };
}

/**
 * Vertical bar marker for ER diagrams, denotes "one" (exactly-one) cardinality.
 * @group Presets
 */
export function linkMarkerOne(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, stroke, strokeWidth, className } = defaults(options);
  const h = 4 * scale;
  return {
    markup: jsx(
      <>
        <path d={`M ${h} ${-h} V ${h}`} stroke={stroke} stroke-width={strokeWidth} className={className} />
      </>
    ),
    length: 0
  };
}

/**
 * Vertical bar with circle marker for ER diagrams, denotes "one optional"
 * (zero-or-one) cardinality.
 * @group Presets
 */
export function linkMarkerOneOptional(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, stroke, strokeWidth, className } = defaults(options);
  const h = 4 * scale;
  const r = 3 * scale;
  const circleX = -r;
  return {
    markup: jsx(
      <>
        <path d={`M ${h} ${-h} V ${h}`} stroke={stroke} stroke-width={strokeWidth} className={className} />
        <circle cx={circleX} r={r} fill="none" stroke={stroke} stroke-width={strokeWidth} className={className} />
      </>
    ),
    length: r - circleX + strokeWidth,
  };
}

/**
 * Crow's foot with vertical bar marker for ER diagrams, denotes "one or
 * many" (at-least-one) cardinality.
 * @group Presets
 */
export function linkMarkerOneOrMany(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, stroke, strokeWidth, className } = defaults(options);
  const w = 6 * scale;
  const h = 3 * scale;
  return {
    markup: jsx(
      <>
        <path d={`M ${-w} ${-h} L 0 0 L ${-w} ${h} M ${-w} 0 L 0 0`} fill="none" stroke={stroke} stroke-width={strokeWidth} className={className} />
        <path d={`M ${0} ${-h} V ${h}`} stroke={stroke} stroke-width={strokeWidth} className={className} />
      </>
    ),
    length: w + strokeWidth - 1,
  };
}
