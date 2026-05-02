import type {
  Cell as DiaCell,
  Point as DiaPoint,
  Size as DiaSize,
} from '@joint/core/dia';
import type { ELEMENT_MODEL_TYPE } from '../models/element-model';
import type { LINK_MODEL_TYPE } from '../models/link-model';
import type { LinkJSONInit } from '../presets/link-attributes';
import type { ElementJSONInit } from '../presets/element-attributes';

type PickRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
/** Known cell type names. */
type KnownCellType = typeof ELEMENT_MODEL_TYPE | typeof LINK_MODEL_TYPE;

interface WithType<Type extends string = KnownCellType> {
  readonly type: Type;
}

type WithData<Data = unknown> = unknown extends Data
  ? { readonly data?: unknown }
  : { readonly data: Data };

/** Element-flavored cell; narrowed when `type === ELEMENT_MODEL_TYPE`. */
export type ElementRecord<ElementData = unknown> = ElementJSONInit &
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

/** Link-flavored cell; narrowed when `type === LINK_MODEL_TYPE`. */
export type LinkRecord<LinkData = unknown> = LinkJSONInit &
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
 * literals — extend either {@link DiaElementRecord} or {@link DiaLinkRecord}
 * (or this union) and pick your own `type` literal:
 * ```ts
 * interface MyCustomNode extends DiaElementRecord {
 *   readonly type: 'my-node';
 *   readonly data: MyData;
 * }
 * type AppCell = CellRecord | MyCustomNode;
 * ```
 */

export interface DiaElementRecord extends ElementJSONInit {
  data?: unknown;
}
export interface DiaLinkRecord extends LinkJSONInit {
  data?: unknown;
}

export type DiaCellRecord = DiaElementRecord | DiaLinkRecord;

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
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
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
      : T extends ElementJSONInit
        ? InternalElementRecord<T['data']>
        : T extends LinkJSONInit
          ? InternalLinkRecord<T['data']>
          : T;

/** Short alias for cell ids; same as dia.Cell.ID. */
// Future cleanup: drop this alias and use `dia.Cell.ID` directly everywhere.
// It doesn't add anything and creates an extra import to keep in sync.
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
