import type { Cell as DiaCell, Link as DiaLink } from '@joint/core/dia';
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
  readonly id: DiaCell.ID;
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
export interface BaseCell extends WithId {
  readonly type: CellTypeName;
}

/** Element-flavored cell; narrowed when `type === ELEMENT_MODEL_TYPE`. */
export interface ElementRecord<ElementData = unknown> extends BaseCell {
  readonly type: typeof ELEMENT_MODEL_TYPE;
  readonly position?: ElementPosition;
  readonly size?: ElementSize;
  readonly angle?: number;
  readonly data?: ElementData;
  readonly portMap?: Record<string, ElementPort>;
  readonly portStyle?: Partial<ElementPort>;
  readonly [key: string]: unknown;
}

/** Link-flavored cell; narrowed when `type === LINK_MODEL_TYPE`. */
export interface LinkRecord<LinkData = unknown> extends BaseCell {
  readonly type: typeof LINK_MODEL_TYPE;
  readonly source?: DiaLink.EndJSON;
  readonly target?: DiaLink.EndJSON;
  readonly data?: LinkData;
  readonly style?: LinkStyle;
  readonly labelMap?: Record<string, LinkLabel>;
  readonly labelStyle?: Partial<LinkLabel>;
  readonly [key: string]: unknown;
}

/**
 * Any custom cell type that is not ElementRecord/LinkRecord. `type` is
 * inherited from BaseCell as `KnownCellType | (string & {})`, and the
 * index signature lets authors attach arbitrary fields.
 */
export interface CustomRecord extends BaseCell {
  readonly [key: string]: unknown;
}

/**
 * The public Cell type: discriminated union over the `type` literal.
 * - `type === 'ElementModel'` → ElementRecord<E>
 * - `type === 'LinkModel'`    → LinkRecord<L>
 * - otherwise                  → CustomRecord
 *
 * Note: TS discriminant-narrowing is imperfect here because every literal is
 * assignable to `string & {}`, so the CustomRecord branch stays alive inside
 * `if (c.type === ELEMENT_MODEL_TYPE)`. Prefer the `isElement` / `isLink`
 * type guards from `useGraph()` for reliable narrowing in user code.
 */
export type CellRecord<ElementData = unknown, LinkData = unknown> =
  | ElementRecord<ElementData>
  | LinkRecord<LinkData>
  | CustomRecord;

/** Readonly array of cells — used in GraphProvider props, setters, and selectors. */
export type Cells<ElementData = unknown, LinkData = unknown> = ReadonlyArray<
  CellRecord<ElementData, LinkData>
>;

/** Short alias for cell ids; same as dia.Cell.ID. */
// @todo - remove, and just use jointjs dia.Cell.ID everywhere. This type alias doesn't add anything and just creates an extra import to keep in sync.
export type CellId = DiaCell.ID;
