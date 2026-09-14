import { dia } from '@joint/core';
import type { LayerPatch, LayerRecord } from '../types/layer.types';
import { forgetLayerNotEmptyWarning, warnLayerNotEmpty } from '../utils/dev-warnings';
import { isShallowEqual } from '../utils/selector-utils';

/** `type` joint-core gives a plain layer — read from core, not restated — and left out of records. */
const DEFAULT_GRAPH_LAYER_TYPE: unknown = dia.GraphLayer.prototype.defaults().type;

/** Keys that identify or describe a layer's role rather than its attributes — never written back. */
const RESERVED_KEYS = new Set(['id', 'type', 'isDefault']);

/**
 * Whether a layer attribute belongs in its record: everything except the
 * default `type`, which is joint-core's own marker for a plain layer.
 * @param key - The attribute key.
 * @param value - Its value.
 */
function isRecordAttribute(key: string, value: unknown): boolean {
  return key !== 'id' && !(key === 'type' && value === DEFAULT_GRAPH_LAYER_TYPE);
}

/**
 * Projects one `dia.GraphLayer` into a record, reusing `previous` when nothing
 * changed so `Object.is` bail-outs hold downstream.
 * @param layer - The graph layer to project.
 * @param isDefault - Whether it is the graph's default layer.
 * @param previous - The record last projected for this layer id, if any.
 * @returns The previous record when shallow-equal, otherwise a fresh one.
 */
function toLayerRecord(
  layer: dia.GraphLayer,
  isDefault: boolean,
  previous: LayerRecord | undefined
): LayerRecord {
  const { attributes } = layer;
  const custom: Record<string, unknown> = {};
  for (const key in attributes) {
    if (isRecordAttribute(key, attributes[key])) custom[key] = attributes[key];
  }
  const next: LayerRecord = isDefault
    ? { ...custom, id: layer.id, isDefault }
    : { ...custom, id: layer.id };
  return isShallowEqual(previous, next) && previous ? previous : next;
}

/**
 * Reads the graph's layers, bottom to top, as records. Structurally shared:
 * returns `previous` itself when nothing changed, and reuses every unchanged
 * record inside a new array otherwise. O(L); the only allocation on the
 * no-change path is joint-core's own `getLayers()` copy. Runs on layer events,
 * on a graph reset, and after a React-origin layers write — never on a plain
 * cell commit.
 * @param graph - The graph to read.
 * @param previous - The last projected list, in paint order.
 * @returns The current list, sharing references with `previous` where possible.
 * @internal
 */
export function readLayerRecords(
  graph: dia.Graph,
  previous: readonly LayerRecord[]
): readonly LayerRecord[] {
  const layers = graph.getLayers();
  const defaultLayer = graph.getDefaultLayer();
  // Allocated only once a difference is found; until then `previous` may be
  // returned as is.
  let next: LayerRecord[] | null = layers.length === previous.length ? null : [];
  let index = 0;
  for (const layer of layers) {
    // Paint order is usually stable, so try the positional match first and fall
    // back to a scan only when the order changed. Deliberate ceiling: O(L²) on
    // a full reorder; an id index pays off past ~50 layers.
    const positional = previous[index];
    const before =
      positional?.id === layer.id ? positional : previous.find((record) => record.id === layer.id);
    const record = toLayerRecord(layer, layer === defaultLayer, before);
    if (next === null && record !== positional) next = previous.slice(0, index);
    next?.push(record);
    index += 1;
  }
  return next ?? previous;
}

/**
 * Applies a declared layer list to the graph: adds missing layers, reorders to
 * match the array (index 0 paints at the bottom), and writes changed attributes.
 * Layers absent from the array are left in place — remove them with
 * {@link removeEmptyLayers} once the cells are synced, because joint-core
 * refuses to remove a non-empty layer.
 *
 * The default layer always exists and is never removed; omit it and it stays
 * at the bottom, name it to position it.
 * @param graph - The graph to reconcile.
 * @param next - Declared layers in paint order.
 * @param options - Forwarded into every graph event this raises (tag React writes here).
 * @internal
 */
export function reconcileLayers(
  graph: dia.Graph,
  next: readonly LayerRecord[],
  options: Record<string, unknown> = {}
): void {
  if (next.length === 0) return;
  const defaultId = graph.getDefaultLayer().id;
  const target = next.some((record) => record.id === defaultId)
    ? next
    : [{ id: defaultId }, ...next];

  for (const record of target) {
    if (graph.hasLayer(record.id)) {
      updateLayerAttributes(graph.getLayer(record.id), record, options);
    } else {
      graph.addLayer({ ...record }, options);
    }
  }

  // Walk the target order; move each layer that is out of place to its index.
  // The local mirror avoids re-reading `graph.getLayers()` (an array copy) per
  // move. Deliberate ceiling: O(L) moves, one paper sort each; switch to
  // LCS-minimal moves if diagrams grow past a handful of layers.
  const order = graph.getLayers().map((layer) => layer.id);
  for (const [index, record] of target.entries()) {
    if (order[index] === record.id) continue;
    graph.moveLayer(record.id, { ...options, index });
    order.splice(order.indexOf(record.id), 1);
    order.splice(index, 0, record.id);
  }
}

/**
 * Writes the record's attributes and unsets those it dropped. `mvc.Model.set`
 * diffs against the current values itself and fires `change` only for real
 * changes, so no pre-diff is needed here.
 * @param layer - The live graph layer.
 * @param record - The declared record for it.
 * @param options - Forwarded as the `set`/`unset` opt.
 */
function updateLayerAttributes(
  layer: dia.GraphLayer,
  record: LayerRecord,
  options: Record<string, unknown>
): void {
  const attributes: Record<string, unknown> = {};
  for (const key in record) {
    if (!RESERVED_KEYS.has(key)) attributes[key] = record[key];
  }
  layer.set(attributes, options);
  // Unset only attributes the record dropped that the layer class does not
  // provide as a default — a custom `dia.GraphLayer` subclass keeps its own.
  // `defaults()` allocates; fetch it only once an attribute is actually missing.
  let classDefaults: Record<string, unknown> | null = null;
  for (const key in layer.attributes) {
    if (RESERVED_KEYS.has(key) || key in record) continue;
    classDefaults ??= layer.defaults();
    if (key in classDefaults) continue;
    layer.unset(key, options);
  }
}

/**
 * Removes every layer the array no longer declares, provided it is empty. A
 * layer that still holds cells is kept — joint-core throws on removing it, and
 * migrating its cells would rewrite user data — and a dev warning names the
 * cells to move. Runs after the cells sync so a layer emptied in the same
 * commit is removed in that commit.
 * @param graph - The graph to prune.
 * @param next - Declared layers; anything else is a removal candidate.
 * @param options - Forwarded into the `layer:remove` event.
 * @internal
 */
export function removeEmptyLayers(
  graph: dia.Graph,
  next: readonly LayerRecord[],
  options: Record<string, unknown> = {}
): void {
  const keep = new Set<string>();
  for (const record of next) keep.add(record.id);
  const defaultId = graph.getDefaultLayer().id;
  for (const layer of graph.getLayers()) {
    if (layer.id === defaultId || keep.has(layer.id)) continue;
    if (layer.cellCollection.length > 0) {
      warnLayerNotEmpty(layer.id, () => layer.getCells().map((cell) => cell.id));
      continue;
    }
    graph.removeLayer(layer.id, options);
    forgetLayerNotEmptyWarning(layer.id);
  }
}

/**
 * The layer list with `patch` merged into layer `id` — appended (on top) when
 * no such layer exists. Pure; the caller applies the result.
 * @param layers - Current layers in paint order.
 * @param id - The layer to patch or add.
 * @param patch - Attributes to merge.
 * @returns A new list; `layers` is not mutated.
 * @internal
 */
export function withLayerPatch(
  layers: readonly LayerRecord[],
  id: string,
  patch: LayerPatch
): readonly LayerRecord[] {
  // Deliberate: O(L) rebuild on the write path — L is a handful of layers.
  const hasLayer = layers.some((layer) => layer.id === id);
  return hasLayer
    ? layers.map((layer) => (layer.id === id ? { ...layer, ...patch, id } : layer))
    : [...layers, { ...patch, id }];
}
