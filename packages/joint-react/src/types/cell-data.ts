import type { anchors, connectionPoints, dia } from '@joint/core';
import type { PortShape } from '../theme/element-theme';
import type { LinkMarker } from '../theme/markers';
import type { LiteralUnion } from './index';

// ── Constraint ──────────────────────────────────────────────────────────────

/** Base constraint for user-provided data in elements and links. */
export type CellData = Record<string, unknown>;

// ── Shared ──────────────────────────────────────────────────────────────────

/**
 * Properties common to all cells (elements and links).
 * @group Graph
 */
export interface CellItem {
  readonly z?: number;
  readonly parent?: string;
  readonly layer?: string;
}

// ── Element Layout ──────────────────────────────────────────────────────────

/**
 * Layout properties stored in elementsLayout container.
 * All fields required — concrete values after initialization.
 * @group Graph
 */
export interface ElementLayout {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly angle: number;
}

/** Subset of ElementLayout representing only the position. */
export interface ElementPosition {
  readonly x: number;
  readonly y: number;
}

/** Subset of ElementLayout representing only the size. */
export interface ElementSize {
  readonly width: number;
  readonly height: number;
}

/**
 * Layout data for a single link.
 * Contains source/target endpoint coordinates and the SVG path data.
 * @group Graph
 */
export interface LinkLayout {
  readonly sourceX: number;
  readonly sourceY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly d: string;
}

/** Default values for element layout when user omits them. */
export const DEFAULT_ELEMENT_LAYOUT = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
  angle: 0,
} as const satisfies ElementLayout;

// ── Element Port ────────────────────────────────────────────────────────────

/**
 * Simplified port definition for declarative port configuration.
 * Converted to full JointJS port format by the default element mapper.
 * @group Graph
 */
export interface ElementPort {
  /** X position of the port. Supports calc() expressions (e.g., 'calc(w)'). */
  readonly cx: number | string;
  /** Y position of the port. Supports calc() expressions (e.g., 'calc(h)'). */
  readonly cy: number | string;
  /** @default 10 */
  readonly width?: number;
  /** @default 10 */
  readonly height?: number;
  /** @default '#333333' */
  readonly color?: string;
  /** @default 'ellipse' */
  readonly shape?: PortShape;
  /** @default 'transparent' */
  readonly outline?: string;
  /** @default 0 */
  readonly outlineWidth?: number;
  readonly className?: string;
  /** @default false */
  readonly passive?: boolean;
  readonly label?: string;
  /** @default 'outside' */
  readonly labelPosition?: string;
  /** @default '#333333' */
  readonly labelColor?: string;
  readonly labelFontSize?: number;
  readonly labelFontFamily?: string;
  readonly labelClassName?: string;
  readonly labelOffsetX?: number;
  readonly labelOffsetY?: number;
}

// ── Element ─────────────────────────────────────────────────────────────────

/**
 * Data properties stored in elements data container.
 * Contains user data and structural properties (ports, z-index, parent).
 * @group Graph
 */
export interface ElementItem<D extends object = CellData> extends CellItem {
  readonly data: D;
  readonly ports?: Record<string, ElementPort>;
  readonly portStyle?: Partial<ElementPort>;
}

/**
 * What user provides to GraphProvider.
 * The mapper splits this into {@link ElementItem} (data container) + {@link ElementLayout} (layout container).
 * @group Graph
 */
export interface ElementInput<D extends object = CellData>
  extends Omit<ElementItem<D>, 'data'>,
    Partial<ElementLayout> {
  /** User-provided custom data. Defaults to `{}` when omitted. */
  readonly data?: D;
}

// ── Link End ────────────────────────────────────────────────────────────────

/**
 * Link endpoint definition.
 * A string is an element ID. An object with `x` and `y` connects to a fixed point.
 * @group Graph
 */
export type LinkEnd = string | { readonly x: number; readonly y: number };

// ── Link Label ──────────────────────────────────────────────────────────────

/**
 * Simplified label definition for graph links.
 * @group Graph
 */
export interface LinkLabel {
  readonly text: string;
  readonly position?: number;
  readonly offset?: number | { readonly x: number; readonly y: number };
  readonly color?: string;
  readonly backgroundColor?: string;
  /** @default { x: 4, y: 2 } */
  readonly backgroundPadding?: number | { readonly x: number; readonly y: number };
  readonly fontSize?: number;
  readonly fontFamily?: string;
  readonly className?: string;
  readonly backgroundOutline?: string;
  readonly backgroundOutlineWidth?: number;
  readonly backgroundBorderRadius?: number;
  readonly backgroundOpacity?: number;
  readonly backgroundClassName?: string;
  /** @default 'rect' */
  readonly backgroundShape?: LiteralUnion<'rect' | 'ellipse'>;
}

// ── Link Presentation ───────────────────────────────────────────────────────

/**
 * Visual/presentation attributes for a link line and its wrapper.
 * @group Graph
 */
export interface LinkPresentationData {
  readonly color?: string;
  readonly width?: number | string;
  /** @default 'none' */
  readonly sourceMarker?: LinkMarker;
  /** @default 'none' */
  readonly targetMarker?: LinkMarker;
  readonly className?: string;
  readonly dasharray?: string;
  readonly linecap?: LiteralUnion<'butt' | 'round' | 'square'>;
  readonly linejoin?: LiteralUnion<'miter' | 'round' | 'bevel'>;
  /** @default 10 */
  readonly wrapperWidth?: number;
  /** @default 'transparent' */
  readonly wrapperColor?: string;
  readonly wrapperClassName?: string;
}

// ── Link ────────────────────────────────────────────────────────────────────

/**
 * Data properties stored in links data container.
 * Contains user data, connection info, and presentation attributes.
 * @group Graph
 */
export interface LinkItem<D extends object = CellData> extends CellItem, LinkPresentationData {
  readonly data: D;
  readonly source: LinkEnd;
  readonly target: LinkEnd;
  readonly sourcePort?: string;
  readonly targetPort?: string;
  readonly sourceAnchor?: anchors.AnchorJSON;
  readonly targetAnchor?: anchors.AnchorJSON;
  readonly sourceConnectionPoint?: connectionPoints.ConnectionPointJSON;
  readonly targetConnectionPoint?: connectionPoints.ConnectionPointJSON;
  readonly sourceMagnet?: string;
  readonly targetMagnet?: string;
  readonly vertices?: dia.Link.Vertex[];
  readonly router?: unknown;
  readonly connector?: unknown;
  readonly labelStyle?: Partial<LinkLabel>;
  readonly labels?: Record<string, LinkLabel>;
}

/**
 * What user provides to GraphProvider.
 * Same as {@link LinkItem} but with optional `data` — defaults to `{}` when omitted.
 * @group Graph
 */
export type LinkInput<D extends object = CellData> = Omit<LinkItem<D>, 'data'> & {
  /** User-provided custom data. Defaults to `{}` when omitted. */
  readonly data?: D;
};
