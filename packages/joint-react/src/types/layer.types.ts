/**
 * A graph layer as seen from React: its id, the attributes joint-react
 * interprets, and any custom attributes you store on it. Mirrors a
 * `dia.GraphLayer`'s attribute hash, so custom attributes round-trip through
 * `graph.toJSON()` unchanged. Custom attributes read back as `unknown` —
 * narrow them (`typeof layer.name === 'string'`) or select a typed value.
 * A provided `type` must be a string naming a registered `dia.GraphLayer`
 * constructor in the graph's `layerNamespace`. Omit it or pass `undefined`
 * to use the default constructor; other values, including `null`, are rejected.
 * @template LayerId - Union of the layer ids your diagram uses, for
 *   autocomplete and narrowing. Defaults to `string`.
 * @group Types
 * @example
 * ```tsx
 * import type { LayerRecord } from '@joint/react';
 *
 * type DiagramLayerId = 'background' | 'cells' | 'foreground';
 * const layers: ReadonlyArray<LayerRecord<DiagramLayerId>> = [
 *   { id: 'background' },
 *   { id: 'cells' },
 *   { id: 'foreground', name: 'Annotations' },
 * ];
 * ```
 */
export interface LayerRecord<LayerId extends string = string> {
  readonly id: LayerId;
  /**
   * `true` on the graph's default layer — the one an untagged cell lands on.
   * Read-only: it reflects `graph.getDefaultLayer()` and is ignored when
   * written back; change the default through the graph if you must, and note
   * the layers API assumes it stays the built-in `cells` layer.
   */
  readonly isDefault?: boolean;
  readonly [attribute: string]: unknown;
}

/**
 * Attributes to merge into a layer with `setLayer` — everything a
 * {@link LayerRecord} carries except its `id`. Declared explicitly rather than
 * as `Omit<LayerRecord, 'id'>`: `Omit` over an index signature collapses every
 * named member into it, so it would neither reject `id` nor guard `isDefault`.
 * @group Types
 * @example
 * ```tsx
 * import { useGraph } from '@joint/react';
 *
 * const { setLayer } = useGraph();
 * setLayer('notes', { name: 'Notes' });
 * ```
 */
export interface LayerPatch {
  /** Not patchable: the id names the layer to patch. */
  readonly id?: never;
  /** Not patchable: derived from the graph, see {@link LayerRecord.isDefault}. */
  readonly isDefault?: never;
  readonly [attribute: string]: unknown;
}
