import type {
  Cell as DiaCell,
  Element as DiaElement,
  Link as DiaLink,
  Point as DiaPoint,
  Size as DiaSize,
} from '@joint/core/dia';
import type { ELEMENT_MODEL_TYPE } from '../models/element-model';
import type { LINK_MODEL_TYPE } from '../models/link-model';
import type { ElementPort } from '../presets/element-ports';
import type { LinkStyle } from '../presets/link-style';
import type { LinkLabel } from '../presets/link-labels';

type PickRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
/** Known cell type names. */
export type KnownCellType = typeof ELEMENT_MODEL_TYPE | typeof LINK_MODEL_TYPE;

/** Minimal shape any keyed record must satisfy to live in a container. */
export interface WithOptionalId {
  readonly id?: DiaCell.ID;
}

/** Adds a discriminating `type` field on top of {@link WithOptionalId}. */
export interface WithType<Type = KnownCellType> extends WithOptionalId {
  readonly type: Type;
}

type WithData<Data = unknown> = unknown extends Data
  ? { readonly data?: unknown }
  : { readonly data: Data };

/**
 * Structural upper bound for any element-like cell.
 *
 * - Extends {@link WithOptionalId} and passes through JointJS `dia.Element.Attributes`
 *   (minus `id`, `type`, `position`, `size`, `angle` which we narrow below).
 * - Narrows `position` / `size` / `angle` to the React-side aliases.
 * - Allows arbitrary extra fields via the index signature so callers can
 *   attach custom data without losing type safety on known fields.
 */
export interface DiaElementAttributes extends WithOptionalId, WithData, DiaElement.Attributes {
  readonly portMap?: Record<string, ElementPort>;
  readonly portStyle?: Partial<ElementPort>;
  readonly type?: string;
}

/** Element-flavored cell; narrowed when `type === ELEMENT_MODEL_TYPE`. */
export type ElementRecord<ElementData = unknown> = DiaElementAttributes &
  WithType<typeof ELEMENT_MODEL_TYPE> &
  WithData<ElementData>;

/**
 * Internal element record shape — what the store holds after JointJS /
 * `elementAttributes` defaults are applied. Reach via {@link Computed}
 * (`Computed<ElementRecord<MyData>>`); kept private so the public surface is
 * a single utility.
 *
 * Always populated by the framework:
 * - `position` — `dia.Element` defaults to `{ x: 0, y: 0 }`.
 * - `size` — `dia.Element` defaults to `{ width: 1, height: 1 }`.
 * - `angle` — `dia.Element` defaults to `0`.
 * - `data` — `elementAttributes` defaults to `{} as ElementData`.
 */
type InternalElementRecord<ElementData = unknown> = PickRequired<
  ElementRecord<ElementData>,
  'id' | 'type' | 'position' | 'size' | 'angle' | 'data'
>;

/**
 * Structural upper bound for any link-like cell.
 *
 * - Extends {@link WithOptionalId} and passes through JointJS `dia.Link.Attributes`
 *   (minus `id`, `type`, `source`, `target` which we narrow below).
 * - Narrows `source` / `target` to `dia.Link.EndJSON`.
 * - Allows arbitrary extra fields via the index signature so callers can
 *   attach custom data without losing type safety on known fields.
 */
export interface DiaLinkAttributes extends WithOptionalId, WithData, DiaLink.Attributes {
  readonly style?: LinkStyle;
  readonly labelMap?: Record<string, LinkLabel>;
  readonly labelStyle?: Partial<LinkLabel>;
  readonly type?: string;
}

/** Link-flavored cell; narrowed when `type === LINK_MODEL_TYPE`. */

export type LinkRecord<LinkData = unknown> = DiaLinkAttributes &
  WithType<typeof LINK_MODEL_TYPE> &
  WithData<LinkData>;

/**
 * Internal link record shape — what the store holds after JointJS /
 * `linkAttributes` defaults are applied. Reach via {@link Computed}
 * (`Computed<LinkRecord<MyData>>`); kept private so the public surface is a
 * single utility.
 *
 * Always populated by the framework:
 * - `source` — `dia.Link` defaults to `{}`.
 * - `target` — `dia.Link` defaults to `{}`.
 * - `data` — `linkAttributes` defaults to `{} as LinkData`.
 */
type InternalLinkRecord<LinkData = unknown> = PickRequired<
  LinkRecord<LinkData>,
  'id' | 'type' | 'source' | 'target' | 'data'
>;
/**
 * Structural upper bound for any cell record. Use as the constraint when
 * defining custom cell types with non-`'element'` / non-`'link'` `type`
 * literals — extend either {@link DiaElementAttributes} or {@link DiaLinkAttributes}
 * (or this union) and pick your own `type` literal:
 * ```ts
 * interface MyCustomNode extends ElementAttributes {
 *   readonly type: 'my-node';
 *   readonly data: MyData;
 * }
 * type AppCell = CellRecord | MyCustomNode;
 * ```
 */
export type DiaCellAttributes = DiaElementAttributes | DiaLinkAttributes;

/**
 * Discriminated union over the `type` literal:
 * - `type === 'element'` → {@link ElementRecord}
 * - `type === 'link'`    → {@link LinkRecord}
 *
 * For custom `type` literals, extend the union explicitly:
 * `CellRecord | MyCustomRecord`. The default union excludes a catch-all
 * "any string" branch on purpose so `if (cell.type === 'element')` narrows
 * correctly.
 */
export type CellRecord<ElementData = unknown, LinkData = unknown> =
  | ElementRecord<ElementData>
  | LinkRecord<LinkData>;

/**
 * Union of the records this `useGraph` instance accepts as cell input —
 * either a typed `Element` or `Link` record. To support custom cell types,
 * extend the union at the call site (e.g. `useGraph<MyElement | MyCustom, MyLink>`).
 * @template Element - element record shape
 * @template Link - link record shape
 */
export type CellUnion<
  Element extends DiaElementAttributes = DiaElementAttributes,
  Link extends DiaLinkAttributes = DiaLinkAttributes,
> = Element | Link;
/**
 * Resolves any input cell shape to its internal store form — the variant with
 * framework-populated fields (`id`, `position`, `size`, `angle`, `data` for
 * elements; `id`, `source`, `target`, `data` for links) required.
 *
 * Distributes over unions, so a single utility covers every input flavor:
 *
 * | Input                              | Result                            |
 * |------------------------------------|-----------------------------------|
 * | `Computed<ElementRecord<D>>`       | element with required fields      |
 * | `Computed<LinkRecord<D>>`          | link with required fields         |
 * | `Computed<ElementAttributes>`      | element with `data: unknown`      |
 * | `Computed<LinkAttributes>`         | link with `data: unknown`         |
 * | `Computed<CellRecord<E, L>>`       | resolved element or resolved link |
 * | `Computed<CellAttributes>`         | resolved element or resolved link |
 * | `Internal` (default)               | `Computed<CellRecord>`            |
 *
 * Custom records (with their own `type` literal that doesn't match
 * `ElementRecord` / `LinkRecord`) pass through unchanged so the store shape
 * can be composed: `Computed<CellRecord> | MyCustomRecord`.
 *
 * Reading hooks (`useCell`, `useCells`) yield the `Computed` variant so
 * consumers don't need `?? {}` / `?? 0` fallbacks for fields the store
 * always populates.
 * @example
 * ```ts
 * useCell((el: Computed<ElementRecord<MyData>>) => el.data.label);
 * ```
 */
export type Computed<T = CellRecord> =
  T extends ElementRecord<infer ElementData>
    ? InternalElementRecord<ElementData>
    : T extends LinkRecord<infer LinkData>
      ? InternalLinkRecord<LinkData>
      : T extends DiaElementAttributes
        ? InternalElementRecord<T['data']>
        : T extends DiaLinkAttributes
          ? InternalLinkRecord<T['data']>
          : T;

/** Short alias for cell ids; same as dia.Cell.ID. */
// @todo - remove, and just use jointjs dia.Cell.ID everywhere. This type alias doesn't add anything and just creates an extra import to keep in sync.
export type CellId = DiaCell.ID;

// ── Element Layout Aliases ──────────────────────────────────────────────────

/** Position of an element — alias for `dia.Point`. */
export type ElementPosition = DiaPoint;

/** Size of an element — alias for `dia.Size`. */
export type ElementSize = DiaSize;

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
