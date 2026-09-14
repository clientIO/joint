import { useSyncExternalStore } from 'react';
import { useGraphStore } from './use-graph-store';
import type { LayerRecord } from '../types/layer.types';

/**
 * Subscribe to the graph's layers, bottom to top. Re-renders when a layer is
 * added, removed, reordered, or has an attribute changed — never on a cell
 * change, so a layers panel does no work during a drag.
 *
 * The array is the store's own reference-stable snapshot: equal across
 * unrelated commits, so it is safe as an effect dependency.
 * @template LayerId - Union of your layer ids, for autocomplete and narrowing.
 *   Defaults to `string`.
 * @returns The ordered layers.
 * @group Hooks
 * @example
 * ```tsx
 * import { useLayers } from '@joint/react';
 *
 * type DiagramLayerId = 'background' | 'cells' | 'foreground';
 *
 * function LayersPanel() {
 *   const layers = useLayers<DiagramLayerId>();
 *   return (
 *     <ul>
 *       {layers.map((layer) => (
 *         <li key={layer.id}>{layer.id}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useLayers<LayerId extends string = string>(): ReadonlyArray<LayerRecord<LayerId>>;
// The store holds `string` ids; the overload above narrows them to the union
// the caller declares, the same unchecked narrowing `useCells<Cell>` performs.
export function useLayers(): readonly LayerRecord[] {
  const { layers } = useGraphStore().graphProjection;
  return useSyncExternalStore(layers.subscribe, layers.getSnapshot);
}
