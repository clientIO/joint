import { ELEMENT_MODEL_TYPE } from '../mvc/element-model';
import { LINK_MODEL_TYPE } from '../mvc/link-model';
import type {
  ElementJSONInit,
  LinkJSONInit,
  ElementRecord,
  LinkRecord,
} from '../types/cell.types';

/**
 * Input accepted by {@link element}: an element record whose mandatory `type`
 * is optional (defaulted to `'element'`) and whose `data` field drives the
 * inferred `ElementData` type parameter.
 */
type ElementInput<ElementData, Type extends string> = Omit<ElementJSONInit, 'type' | 'data'> & {
  readonly type?: Type;
  readonly data?: ElementData;
};

/**
 * Input accepted by {@link link}: a link record whose mandatory `type` is
 * optional (defaulted to `'link'`) and whose `data` field drives the inferred
 * `LinkData` type parameter.
 */
type LinkInput<LinkData, Type extends string> = Omit<LinkJSONInit, 'type' | 'data'> & {
  readonly type?: Type;
  readonly data?: LinkData;
};

/**
 * Define a single element cell with full type inference and intellisense.
 *
 * Thin identity helper over {@link ElementRecord} for plain-JS / loosely-typed
 * call sites: it defaults `type` to `'element'` (so callers don't repeat it)
 * and infers `ElementData` from the `data` field. Nothing is copied or
 * transformed beyond filling the default `type` — the returned record is the
 * same shape `GraphProvider` accepts.
 * @group Utils
 * @param input - element fields; `type` defaults to `'element'`.
 * @returns the element record, typed as `ElementRecord<ElementData, Type>`.
 * @example
 * ```ts
 * const node = element({ id: 'a', position: { x: 0, y: 0 }, data: { label: 'A' } });
 * // node: ElementRecord<{ label: string }>
 * // node.data.label is `string`
 * ```
 */
export function element<ElementData = unknown, Type extends string = typeof ELEMENT_MODEL_TYPE>(
  input: ElementInput<ElementData, Type>
): ElementRecord<ElementData, Type> {
  // `type` defaults to `'element'`; an explicit `input.type` (e.g. a built-in
  // shape) wins. Cast narrows the spread's widened `type` back to the literal
  // `Type` the signature promises.
  return { ...input, type: input.type ?? ELEMENT_MODEL_TYPE } as ElementRecord<ElementData, Type>;
}

/**
 * Define a single link cell with full type inference and intellisense.
 *
 * Thin identity helper over {@link LinkRecord} for plain-JS / loosely-typed
 * call sites: it defaults `type` to `'link'` (so callers don't repeat it) and
 * infers `LinkData` from the `data` field.
 * @group Utils
 * @param input - link fields; `type` defaults to `'link'`.
 * @returns the link record, typed as `LinkRecord<LinkData, Type>`.
 * @example
 * ```ts
 * const edge = link({ id: 'e', source: 'a', target: 'b', data: { weight: 2 } });
 * // edge: LinkRecord<{ weight: number }>
 * ```
 */
export function link<LinkData = unknown, Type extends string = typeof LINK_MODEL_TYPE>(
  input: LinkInput<LinkData, Type>
): LinkRecord<LinkData, Type> {
  return { ...input, type: input.type ?? LINK_MODEL_TYPE } as LinkRecord<LinkData, Type>;
}

/** The member type of a cells array; passes a non-array `Cells` through. */
type CellArrayMember<Cells> = Cells extends ReadonlyArray<infer Member> ? Member : Cells;

/**
 * Infer the element record type from a cells collection — typically
 * `typeof cells` where `cells` is built with {@link element} / {@link link}.
 *
 * Selects the member whose `type` is `'element'`, so a mixed array narrows to
 * its element variant (with the inferred `data`). Compose with `Computed` for
 * reading hooks, or index `['data']` for the render-data type.
 *
 * Custom shapes (a `type` other than `'element'`) are excluded — type the
 * record union manually for those, as documented on `CellRecord`.
 * @group Utils
 * @example
 * ```ts
 * const cells = [
 *   element({ id: 'a', data: { label: 'A' } }),
 *   link({ id: 'e', source: 'a', target: 'b' }),
 * ];
 *
 * type Node = InferElement<typeof cells>;        // ElementRecord<{ label: string }>
 * type NodeData = InferElement<typeof cells>['data']; // { label: string }
 *
 * const renderElement: RenderElement<NodeData> = (data) => <text>{data.label}</text>;
 * useCell((node: Computed<Node>) => node.data.label);
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
 * type Edge = InferLink<typeof cells>;          // LinkRecord<{ weight: number }>
 * type EdgeData = InferLink<typeof cells>['data'];
 * ```
 */
export type InferLink<Cells> = Extract<
  CellArrayMember<Cells>,
  { readonly type: typeof LINK_MODEL_TYPE }
>;
