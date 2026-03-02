import { type dia, util } from '@joint/core';

const defaultsCache = new WeakMap<dia.Graph, Map<string, dia.Cell.Attributes>>();
const EMPTY_DEFAULTS: dia.Cell.Attributes = Object.freeze({});

/**
 * Resolves the prototype defaults for a cell's model type.
 *
 * Uses the cell's `type` attribute to look up the constructor in the
 * graph's cell namespace, then calls `util.result()` on the prototype
 * to handle both property and method-style defaults.
 *
 * Results are cached per graph instance and type string to avoid repeated
 * prototype lookups. The WeakMap keying ensures the cache is cleaned up
 * when a graph is garbage-collected.
 * @todo The constructor lookup (`util.getByPath(namespace, type, '.')`) duplicates
 * logic in `CellCollection.model()` (joint-core). Consider adding a `graph.getCellClass(type)`
 * method to `@joint/core` so both sites share the same resolution logic.
 * @param cell - The JointJS cell to resolve defaults for
 * @returns The prototype defaults object, or a frozen empty object if unavailable
 */
export function resolveCellDefaults(cell: dia.Cell): dia.Cell.Attributes {
  const type = cell.get('type') as string;
  const { graph } = cell;
  if (!type || !graph) return EMPTY_DEFAULTS;

  let typeCache = defaultsCache.get(graph);
  if (!typeCache) {
    typeCache = new Map();
    defaultsCache.set(graph, typeCache);
  }

  const cached = typeCache.get(type);
  if (cached) return cached;

  const Ctor = util.getByPath(graph.layerCollection?.cellNamespace, type, '.') as typeof dia.Cell;
  if (!Ctor?.prototype) return EMPTY_DEFAULTS;

  const defaults = util.result(Ctor.prototype, 'defaults', {}) as dia.Cell.Attributes;
  // Prevent accidental mutation of cached defaults
  Object.freeze(defaults);
  typeCache.set(type, defaults);
  return defaults;
}
