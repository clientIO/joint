import { dia } from '@joint/core';
import type { LayerPatch, LayerRecord } from '../types/layer.types';
import { forgetLayerNotEmptyWarning, warnLayerNotEmpty } from '../utils/dev-warnings';
import { isShallowEqual } from '../utils/selector-utils';
import { isRecord } from '../utils/is';

/** `type` joint-core gives a plain layer — read from core, not restated — and left out of records. */
const DEFAULT_GRAPH_LAYER_TYPE: unknown = dia.GraphLayer.prototype.defaults().type;

/** Keys that identify or describe a layer's role rather than its attributes — never written back. */
const RESERVED_KEYS = new Set(['id', 'type', 'isDefault']);
// Public add/move operations enable layer-aware JSON. Remember that activation
// without reading or writing the core's legacy flag or repeating a no-op move.
const graphsWithDeclaredLayers = new WeakSet<dia.Graph>();

/**
 * Whether a layer attribute belongs in its record: omit identity, derived
 * default-layer status and joint-core's type marker for a plain layer.
 * @param key - The attribute key.
 * @param value - Its value.
 */
function isRecordAttribute(key: string, value: unknown): boolean {
  return key !== 'id' && key !== 'isDefault' && !(key === 'type' && value === DEFAULT_GRAPH_LAYER_TYPE);
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
 * Whether the graph can construct a layer of `type` — the constructor is
 * registered in its `layerNamespace` (a dotted path, like a cell type).
 * @param graph - The graph whose namespace is consulted.
 * @param type - The layer `type` attribute.
 */
function isRegisteredLayerType(graph: dia.Graph, type: string): boolean {
  // Own keys only: `util.getByPath` also walks the prototype chain, so a type
  // such as `constructor` or `toString` would pass here and then fail inside
  // joint-core, halfway through the apply.
  let current: unknown = graph.layerCollection.layerNamespace;
  for (const key of type.split('.')) {
    if (!isRecord(current) || !Object.hasOwn(current, key)) return false;
    current = current[key];
  }
  return (
    typeof current === 'function' &&
    (current === dia.GraphLayer || current.prototype instanceof dia.GraphLayer)
  );
}

/**
 * Throws on a layer list joint-core would reject or silently collapse: an
 * empty id, an id declared twice (layers are keyed by id, so the graph could
 * never match the array), a provided `type` that is not a string identifying a
 * GraphLayer constructor in the graph's `layerNamespace`, or a `type` that
 * differs from the existing layer's (a layer's class is fixed at creation,
 * so the change would be ignored). Runs before any write, so a bad array
 * leaves the graph — and any open batch — untouched. An omitted or `undefined` type uses the
 * graph's default layer constructor.
 * @param graph - The target graph.
 * @param layers - The declared layers.
 * @internal
 */
export function assertLayerRecords(graph: dia.Graph, layers: readonly LayerRecord[]): void {
  const seen = new Set<string>();
  for (const { id, type } of layers) {
    if (!id) throw new Error('GraphProvider: a layer needs a non-empty id, got an empty layer id.');
    if (seen.has(id)) throw new Error(`GraphProvider: layer id "${id}" is declared twice.`);
    seen.add(id);
    if (type !== undefined && typeof type !== 'string') {
      throw new Error(
        `GraphProvider: layer "${id}" has a non-string type. Omit it or provide a layer type string.`
      );
    }
    if (typeof type === 'string' && !isRegisteredLayerType(graph, type)) {
      throw new Error(
        `GraphProvider: layer "${id}" has type "${type}", which is not in the graph's \`layerNamespace\`.`
      );
    }
    if (typeof type === 'string' && graph.hasLayer(id) && graph.getLayer(id).get('type') !== type) {
      throw new Error(
        `GraphProvider: layer "${id}" already exists with another type than "${type}". ` +
          'A layer type is fixed at creation - declare the new type under a new id.'
      );
    }
  }
}

/**
 * Applies a declared layer list to the graph: adds missing layers, reorders to
 * match the array (index 0 paints at the bottom), and writes changed attributes.
 * Layers absent from the array are left in place — remove them with
 * {@link removeEmptyLayers} once the cells are synced, because joint-core
 * refuses to remove a non-empty layer.
 *
 * The default layer always exists and is never removed; omit it and it is
 * reconciled as a bare `{ id }` at the bottom (so attributes it was given
 * earlier are unset), name it to position it.
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
  const defaultId = graph.getDefaultLayer().id;
  const declaredDefault = next.find((record) => record.id === defaultId);
  const target = declaredDefault ? next : [{ id: defaultId }, ...next];

  for (const record of target) {
    if (graph.hasLayer(record.id)) {
      updateLayerAttributes(graph.getLayer(record.id), record, options);
    } else {
      // `isDefault` is derived from the graph, never an attribute to store.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { isDefault, ...layerInit } = record;
      graph.addLayer(layerInit, options);
      graphsWithDeclaredLayers.add(graph);
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
    graphsWithDeclaredLayers.add(graph);
    order.splice(order.indexOf(record.id), 1);
    order.splice(index, 0, record.id);
  }

  // Configuring only the existing default layer calls neither add nor move,
  // but its attributes must still survive graph.toJSON(). A same-position
  // public move opts into layer serialization without resetting cells/views.
  if (
    declaredDefault &&
    !graphsWithDeclaredLayers.has(graph) &&
    Object.keys(declaredDefault).some((key) => !RESERVED_KEYS.has(key))
  ) {
    graph.moveLayer(defaultId, { ...options, index: order.indexOf(defaultId) });
    graphsWithDeclaredLayers.add(graph);
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
  // An attribute the record dropped goes back to the layer class's default when
  // it provides one (a custom `dia.GraphLayer` subclass keeps its own), and is
  // unset otherwise. `defaults()` allocates; fetch it only once an attribute is
  // actually missing.
  let classDefaults: Record<string, unknown> | null = null;
  for (const key in layer.attributes) {
    if (RESERVED_KEYS.has(key) || key in record) continue;
    classDefaults ??= layer.defaults();
    if (key in classDefaults) {
      layer.set(key, classDefaults[key], options);
    } else {
      layer.unset(key, options);
    }
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
 * @param isCurrent - Whether this declaration still owns layer removals.
 * @returns Ids retained only because they still hold cells.
 * @internal
 */
export function removeEmptyLayers(
  graph: dia.Graph,
  next: readonly LayerRecord[],
  options: Record<string, unknown> = {},
  isCurrent: () => boolean = () => true
): Set<string> {
  const keep = new Set<string>();
  for (const record of next) keep.add(record.id);
  const pending = new Set<string>();
  for (const candidate of graph.getLayers()) {
    if (!isCurrent()) break;
    const { id } = candidate;
    // Removing the previous layer fires public listeners synchronously. They
    // may replace this declaration, the default, or the next layer instance.
    if (id === graph.getDefaultLayer().id || keep.has(id) || !graph.hasLayer(id)) continue;
    const layer = graph.getLayer(id);
    if (!removeEmptyLayer(graph, layer, options)) {
      warnLayerNotEmpty(id, () => layer.getCells().map((cell) => cell.id));
      pending.add(id);
    }
  }
  return pending;
}

/** Removes an empty layer, keeping nonempty ones for a later cells commit. */
function removeEmptyLayer(
  graph: dia.Graph,
  layer: dia.GraphLayer,
  options: Record<string, unknown>
): boolean {
  if (layer.cellCollection.length > 0) return false;
  graph.removeLayer(layer.id, options);
  forgetLayerNotEmptyWarning(layer.id);
  return true;
}

/** Resolves a pending id against the current default and current layer model. */
function getEmptyPendingLayer(
  graph: dia.Graph,
  pending: Set<string>,
  id: string
): dia.GraphLayer | undefined {
  if (id === graph.getDefaultLayer().id || !graph.hasLayer(id)) {
    pending.delete(id);
    forgetLayerNotEmptyWarning(id);
    return undefined;
  }
  const layer = graph.getLayer(id);
  return layer.cellCollection.length === 0 ? layer : undefined;
}

/**
 * Retries only layers a declaration already tried to remove, after cells move.
 * No layer list is read or reconciled on this cells-only path.
 * @param graph - The graph holding the retained layers.
 * @param pending - Pending ids, removed from this set as they are resolved.
 * @param options - Forwarded to removals.
 * @param beforeRemove - Called once, before preparing the first removal.
 * @param isCurrent - Whether the owner and this pending declaration are still current.
 * @returns Whether a layer was removed and the snapshot must be refreshed.
 * @internal
 */
export function retryEmptyLayerRemovals(
  graph: dia.Graph,
  pending: Set<string>,
  options: Record<string, unknown>,
  beforeRemove?: () => void,
  isCurrent: () => boolean = () => true
): boolean {
  let removed = false;
  let prepared = false;
  for (const id of pending) {
    if (!isCurrent()) break;
    if (!getEmptyPendingLayer(graph, pending, id)) continue;
    if (!prepared) {
      prepared = true;
      beforeRemove?.();
    }
    // Batch-start and prior removal listeners may replace the declaration,
    // destroy its owner, change the default, or replace this layer model.
    if (!isCurrent()) break;
    const layer = getEmptyPendingLayer(graph, pending, id);
    if (layer && removeEmptyLayer(graph, layer, options)) {
      pending.delete(id);
      removed = true;
    }
  }
  return removed;
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
