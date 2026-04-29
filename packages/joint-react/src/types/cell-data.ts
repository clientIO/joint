// ── Constraint ──────────────────────────────────────────────────────────────

import type { dia } from '@joint/core';

/**
 * Base constraint for user-provided data in elements and links.
 * Uses `Record<string, unknown>` as the default type for untyped data access,
 * but constraints throughout the codebase use `extends object` which
 * allows both interfaces and type aliases.
 */

// ── Element Layout Aliases ──────────────────────────────────────────────────

/** Position of an element — alias for `dia.Point`. */
export type ElementPosition = dia.Point;

/** Size of an element — alias for `dia.Size`. */
export type ElementSize = dia.Size;

// ── Element Layout (internal — used by size observer) ───────────────────────

/**
 * Flat element layout used internally by the size observer and transform callbacks.
 * @internal
 */
export interface ElementLayout {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly angle: number;
}

// ── Link Layout (internal) ──────────────────────────────────────────────────

/**
 * Layout data for a single link on a specific paper.
 * Contains source/target endpoint coordinates and the SVG path data.
 * @internal
 */
export interface LinkLayout {
  readonly sourceX: number;
  readonly sourceY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly d: string;
}
