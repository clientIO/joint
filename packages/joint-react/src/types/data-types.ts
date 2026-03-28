import type { anchors, connectionPoints, dia } from '@joint/core';
import type { PortShape } from '../theme/element-theme';
import type { LinkMarker } from '../theme/markers';
import type { CellId } from './cell-id';
import type { LiteralUnion } from './index';
import type { ElementPosition, ElementSize } from './cell-data';
import { useElement, useElementData, useElements } from '../hooks';

// ── Element Types ─────────────────────────────────────────────────────────────

/**
 * Simplified port definition for declarative port configuration.
 * Converted to full JointJS port format by the default element mapper.
 * @group Graph
 */
export interface FlatElementPort {
  /**
   * X position of the port (absolute positioning).
   * Supports calc() expressions (e.g., 'calc(w)').
   */
  cx: number | string;
  /**
   * Y position of the port (absolute positioning).
   * Supports calc() expressions (e.g., 'calc(h)').
   */
  cy: number | string;
  /**
   * Width of the port shape.
   * @default 10
   */
  width?: number;
  /**
   * Height of the port shape.
   * @default 10
   */
  height?: number;
  /**
   * Fill color of the port shape.
   * @default '#333333'
   */
  color?: string;
  /**
   * Shape of the port.
   * @default 'ellipse'
   */
  shape?: PortShape;
  /**
   * Outline color of the port shape. Accepts any CSS color (e.g., "#333", "var(--my-color)").
   * @default 'transparent'
   */
  outline?: string;
  /**
   * Outline width of the port shape in px.
   * @default 0
   */
  outlineWidth?: number;
  /**
   * CSS class name to apply to the port shape.
   */
  className?: string;
  /**
   * Whether the port is limited to only being a target (not source) for links.
   * @default false
   */
  passive?: boolean;
  /**
   * Label displayed next to the port.
   */
  label?: string;
  /**
   * Position of the port label.
   * @default 'outside'
   */
  labelPosition?: string;
  /**
   * Color of the port label text.
   * @default '#333333'
   */
  labelColor?: string;
  /**
   * Font size of the port label text.
   */
  labelFontSize?: number;
  /**
   * Font family of the port label text.
   */
  labelFontFamily?: string;
  /**
   * CSS class name to apply to the port label.
   */
  labelClassName?: string;
  /**
   * Horizontal offset of the port label in pixels.
   */
  labelOffsetX?: number;
  /**
   * Vertical offset of the port label in pixels.
   */
  labelOffsetY?: number;
}

/**
 * Presentation style for an element (ports and port defaults).
 * Stored in `cell.style` on the JointJS model, separate from user `data`.
 * @group Graph
 */
export interface ElementStyle {
  /** Style defaults applied to all ports. Individual port properties take precedence. */
  portStyle?: Partial<FlatElementPort>;
  /** Ports of the element. */
  ports?: Record<string, FlatElementPort>;
}

/**
 * Base fields shared by all element data variants.
 * Layout fields use JointJS core types (`dia.Point`, `dia.Size`).
 * @group Graph
 */
interface ElementBase {
  /** Position of the element. */
  position?: ElementPosition;
  /** Size of the element. */
  size?: ElementSize;
  /** Angle of the element in degrees. */
  angle?: number;
  /** Z-index of the cell. */
  z?: number;
  /** Parent element id. */
  parent?: string;
  /** Layer id for the cell. */
  layer?: string;
  /** Element presentation style (ports, port defaults). */
  style?: ElementStyle;

  data?: Record<string, unknown>;

  /** Jointjs type */
  type?: string;
  /** Attributes for built-in shapes */
  attrs?: Record<string, Record<string, unknown>>;
}

/**
 * Element data type with conditional `data` field.
 *
 * - `Element` (no generic): `data` is optional.
 * - `Element<MyData>`: `data` is required (`MyData`).
 * @group Graph
 */
export type Element<D extends object | undefined = undefined> = undefined extends D
  ? ElementBase
  : ElementBase & { data: D };

// ── Link Types ────────────────────────────────────────────────────────────────

/**
 * Link endpoint definition.
 *
 * - A string is an element ID (connects to the element's center).
 * - An object with `x` and `y` connects to a fixed point on the canvas.
 *
 * Port, anchor, connectionPoint and magnet are specified via separate
 * top-level properties on {@link Link} (e.g. `sourcePort`, `sourceAnchor`).
 * @group Graph
 */
export type FlatLinkEnd = CellId | { x: number; y: number };

/**
 * Visual/presentation attributes for a link line and its wrapper.
 *
 * All properties are optional.  `defaultLinkStyle` satisfies the full
 * `Required<FlatLinkPresentationData>` to provide fallback values.
 * @group Graph
 */
export interface FlatLinkPresentationData {
  /**
   * Stroke color of the link line.
   * Accepts any CSS color value, including CSS variables like `'var(--my-color)'`.
   * When set to `''`, the `--jr-link-color` CSS variable from theme.css controls the stroke.
   */
  color?: string;
  /**
   * Stroke width of the link line.
   * Accepts a number (pixels) or a CSS value string like `'var(--my-width)'`.
   * When set to `''`, the `--jr-link-width` CSS variable from theme.css controls the width.
   */
  width?: number | string;
  /**
   * Source marker name, custom marker definition, or JSX markup.
   * Use 'none' for no marker.
   * @example
   * sourceMarker: 'arrow'
   * sourceMarker: jsx(<path d="M 0 0 L 8 -4 V 4 z" fill="context-stroke" />)
   * @default 'none'
   */
  sourceMarker?: LinkMarker;
  /**
   * Target marker name, custom marker definition, or JSX markup.
   * Use 'none' for no marker.
   * @example
   * targetMarker: 'arrow'
   * targetMarker: jsx(<path d="M 0 0 L 8 -4 V 4 z" fill="context-stroke" />)
   * @default 'none'
   */
  targetMarker?: LinkMarker;
  /**
   * CSS class name to apply to the link line.
   * @default ''
   */
  className?: string;
  /**
   * Stroke dash pattern for the link line.
   * Accepts SVG `stroke-dasharray` syntax (e.g., `'5,5'` for dashed).
   * @default ''
   */
  dasharray?: string;
  /**
   * Stroke line cap for the link line.
   * @default ''
   */
  linecap?: LiteralUnion<'butt' | 'round' | 'square'>;
  /**
   * Stroke line join for the link line.
   * @default ''
   */
  linejoin?: LiteralUnion<'miter' | 'round' | 'bevel'>;
  /**
   * Stroke width of the link wrapper (hit area) in pixels.
   * @default 10
   */
  wrapperWidth?: number;
  /**
   * Stroke color of the link wrapper (outline).
   * Set to a visible color to create a double-line effect.
   * @default 'transparent'
   */
  wrapperColor?: string;
  /**
   * CSS class name to apply to the link wrapper (outline).
   * @default ''
   */
  wrapperClassName?: string;
}

/**
 * Simplified label definition for graph links.
 * @group Graph
 */
export interface FlatLinkLabel {
  /**
   * Label text content.
   */
  text: string;
  /**
   * Position along the link. A number between 0 and 1 is a ratio,
   * a number greater than 1 is an absolute distance in pixels.
   */
  position?: number;
  /**
   * Offset perpendicular to the link path.
   * A number is a perpendicular distance; an object `{ x, y }` is an absolute offset.
   * Updated when the user drags a label interactively.
   */
  offset?: number | { x: number; y: number };
  /**
   * Text color.
   */
  color?: string;
  /**
   * Background color of the label rectangle.
   */
  backgroundColor?: string;
  /**
   * Padding between the text and the background rectangle.
   * A single number applies uniform padding, or use `{ x, y }` for horizontal/vertical.
   * @default { x: 4, y: 2 }
   */
  backgroundPadding?: number | { x: number; y: number };
  /**
   * Font size of the label text.
   */
  fontSize?: number;
  /**
   * Font family of the label text.
   */
  fontFamily?: string;
  /**
   * CSS class name applied to the label text element.
   */
  className?: string;
  /**
   * Outline (stroke) color of the label background rectangle.
   */
  backgroundOutline?: string;
  /**
   * Outline (stroke) width of the label background rectangle.
   */
  backgroundOutlineWidth?: number;
  /**
   * Border radius of the label background rectangle.
   */
  backgroundBorderRadius?: number;
  /**
   * Opacity of the label background rectangle (0–1).
   */
  backgroundOpacity?: number;
  /**
   * CSS class name applied to the label background rectangle.
   */
  backgroundClassName?: string;
  /**
   * Shape of the label background.
   * - `'rect'` — rectangle (default)
   * - `'ellipse'` — ellipse
   * - Any other string — interpreted as SVG path `d` commands (supports `calc()` expressions via `ref`)
   * @default 'rect'
   */
  backgroundShape?: LiteralUnion<'rect' | 'ellipse'>;
}

/**
 * Base fields shared by all link data variants.
 * @group Graph
 */
interface LinkBase extends FlatLinkPresentationData {
  /** Z-index of the cell. */
  z?: number;
  /** Parent element id. */
  parent?: string;
  /** Layer id for the cell. */
  layer?: string;
  /**
   * Source element id or point.
   */
  source?: FlatLinkEnd;
  /**
   * Target element id or point.
   */
  target?: FlatLinkEnd;
  /**
   * Source port id.
   */
  sourcePort?: string;
  /**
   * Target port id.
   */
  targetPort?: string;
  /**
   * Source anchor definition.
   * @see https://docs.jointjs.com/learn/features/links/anchors
   */
  sourceAnchor?: anchors.AnchorJSON;
  /**
   * Target anchor definition.
   * @see https://docs.jointjs.com/learn/features/links/anchors
   */
  targetAnchor?: anchors.AnchorJSON;
  /**
   * Source connection point definition.
   * @see https://docs.jointjs.com/learn/features/links/connection-points
   */
  sourceConnectionPoint?: connectionPoints.ConnectionPointJSON;
  /**
   * Target connection point definition.
   * @see https://docs.jointjs.com/learn/features/links/connection-points
   */
  targetConnectionPoint?: connectionPoints.ConnectionPointJSON;
  /**
   * Source magnet selector.
   * CSS selector of the SVG element used as the connection magnet on the source.
   */
  sourceMagnet?: string;
  /**
   * Target magnet selector.
   * CSS selector of the SVG element used as the connection magnet on the target.
   */
  targetMagnet?: string;
  /**
   * Link vertices (waypoints).
   */
  vertices?: dia.Link.Vertex[];
  /**
   * Link router configuration.
   */
  router?: unknown;
  /**
   * Link connector configuration.
   */
  connector?: unknown;
  /**
   * Style defaults applied to all labels. Individual label properties take precedence.
   */
  labelStyle?: Partial<FlatLinkLabel>;
  /**
   * Link labels.
   */
  labels?: Record<string, FlatLinkLabel>;

  data?: Record<string, unknown>;

  /** Jointjs type */
  type?: string;
  /** Attributes for built-in shapes */
  attrs?: Record<string, Record<string, unknown>>;
}

/**
 * Link data type with conditional `data` field.
 *
 * - `Link` (no generic): `data` is optional.
 * - `Link<MyData>`: `data` is required (`MyData`).
 * @group Graph
 */
export type Link<D extends object | undefined = undefined> = undefined extends D
  ? LinkBase
  : LinkBase & { data: D };

// ── Container Types (internal) ───────────────────────────────────────────────

/**
 * Adds guaranteed layout fields to element data.
 * Used internally by graph-view containers and returned by hooks like `useElement`.
 * @group Graph
 */
export type ElementWithLayout<E extends object | undefined = undefined> = Element<E> & {
  position: Required<ElementPosition>;
  size: Required<ElementSize>;
  angle: number;
};
