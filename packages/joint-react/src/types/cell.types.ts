import type {
  Cell as DiaCell,
  Element as DiaElement,
  Graph as DiaGraph,
  Link as DiaLink,
  Point as DiaPoint,
  Size as DiaSize,
} from '@joint/core/types/dia';
import type { Collection as MvcCollection } from '@joint/core/types/mvc';
import type { ELEMENT_MODEL_TYPE } from '../mvc/element-model';
import type { LINK_MODEL_TYPE } from '../mvc/link-model';
import type { LinkPresetAttributes } from '../presets/link-attributes';
import type { ElementPresetAttributes } from '../presets/element-attributes';

/**
 * Loose element shape accepted at the record/mapper boundary: a `dia.Element`
 * JSON init (optional `id`, plus `type` and visual attrs) with the React preset
 * extras and an optional typed `data` payload.
 * @group Types
 */
export interface ElementJSONInit extends DiaElement.JSONInit, ElementPresetAttributes {
  data?: unknown;
}

/**
 * Loose link shape accepted at the record/mapper boundary: a `dia.Link` JSON
 * init (optional `id`, plus `type` and visual attrs) with the React preset
 * extras and an optional typed `data` payload.
 * @group Types
 */
export interface LinkJSONInit extends DiaLink.JSONInit, LinkPresetAttributes {
  data?: unknown;
}

/**
 * Plain-object description of one element: your custom `data` plus the visual
 * fields JointJS understands (`position`, `size`, `angle`, `attrs`, ports, and
 * the `portMap`/`portStyle` preset extras). Use it for `initialCells` entries
 * and when adding or updating cells; reading hooks hand back its
 * `Computed<ElementRecord>` form (fields the store always populates are required).
 *
 * `Type` defaults to `'element'` so `cell.type === 'element'` narrows the
 * {@link CellRecord} union; set it to a shape name (e.g. `'standard.Rectangle'`)
 * for a built-in or custom shape.
 * @template ElementData - shape of the custom `data` payload carried on the element
 * @template Type - the `type` discriminator literal
 * @group Types
 */
// `data` is optional while untyped and required once typed. Spelled out (not a
// helper alias) so the API docs show the shape instead of a private name.
export type ElementRecord<
  ElementData = unknown,
  Type extends string = typeof ELEMENT_MODEL_TYPE,
> = ElementJSONInit & { readonly type: Type } & (unknown extends ElementData
    ? { readonly data?: unknown }
    : { readonly data: ElementData });

/**
 * An {@link ElementRecord} as the store holds it, after JointJS /
 * {@link elementAttributes} defaults are applied: what
 * `Computed<ElementRecord<MyData>>` resolves to and what reading hooks hand back.
 *
 * Always populated by the framework:
 * - `position`, `dia.Element` defaults to `{ x: 0, y: 0 }`.
 * - `size`, `dia.Element` defaults to `{ width: 1, height: 1 }`.
 * - `angle`, `dia.Element` defaults to `0`.
 * - `data`, {@link elementAttributes} defaults to `{} as ElementData`.
 * @template ElementData - shape of the custom `data` payload carried on the element
 * @group Types
 */
export type ComputedElementRecord<ElementData = unknown> = ElementRecord<ElementData> &
  Required<
    Pick<ElementRecord<ElementData>, 'id' | 'type' | 'position' | 'size' | 'angle' | 'data'>
  >;

/**
 * Plain-object description of one link: your custom `data` plus the visual
 * fields JointJS understands (`source`, `target`, `attrs`, labels, and the
 * `style`/`labelMap`/`labelStyle` preset extras). Use it for `initialCells`
 * entries and when adding or updating cells; reading hooks hand back its
 * `Computed<LinkRecord>` form (fields the store always populates are required).
 *
 * `Type` defaults to `'link'` so `cell.type === 'link'` narrows the
 * {@link CellRecord} union; set it to a shape name (e.g. `'standard.Link'`) for
 * a built-in or custom shape.
 * @template LinkData - shape of the custom `data` payload carried on the link
 * @template Type - the `type` discriminator literal
 * @group Types
 */
// Same `data` rule as `ElementRecord`.
export type LinkRecord<
  LinkData = unknown,
  Type extends string = typeof LINK_MODEL_TYPE,
> = LinkJSONInit & { readonly type: Type } & (unknown extends LinkData
    ? { readonly data?: unknown }
    : { readonly data: LinkData });

/**
 * A {@link LinkRecord} as the store holds it, after JointJS /
 * {@link linkAttributes} defaults are applied: what
 * `Computed<LinkRecord<MyData>>` resolves to and what reading hooks hand back.
 *
 * Always populated by the framework:
 * - `source`, `dia.Link` defaults to `{}`.
 * - `target`, `dia.Link` defaults to `{}`.
 * - `data`, {@link linkAttributes} defaults to `{} as LinkData`.
 * @template LinkData - shape of the custom `data` payload carried on the link
 * @group Types
 */
export type ComputedLinkRecord<LinkData = unknown> = LinkRecord<LinkData> &
  Required<Pick<LinkRecord<LinkData>, 'id' | 'type' | 'source' | 'target' | 'data'>>;
/**
 * One cell — either an {@link ElementRecord} or a {@link LinkRecord} — as a
 * discriminated union on `type`:
 * - `type === 'element'` → {@link ElementRecord}
 * - `type === 'link'`    → {@link LinkRecord}
 *
 * Because it discriminates on `type`, `if (cell.type === 'element')` narrows
 * correctly inside arrays and hooks. For mixed built-in shape arrays with typed
 * data, build the union yourself:
 * `ElementRecord<MyData, 'standard.Rectangle'> | LinkRecord<MyData, 'standard.Link'>`.
 * @template ElementData - shape of the custom `data` payload on elements
 * @template LinkData - shape of the custom `data` payload on links
 * @template ElementType - the element `type` discriminator literal
 * @template LinkType - the link `type` discriminator literal
 * @group Types
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
 * The most permissive {@link CellRecord}: `data` is `unknown` and `type` is any
 * string. Reach for it when you don't need the default `'element'` / `'link'`
 * discrimination — for example an `initialCells` array mixing built-in shape
 * types, or a generic upper bound in a custom hook.
 * @group Types
 */
export type AnyCellRecord = CellRecord<unknown, unknown, string, string>;

/**
 * Resolves any input cell shape to its internal store form, the variant with
 * framework-populated fields (`id`, `position`, `size`, `angle`, `data` for
 * elements; `id`, `source`, `target`, `data` for links) required.
 *
 * Distributes over unions, so a single utility covers every input flavor:
 *
 * | Input                              | Result                            |
 * |------------------------------------|-----------------------------------|
 * | `Computed<ElementRecord<D>>`       | element with required fields      |
 * | `Computed<LinkRecord<D>>`          | link with required fields         |
 * | `Computed<CellRecord<E, L>>`       | resolved element or resolved link |
 *
 * To keep a custom record's exact shape, compose it OUTSIDE the wrapper, e.g.
 * `Computed<CellRecord> | MyCustomRecord`. Passing a custom element- or
 * link-shaped record (any object with a `type` field) directly through
 * `Computed` re-maps it to the internal element/link record, because it
 * structurally matches the same branch as {@link ElementRecord} /
 * {@link LinkRecord}.
 *
 * Reading hooks ({@link useCell}, {@link useCells}) yield the `Computed` variant so
 * consumers don't need `?? {}` / `?? 0` fallbacks for fields the store
 * always populates.
 * @template T - the input cell shape (record or union) to resolve
 * @example
 * ```ts
 * import { useCell } from '@joint/react';
 * import type { Computed, ElementRecord } from '@joint/react';
 *
 * interface MyData {
 *   label: string;
 * }
 *
 * const label = useCell((el: Computed<ElementRecord<MyData>>) => el.data.label);
 * ```
 * @group Types
 */
export type Computed<T> =
  T extends ElementRecord<infer ElementData>
    ? ComputedElementRecord<ElementData>
    : T extends LinkRecord<infer LinkData>
      ? ComputedLinkRecord<LinkData>
      : T extends ElementJSONInit
        ? ComputedElementRecord<T['data']>
        : T extends LinkJSONInit
          ? ComputedLinkRecord<T['data']>
          : T;

// Future cleanup: drop this alias and use `dia.Cell.ID` directly everywhere.
// It doesn't add anything and creates an extra import to keep in sync.
/**
 * Short alias for cell ids; same as `dia.Cell.ID`.
 * @group Types
 */
export type CellId = DiaCell.ID;

// ── Element Layout Aliases ──────────────────────────────────────────────────

/**
 * An element's top-left position, `{ x, y }`. Alias for `dia.Point`.
 * @group Types
 */
export type ElementPosition = DiaPoint;

/**
 * An element's bounding-box size, `{ width, height }`. Alias for `dia.Size`.
 * @group Types
 */
export type ElementSize = DiaSize;

// ── Element Layout (internal — used by size observer) ───────────────────────

/**
 * Flat element layout used by the size observer and transform callbacks.
 * @group Types
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
 * Resolved geometry of one link on a specific paper: the source and target
 * endpoint coordinates plus the rendered SVG path. Returned by
 * {@link useLinkLayout} so you can draw or measure alongside a link.
 * @group Types
 */
export interface LinkLayout {
  /** X coordinate of the link's source endpoint, in paper coordinates. */
  readonly sourceX: number;
  /** Y coordinate of the link's source endpoint, in paper coordinates. */
  readonly sourceY: number;
  /** X coordinate of the link's target endpoint, in paper coordinates. */
  readonly targetX: number;
  /** Y coordinate of the link's target endpoint, in paper coordinates. */
  readonly targetY: number;
  /** SVG path data (the `d` attribute) for the link's rendered route. */
  readonly d: string;
}

/**
 * What you may pass when handing a cell to the library: either a plain element
 * or link record, or a live `dia.Cell` instance. Accepted by every
 * cell-mutation entry point — `initialCells`, `resetCells`, and the cell setters.
 * @template Element - element record shape
 * @template Link - link record shape
 * @group Types
 */
export type CellInput<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
> = Element | Link | DiaCell;

/**
 * A reference to a cell — either its {@link CellId} or the `dia.Cell` instance
 * itself. Alias for JointJS core's `dia.Graph.CellRef`.
 * @group Types
 */
export type CellRef = DiaGraph.CellRef;

/**
 * A JointJS cell collection (e.g. the `collection` from a selection). Iterable —
 * it yields its `dia.Cell` models — so it can be passed directly to the bulk
 * cell setters instead of `collection.toArray()`.
 * @group Types
 */
export type CellCollection = MvcCollection<DiaCell>;

/**
 * A list of cell references accepted by `removeCells`: either a readonly array
 * of {@link CellRef}s (ids and/or `dia.Cell` instances) or a {@link CellCollection}.
 * Both are iterated the same way.
 * @group Types
 */
export type CellRefList = readonly CellRef[] | CellCollection;
