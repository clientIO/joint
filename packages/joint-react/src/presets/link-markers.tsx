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
/** Fill value of open (stroke-only) shapes. */
const NO_FILL = 'none';

/** Presentation attributes shared by every node a marker is drawn with. */
interface MarkerStyle {
  readonly fill: string;
  readonly stroke: string;
  readonly strokeWidth: number;
  readonly className?: string;
}

/**
 * Resolves {@link LinkMarkerOptions} against the defaults: the geometry inputs
 * (`scale`, `strokeWidth`) plus the presentation `style` handed to
 * {@link markerPath} / {@link markerCircle}.
 */
function defaults(options: LinkMarkerOptions = {}) {
  const { scale = 1, fill = FILL, stroke = STROKE, strokeWidth = SW, className } = options;
  return { scale, strokeWidth, style: { fill, stroke, strokeWidth, className } };
}

/**
 * A `<path>` carrying the marker's shared presentation attributes. `fill`
 * defaults to the resolved marker fill; pass {@link NO_FILL} for open shapes.
 */
function markerPath(d: string, style: MarkerStyle, fill: string = style.fill) {
  return (
    <path
      d={d}
      fill={fill}
      stroke={style.stroke}
      stroke-width={style.strokeWidth}
      className={style.className}
    />
  );
}

/** A `<circle>` on the link axis carrying the marker's shared presentation attributes. */
function markerCircle(cx: number, r: number, style: MarkerStyle, fill: string = style.fill) {
  return (
    <circle
      cx={cx}
      r={r}
      fill={fill}
      stroke={style.stroke}
      stroke-width={style.strokeWidth}
      className={style.className}
    />
  );
}

/** Scaled geometry of the 6×3 triangle shared by the arrow, fork, and crow's-foot markers. */
function arrowSize(scale: number) {
  return { w: 6 * scale, h: 3 * scale };
}

/** Closed triangle with its tip at the origin, opening away from the link end. */
function forkPath(w: number, h: number): string {
  return `M ${-w} ${-h} L 0 0 L ${-w} ${h} z`;
}

/** Open crow's foot (chevron plus center line) with its tip at `x`. */
function crowsFootPath(w: number, h: number, x = 0): string {
  return `M ${x - w} ${-h} L ${x} 0 L ${x - w} ${h} M ${x - w} 0 L ${x} 0`;
}

/** Vertical bar of half-height `h` crossing the link axis at `x`. */
function barPath(h: number, x = 0): string {
  return `M ${x} ${-h} V ${h}`;
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
  const { scale, strokeWidth, style } = defaults(options);
  const { w, h } = arrowSize(scale);
  return {
    markup: jsx(markerPath(`M 0 ${-h} L ${-w} 0 L 0 ${h} z`, style)),
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
  const { scale, strokeWidth, style } = defaults(options);
  const { w, h } = arrowSize(scale);
  return {
    markup: jsx(markerPath(`M ${w} ${-h} L 0 0 L ${w} ${h}`, style, NO_FILL)),
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
  const { scale, strokeWidth, style } = defaults(options);
  const { w, h } = arrowSize(scale);
  const indent = 2 * scale;
  return {
    markup: jsx(
      markerPath(`M ${indent} ${-h} L ${indent - w} 0 L ${indent} ${h} L 0 0 z`, style)
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
  const { scale, strokeWidth, style } = defaults(options);
  const { w, h } = arrowSize(scale);
  const indent = 2 * scale;
  const d = `
        M ${indent} ${-h}
        H ${2 * indent - w}
        L ${indent - w} 0
        L ${2 * indent - w} ${h}
        H ${indent}
        L 0 0 z`;
  return {
    markup: jsx(markerPath(d, style)),
    length: w - indent + strokeWidth,
  };
}

/**
 * Double arrow marker, two stacked triangles drawn one behind the other along
 * the link, useful for "fast-forward" or "strong direction" semantics.
 * @group Presets
 */
export function linkMarkerArrowDouble(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, strokeWidth, style } = defaults(options);
  const { w, h } = arrowSize(scale);
  const gap = 7 * scale;
  return {
    markup: jsx(
      <>
        {markerPath(`M ${-gap} ${-h} L ${-(w + gap)} 0 L ${-gap} ${h} z`, style)}
        {markerPath(`M 0 ${-h} L ${-w} 0 L 0 ${h} z`, style)}
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
  const { scale, strokeWidth, style } = defaults(options);
  const r = 4 * scale;
  return {
    markup: jsx(markerCircle(-r, r, style)),
    length: r * 2 + strokeWidth,
  };
}

/**
 * Diamond marker for link endpoints, used in UML for aggregation/composition.
 * Pass `fill: 'none'` for an outline-only diamond (aggregation).
 * @group Presets
 */
export function linkMarkerDiamond(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, strokeWidth, style } = defaults(options);
  const w = 4 * scale;
  const h = 4 * scale;
  return {
    markup: jsx(markerPath(`M 0 0 L ${-w} ${-h} L ${-w * 2} 0 L ${-w} ${h} z`, style)),
    length: w * 2 + strokeWidth,
  };
}

/**
 * Vertical bar marker at the link endpoint, a neutral terminator that adds
 * a visual stop without implying direction.
 * @group Presets
 */
export function linkMarkerLine(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, strokeWidth, style } = defaults(options);
  const h = 5 * scale;
  return {
    markup: jsx(markerPath(barPath(h), style, NO_FILL)),
    length: strokeWidth,
  };
}

/**
 * Cross (X) marker centered at the link endpoint, typically used to mark
 * a forbidden or "no entry" connection.
 * @group Presets
 */
export function linkMarkerCross(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, strokeWidth, style } = defaults(options);
  const d = 4 * scale;
  return {
    markup: jsx(markerPath(`M ${-d} ${-d} L ${d} ${d} M ${-d} ${d} L ${d} ${-d}`, style, NO_FILL)),
    length: d + strokeWidth,
  };
}

/**
 * Fork marker, a reversed triangle, useful as a "return" or back-edge cap.
 * @group Presets
 */
export function linkMarkerFork(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, strokeWidth, style } = defaults(options);
  const { w, h } = arrowSize(scale);
  return {
    markup: jsx(markerPath(forkPath(w, h), style)),
    length: w + strokeWidth,
  };
}

/**
 * Fork marker with a closing vertical bar at the tip, a fork that
 * terminates on a solid wall.
 * @group Presets
 */
export function linkMarkerForkClose(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, strokeWidth, style } = defaults(options);
  const { w, h } = arrowSize(scale);
  return {
    markup: jsx(
      <>
        {markerPath(forkPath(w, h), style)}
        {markerPath(barPath(h), style, NO_FILL)}
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
  const { scale, strokeWidth, style } = defaults(options);
  const { w, h } = arrowSize(scale);
  return {
    markup: jsx(markerPath(crowsFootPath(w, h), style, NO_FILL)),
    length: w + strokeWidth - 1,
  };
}

/**
 * Crow's foot with circle marker for ER diagrams, denotes "many optional"
 * (zero-or-many) cardinality.
 * @group Presets
 */
export function linkMarkerManyOptional(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, strokeWidth, style } = defaults(options);
  const { w, h } = arrowSize(scale);
  const r = 3 * scale;
  const crowX = -(r * 2);
  return {
    markup: jsx(
      <>
        {markerCircle(-r, r, style, NO_FILL)}
        <path
          d={crowsFootPath(w, h, crowX)}
          fill={NO_FILL}
          stroke={style.stroke}
          stroke-width={style.strokeWidth}
          stroke-linejoin="bevel"
          className={style.className}
        />
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
  const { scale, style } = defaults(options);
  const h = 4 * scale;
  return {
    markup: jsx(markerPath(barPath(h, h), style, NO_FILL)),
    length: 0,
  };
}

/**
 * Vertical bar with circle marker for ER diagrams, denotes "one optional"
 * (zero-or-one) cardinality.
 * @group Presets
 */
export function linkMarkerOneOptional(options?: LinkMarkerOptions): LinkMarkerRecord {
  const { scale, strokeWidth, style } = defaults(options);
  const h = 4 * scale;
  const r = 3 * scale;
  const circleX = -r;
  return {
    markup: jsx(
      <>
        {markerPath(barPath(h, h), style, NO_FILL)}
        {markerCircle(circleX, r, style, NO_FILL)}
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
  const { scale, strokeWidth, style } = defaults(options);
  const { w, h } = arrowSize(scale);
  return {
    markup: jsx(
      <>
        {markerPath(crowsFootPath(w, h), style, NO_FILL)}
        {markerPath(barPath(h), style, NO_FILL)}
      </>
    ),
    length: w + strokeWidth - 1,
  };
}
