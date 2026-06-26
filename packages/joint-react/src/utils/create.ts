import type { ELEMENT_MODEL_TYPE } from '../mvc/element-model';
import type { LINK_MODEL_TYPE } from '../mvc/link-model';

/** The member type of a cells array; passes a non-array `Cells` through. */
type CellArrayMember<Cells> = Cells extends ReadonlyArray<infer Member> ? Member : Cells;

/**
 * Infer the element record type from a cells collection — typically
 * `typeof cells`. Selects the member whose `type` is `'element'`, so a mixed
 * array narrows to its element variant with the inferred `data` shape.
 * Compose with `Computed` for reading hooks, or index `['data']` for the
 * render-data type.
 *
 * Custom shapes (a `type` other than `'element'`) are excluded — type the
 * record union manually for those, as documented on `CellRecord`.
 * @group Utils
 * @example
 * ```ts
 * const cells = [
 *   { id: 'a', type: ELEMENT_MODEL_TYPE, data: { label: 'A' } },
 *   { id: 'e', type: LINK_MODEL_TYPE, source: { id: 'a' }, target: { id: 'b' }, data: { weight: 2 } },
 * ] as const;
 *
 * type Node = InferElement<typeof cells>;             // element variant of the union
 * type NodeData = InferElement<typeof cells>['data']; // { label: 'A' }
 * ```
 */
export type InferElement<Cells> = Extract<
  CellArrayMember<Cells>,
  { readonly type: typeof ELEMENT_MODEL_TYPE }
>;

/**
 * Infer the link record type from a cells collection — the link counterpart of
 * {@link InferElement}. Selects the member whose `type` is `'link'`.
 * @group Utils
 * @example
 * ```ts
 * type Edge = InferLink<typeof cells>;          // link variant of the union
 * type EdgeData = InferLink<typeof cells>['data']; // { weight: 2 }
 * ```
 */
export type InferLink<Cells> = Extract<
  CellArrayMember<Cells>,
  { readonly type: typeof LINK_MODEL_TYPE }
>;
