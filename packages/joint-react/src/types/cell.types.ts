import type {
  Cell as DiaCell,
  Element as DiaElement,
  Link as DiaLink,
  Point as DiaPoint,
  Size as DiaSize,
} from '@joint/core/dia';
import type { ELEMENT_MODEL_TYPE } from '../models/element-model';
import type { LINK_MODEL_TYPE } from '../models/link-model';
import type { LinkPresetAttributes } from '../presets/link-attributes';
import type { ElementPresetAttributes } from '../presets/element-attributes';

/**
 * `dia.Element.JSONInit` (id?, type, visual attrs) + React preset extras
 * + an explicit `data?: unknown` declaration that narrows the
 * `Cell.Attributes` index signature (`[customAttribute: string]: any`) at
 * the upper-bound layer.
 */
export interface ElementJSONInit extends DiaElement.JSONInit, ElementPresetAttributes {
  data?: unknown;
}

/**
 * `dia.Link.JSONInit` (id?, type, visual attrs) + React preset extras
 * + an explicit `data?: unknown` declaration that narrows the
 * `Cell.Attributes` index signature (`[customAttribute: string]: any`) at
 * the upper-bound layer.
 */
export interface LinkJSONInit extends DiaLink.JSONInit, LinkPresetAttributes {
  data?: unknown;
}

type PickRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
/** Known cell type names. */
type KnownCellType = typeof ELEMENT_MODEL_TYPE | typeof LINK_MODEL_TYPE;

interface WithType<Type extends string = KnownCellType> {
  readonly type: Type;
}

type WithData<Data = unknown> = unknown extends Data
  ? { readonly data?: unknown }
  : { readonly data: Data };

/**
 * Element-flavored cell; default `Type = typeof ELEMENT_MODEL_TYPE` so
 * `cell.type === 'element'` narrows. Override `Type` (e.g.
 * `'standard.Rectangle'`) for built-in or custom shapes.
 */
export type ElementRecord<
  ElementData = unknown,
  Type extends string = typeof ELEMENT_MODEL_TYPE,
> = ElementJSONInit & WithType<Type> & WithData<ElementData>;

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
 * Link-flavored cell; default `Type = typeof LINK_MODEL_TYPE` so
 * `cell.type === 'link'` narrows. Override `Type` (e.g. `'standard.Link'`)
 * for built-in or custom shapes.
 */
export type LinkRecord<
  LinkData = unknown,
  Type extends string = typeof LINK_MODEL_TYPE,
> = LinkJSONInit & WithType<Type> & WithData<LinkData>;

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
 * Discriminated union over the React default `type` literals:
 * - `type === 'element'` → {@link ElementRecord}
 * - `type === 'link'`    → {@link LinkRecord}
 *
 * `cell.type === 'element'` narrows correctly inside arrays / hooks. For
 * mixed built-in shape arrays with typed data, build the union manually:
 * `ElementRecord<MyData, 'standard.Rectangle'> | LinkRecord<MyData, 'standard.Link'>`.
 */
export type CellRecord<
  ElementData = unknown,
  LinkData = unknown,
  ElementType extends string = typeof ELEMENT_MODEL_TYPE,
  LinkType extends string = typeof LINK_MODEL_TYPE,
> =
  | ElementRecord<ElementData, ElementType>
  | LinkRecord<LinkData, LinkType>;

/**
 * Loose alias of `CellRecord` — `data` is `unknown`, `type` is any string.
 * Use when you don't care about React-default `'element'` / `'link'`
 * discrimination (e.g. `initialCells` arrays mixing built-in shape types,
 * generic upper bounds in custom hooks).
 */
export type AnyCellRecord = CellRecord<unknown, unknown, string, string>;

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
