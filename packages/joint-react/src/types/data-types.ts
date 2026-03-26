import type { anchors, connectionPoints, dia } from '@joint/core';
import type { PortShape } from '../theme/element-theme';
import type { LinkMarker } from '../theme/markers';
import type { CellId } from './cell-id';
import type { LiteralUnion } from './index';
import type { CellData } from './cell-data';

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
  readonly cx: number | string;
  /**
   * Y position of the port (absolute positioning).
   * Supports calc() expressions (e.g., 'calc(h)').
   */
  readonly cy: number | string;
  /**
   * Width of the port shape.
   * @default 10
   */
  readonly width?: number;
  /**
   * Height of the port shape.
   * @default 10
   */
  readonly height?: number;
  /**
   * Fill color of the port shape.
   * @default '#333333'
   */
  readonly color?: string;
  /**
   * Shape of the port.
   * @default 'ellipse'
   */
  readonly shape?: PortShape;
  /**
   * Outline color of the port shape. Accepts any CSS color (e.g., "#333", "var(--my-color)").
   * @default 'transparent'
   */
  readonly outline?: string;
  /**
   * Outline width of the port shape in px.
   * @default 0
   */
  readonly outlineWidth?: number;
  /**
   * CSS class name to apply to the port shape.
   */
  readonly className?: string;
  /**
   * Whether the port is limited to only being a target (not source) for links.
   * @default false
   */
  readonly passive?: boolean;
  /**
   * Label displayed next to the port.
   */
  readonly label?: string;
  /**
   * Position of the port label.
   * @default 'outside'
   */
  readonly labelPosition?: string;
  /**
   * Color of the port label text.
   * @default '#333333'
   */
  readonly labelColor?: string;
  /**
   * Font size of the port label text.
   */
  readonly labelFontSize?: number;
  /**
   * Font family of the port label text.
   */
  readonly labelFontFamily?: string;
  /**
   * CSS class name to apply to the port label.
   */
  readonly labelClassName?: string;
  /**
   * Horizontal offset of the port label in pixels.
   */
  readonly labelOffsetX?: number;
  /**
   * Vertical offset of the port label in pixels.
   */
  readonly labelOffsetY?: number;
}

/**
 * Base interface for graph elements.
 * The generic `D` represents the user's custom data, stored in the `data` field.
 * Layout fields (x, y, width, height, angle) and structural fields (z, parent, layer, ports)
 * are at the top level.
 * @group Graph
 */
export interface FlatElementData<D extends object = CellData> {
  readonly [key: string]: unknown;
  /** User-provided custom data for this element. */
  readonly data?: D;
  /** X position of the element. */
  readonly x?: number;
  /** Y position of the element. */
  readonly y?: number;
  /** Width of the element. */
  readonly width?: number;
  /** Height of the element. */
  readonly height?: number;
  /** Angle of the element in degrees. */
  readonly angle?: number;
  /** Z-index of the cell. */
  readonly z?: number;
  /** Parent element id. */
  readonly parent?: string;
  /** Layer id for the cell. */
  readonly layer?: string;
  /** Style defaults applied to all ports. Individual port properties take precedence. */
  readonly portStyle?: Partial<FlatElementPort>;
  /** Ports of the element. */
  readonly ports?: Record<string, FlatElementPort>;
}

// ── Link Types ────────────────────────────────────────────────────────────────

/**
 * Link endpoint definition.
 *
 * - A string is an element ID (connects to the element's center).
 * - An object with `x` and `y` connects to a fixed point on the canvas.
 *
 * Port, anchor, connectionPoint and magnet are specified via separate
 * top-level properties on {@link FlatLinkData} (e.g. `sourcePort`, `sourceAnchor`).
 * @group Graph
 */
export type FlatLinkEnd = CellId | { readonly x: number; readonly y: number };

/**
 * Visual/presentation attributes for a link line and its wrapper.
 *
 * All properties are optional.  `defaultLinkStyle` satisfies the full
 * `Required<FlatLinkPresentationData>` to provide fallback values.
 * @group Graph
 */
export interface FlatLinkPresentationData {
  readonly [key: string]: unknown;
  /**
   * Stroke color of the link line.
   * Accepts any CSS color value, including CSS variables like `'var(--my-color)'`.
   * When set to `''`, the `--jr-link-color` CSS variable from theme.css controls the stroke.
   */
  readonly color?: string;
  /**
   * Stroke width of the link line.
   * Accepts a number (pixels) or a CSS value string like `'var(--my-width)'`.
   * When set to `''`, the `--jr-link-width` CSS variable from theme.css controls the width.
   */
  readonly width?: number | string;
  /**
   * Source marker name, custom marker definition, or JSX markup.
   * Use 'none' for no marker.
   * @example
   * sourceMarker: 'arrow'
   * sourceMarker: jsx(<path d="M 0 0 L 8 -4 V 4 z" fill="context-stroke" />)
   * @default 'none'
   */
  readonly sourceMarker?: LinkMarker;
  /**
   * Target marker name, custom marker definition, or JSX markup.
   * Use 'none' for no marker.
   * @example
   * targetMarker: 'arrow'
   * targetMarker: jsx(<path d="M 0 0 L 8 -4 V 4 z" fill="context-stroke" />)
   * @default 'none'
   */
  readonly targetMarker?: LinkMarker;
  /**
   * CSS class name to apply to the link line.
   * @default ''
   */
  readonly className?: string;
  /**
   * Stroke dash pattern for the link line.
   * Accepts SVG `stroke-dasharray` syntax (e.g., `'5,5'` for dashed).
   * @default ''
   */
  readonly dasharray?: string;
  /**
   * Stroke line cap for the link line.
   * @default ''
   */
  readonly linecap?: LiteralUnion<'butt' | 'round' | 'square'>;
  /**
   * Stroke line join for the link line.
   * @default ''
   */
  readonly linejoin?: LiteralUnion<'miter' | 'round' | 'bevel'>;
  /**
   * Stroke width of the link wrapper (hit area) in pixels.
   * @default 10
   */
  readonly wrapperWidth?: number;
  /**
   * Stroke color of the link wrapper (outline).
   * Set to a visible color to create a double-line effect.
   * @default 'transparent'
   */
  readonly wrapperColor?: string;
  /**
   * CSS class name to apply to the link wrapper (outline).
   * @default ''
   */
  readonly wrapperClassName?: string;
}

/**
 * Simplified label definition for graph links.
 * @group Graph
 */
export interface FlatLinkLabel {
  /**
   * Label text content.
   */
  readonly text: string;
  /**
   * Position along the link. A number between 0 and 1 is a ratio,
   * a number greater than 1 is an absolute distance in pixels.
   */
  readonly position?: number;
  /**
   * Offset perpendicular to the link path.
   * A number is a perpendicular distance; an object `{ x, y }` is an absolute offset.
   * Updated when the user drags a label interactively.
   */
  readonly offset?: number | { readonly x: number; readonly y: number };
  /**
   * Text color.
   */
  readonly color?: string;
  /**
   * Background color of the label rectangle.
   */
  readonly backgroundColor?: string;
  /**
   * Padding between the text and the background rectangle.
   * A single number applies uniform padding, or use `{ x, y }` for horizontal/vertical.
   * @default { x: 4, y: 2 }
   */
  readonly backgroundPadding?: number | { readonly x: number; readonly y: number };
  /**
   * Font size of the label text.
   */
  readonly fontSize?: number;
  /**
   * Font family of the label text.
   */
  readonly fontFamily?: string;
  /**
   * CSS class name applied to the label text element.
   */
  readonly className?: string;
  /**
   * Outline (stroke) color of the label background rectangle.
   */
  readonly backgroundOutline?: string;
  /**
   * Outline (stroke) width of the label background rectangle.
   */
  readonly backgroundOutlineWidth?: number;
  /**
   * Border radius of the label background rectangle.
   */
  readonly backgroundBorderRadius?: number;
  /**
   * Opacity of the label background rectangle (0–1).
   */
  readonly backgroundOpacity?: number;
  /**
   * CSS class name applied to the label background rectangle.
   */
  readonly backgroundClassName?: string;
  /**
   * Shape of the label background.
   * - `'rect'` — rectangle (default)
   * - `'ellipse'` — ellipse
   * - Any other string — interpreted as SVG path `d` commands (supports `calc()` expressions via `ref`)
   * @default 'rect'
   */
  readonly backgroundShape?: LiteralUnion<'rect' | 'ellipse'>;
}

/**
 * Base interface for graph link.
 * It's a subset of `dia.Link` with some additional properties.
 * @group Graph
 * @see https://docs.jointjs.com/learn/features/shapes/links/#dialink
 */
// New type re-exports — use these in new code, old Flat* names kept for compatibility.
export type {
  CellData,
  ElementLayout,
  ElementPosition,
  ElementSize,
  DEFAULT_ELEMENT_LAYOUT,
} from './cell-data';

/**
 * Base interface for graph links.
 * The generic `D` represents the user's custom data, stored in the `data` field.
 * @group Graph
 */
export interface FlatLinkData<D extends object = CellData>
  extends FlatLinkPresentationData {
  /** User-provided custom data for this link. */
  readonly data?: D;
  /** Z-index of the cell. */
  readonly z?: number;
  /** Parent element id. */
  readonly parent?: string;
  /** Layer id for the cell. */
  readonly layer?: string;
  /**
   * Source element id or point.
   */
  readonly source?: FlatLinkEnd;
  /**
   * Target element id or point.
   */
  readonly target?: FlatLinkEnd;
  /**
   * Source port id.
   */
  readonly sourcePort?: string;
  /**
   * Target port id.
   */
  readonly targetPort?: string;
  /**
   * Source anchor definition.
   * @see https://docs.jointjs.com/learn/features/links/anchors
   */
  readonly sourceAnchor?: anchors.AnchorJSON;
  /**
   * Target anchor definition.
   * @see https://docs.jointjs.com/learn/features/links/anchors
   */
  readonly targetAnchor?: anchors.AnchorJSON;
  /**
   * Source connection point definition.
   * @see https://docs.jointjs.com/learn/features/links/connection-points
   */
  readonly sourceConnectionPoint?: connectionPoints.ConnectionPointJSON;
  /**
   * Target connection point definition.
   * @see https://docs.jointjs.com/learn/features/links/connection-points
   */
  readonly targetConnectionPoint?: connectionPoints.ConnectionPointJSON;
  /**
   * Source magnet selector.
   * CSS selector of the SVG element used as the connection magnet on the source.
   */
  readonly sourceMagnet?: string;
  /**
   * Target magnet selector.
   * CSS selector of the SVG element used as the connection magnet on the target.
   */
  readonly targetMagnet?: string;
  /**
   * Link vertices (waypoints).
   */
  readonly vertices?: dia.Link.Vertex[];
  /**
   * Link router configuration.
   */
  readonly router?: unknown;
  /**
   * Link connector configuration.
   */
  readonly connector?: unknown;
  /**
   * Style defaults applied to all labels. Individual label properties take precedence.
   */
  readonly labelStyle?: Partial<FlatLinkLabel>;
  /**
   * Link labels.
   */
  readonly labels?: Record<string, FlatLinkLabel>;
}
