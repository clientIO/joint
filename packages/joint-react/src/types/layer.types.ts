/**
 * A graph layer as seen from React: its id, the attributes joint-react
 * interprets, and any custom attributes you store on it. Mirrors a
 * `dia.GraphLayer`'s attribute hash, so custom attributes round-trip through
 * `graph.toJSON()` unchanged. Custom attributes read back as `unknown` —
 * narrow them (`typeof layer.name === 'string'`) or select a typed value.
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
 *   { id: 'foreground', visible: false },
 * ];
 * ```
 */
export interface LayerRecord<LayerId extends string = string> {
  readonly id: LayerId;
  /**
   * Whether the layer is painted. A hidden layer keeps its cells mounted and
   * only sets `display: none` on the layer group, so toggling is O(1).
   *
   * Hidden is not unmounted: cell views stay in the DOM and in the paper's
   * view management, so hide/show never re-renders React content. Two
   * consequences to plan for — a link in a visible layer anchored to a port of
   * an element in a hidden layer cannot measure that port and may misroute,
   * and for a very large layer you hide for long periods the paper's
   * `cellVisibility` option (which does unmount) is the better tool.
   * @default true
   */
  readonly visible?: boolean;
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
 * as `Omit<LayerRecord, 'id'>`: `Omit` over an index signature collapses
 * `visible` to `unknown`.
 * @group Types
 * @example
 * ```tsx
 * import { useGraph } from '@joint/react';
 *
 * const { setLayer } = useGraph();
 * setLayer('notes', { visible: false });
 * ```
 */
export interface LayerPatch {
  /** See {@link LayerRecord.visible}. */
  readonly visible?: boolean;
  readonly [attribute: string]: unknown;
}
