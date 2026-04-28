import type { Cell as DiaCell, Element as DiaElement, Link as DiaLink } from '@joint/core/dia';
import type { ELEMENT_MODEL_TYPE } from '../models/element-model';
import type { LINK_MODEL_TYPE } from '../models/link-model';
import type { ElementPosition, ElementSize } from './cell-data';
import type { ElementPort } from '../presets/element-ports';
import type { LinkStyle } from '../presets/link-style';
import type { LinkLabel } from '../presets/link-labels';

/**
 * `string & Record<never, never>` (aka `string & {}`) preserves literal
 * autocomplete on a `Literal | string` union. Plain `string` swallows the
 * literals and kills IntelliSense.
 *
 * NB: `Exclude<string, 'foo'>` does NOT do what it looks like — `string`
 * isn't a distributable union of every string literal, so Exclude returns
 * `string` unchanged. That's why the previous `StringLiteral<Omit>` helper
 * wasn't doing anything.
 */
type AnyString = string & Record<never, never>;

/** Known cell type names. */
export type KnownCellType = typeof ELEMENT_MODEL_TYPE | typeof LINK_MODEL_TYPE;

/** Known names autocomplete; any other string is still accepted. */
export type CellTypeName = KnownCellType | AnyString;

/** Minimal shape any keyed record must satisfy to live in a container. */
export interface WithId {
  readonly id?: DiaCell.ID;
}

/**
 * Base cell: every cell has a required id and type.
 *
 * Declaring `type: CellTypeName` here — once — is what makes autocomplete
 * work. Each derived interface then narrows `type` to its specific literal.
 *
 * Reference identity rule: a cell object is replaced (new reference) on any
 * field change. Treat each cell as immutable — mutating is a bug.
 */
/** Adds a discriminating `type` field on top of {@link WithId}. */
export interface WithType extends WithId {
  readonly type: CellTypeName;
}

/**
 * Structural upper bound for any element-like cell.
 *
 * - Extends {@link WithId} and passes through JointJS `dia.Element.Attributes`
 *   (minus `id`, `type`, `position`, `size`, `angle` which we narrow below).
 * - Narrows `position` / `size` / `angle` to the React-side aliases.
 * - Allows arbitrary extra fields via the index signature so callers can
 *   attach custom data without losing type safety on known fields.
 */
export interface BaseElementRecord
  extends WithId,
    Omit<DiaElement.Attributes, 'id' | 'type' | 'position' | 'size' | 'angle'> {
  readonly position?: ElementPosition;
  readonly size?: ElementSize;
  readonly angle?: number;
  readonly data?: unknown;
  readonly portMap?: Record<string, ElementPort>;
  readonly portStyle?: Partial<ElementPort>;
  readonly [key: string]: unknown;
  readonly type?: CellTypeName;
}
/** Element-flavored cell; narrowed when `type === ELEMENT_MODEL_TYPE`. */
export interface ElementRecord<ElementData = unknown> extends BaseElementRecord, WithType {
  readonly type: typeof ELEMENT_MODEL_TYPE;
  readonly data: ElementData;
}

/**
 * Element record as it lives in the store after JointJS / `elementAttributes`
 * defaults have been applied. Reading hooks (`useCell`, `useCells`)
 * return the `Resolved` variant so consumers don't need
 * `?? {}` / `?? 0` fallbacks for fields the store always populates.
 *
 * Always populated by the framework:
 * - `position` — JointJS `dia.Element` defaults to `{ x: 0, y: 0 }`.
 * - `size` — JointJS `dia.Element` defaults to `{ width: 1, height: 1 }`.
 * - `angle` — JointJS `dia.Element` defaults to `0`.
 * - `data` — `elementAttributes` defaults to `{} as ElementData`.
 *
 * Use {@link ElementRecord} for input shapes (cell creation, setters) where
 * these fields are optional and will be filled in by the framework.
 */
export interface ResolvedElementRecord<ElementData = unknown> extends BaseElementRecord, WithType {
  readonly id: DiaCell.ID;
  readonly type: typeof ELEMENT_MODEL_TYPE;
  readonly position: Required<ElementPosition>;
  readonly size: Required<ElementSize>;
  readonly angle: number;
  readonly data: ElementData;
}

/**
 * Structural upper bound for any link-like cell.
 *
 * - Extends {@link WithId} and passes through JointJS `dia.Link.Attributes`
 *   (minus `id`, `type`, `source`, `target` which we narrow below).
 * - Narrows `source` / `target` to `dia.Link.EndJSON`.
 * - Allows arbitrary extra fields via the index signature so callers can
 *   attach custom data without losing type safety on known fields.
 */
export interface BaseLinkRecord
  extends WithId,
    Omit<DiaLink.Attributes, 'id' | 'type' | 'source' | 'target'> {
  readonly source?: DiaLink.EndJSON;
  readonly target?: DiaLink.EndJSON;
  readonly data?: unknown;
  readonly style?: LinkStyle;
  readonly labelMap?: Record<string, LinkLabel>;
  readonly labelStyle?: Partial<LinkLabel>;
  readonly [key: string]: unknown;
  readonly type?: CellTypeName;
}

/** Link-flavored cell; narrowed when `type === LINK_MODEL_TYPE`. */
export interface LinkRecord<LinkData = unknown> extends BaseLinkRecord, WithType {
  readonly type: typeof LINK_MODEL_TYPE;
  readonly data?: LinkData;
}

/**
 * Link record as it lives in the store after JointJS / `linkAttributes`
 * defaults have been applied. Reading hooks (`useCell`, `useCells`)
 * return the `Resolved` variant.
 *
 * Always populated by the framework:
 * - `source` — JointJS `dia.Link` defaults to `{}`.
 * - `target` — JointJS `dia.Link` defaults to `{}`.
 * - `data` — `linkAttributes` defaults to `{} as LinkData`.
 *
 * Use {@link LinkRecord} for input shapes (cell creation, setters).
 */
export interface ResolvedLinkRecord<LinkData = unknown> extends BaseLinkRecord, WithType {
  readonly id: DiaCell.ID;
  readonly type: typeof LINK_MODEL_TYPE;
  readonly source: DiaLink.EndJSON;
  readonly target: DiaLink.EndJSON;
  readonly data: LinkData;
}

/**
 * Structural upper bound for any cell record. Use as the constraint when
 * defining custom cell types with non-`'element'` / non-`'link'` `type`
 * literals — extend either {@link BaseElementRecord} or {@link BaseLinkRecord}
 * (or this union) and pick your own `type` literal:
 * ```ts
 * interface MyCustomNode extends BaseElementRecord {
 *   readonly type: 'my-node';
 *   readonly data: MyData;
 * }
 * type AppCell = CellRecord | MyCustomNode;
 * ```
 */
export type CellRecordBase = BaseElementRecord | BaseLinkRecord;

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
 * Read-side cell union — element / link branches with framework-populated
 * fields required. Custom records compose explicitly:
 * `ResolvedCellRecord | MyCustomRecord`.
 */
export type ResolvedCellRecord<ElementData = unknown, LinkData = unknown> =
  | ResolvedElementRecord<ElementData>
  | ResolvedLinkRecord<LinkData>;

/** Short alias for cell ids; same as dia.Cell.ID. */
// @todo - remove, and just use jointjs dia.Cell.ID everywhere. This type alias doesn't add anything and just creates an extra import to keep in sync.
export type CellId = DiaCell.ID;
