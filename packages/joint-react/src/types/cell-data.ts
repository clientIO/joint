// ── Constraint ──────────────────────────────────────────────────────────────

/**
 * Base constraint for user-provided data in elements and links.
 * Uses `Record<string, unknown>` as the default type for untyped data access,
 * but constraints throughout the codebase use `extends object` which
 * allows both interfaces and type aliases.
 */
export type CellData = Record<string, unknown>;

// ── Shared ──────────────────────────────────────────────────────────────────

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
