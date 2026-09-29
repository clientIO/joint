import { useCallback } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import { useGraphStore } from './use-graph-store';
import { arrayAwareEqual } from '../utils/selector-utils';
import type { LayerRecord } from '../types/layer.types';

/** What the implementation resolves to: the record, a selection from it, or nothing. */
type LayerSelection<Selected> = LayerRecord | Selected | undefined;

/**
 * Subscribe to one layer by id. Returns `undefined` while no layer with that
 * id exists (for example before a controlled `layers` array adds it), so it
 * never throws.
 * @title Read a layer by id
 * @template LayerId - Union of your layer ids. Defaults to `string`.
 * @param id - The layer id to track.
 * @returns The layer record, or `undefined`.
 * @group Hooks
 * @example
 * ```tsx
 * import { useLayer } from '@joint/react';
 *
 * function LayerBadge() {
 *   const layer = useLayer('foreground');
 *   return <span>{layer?.visible === false ? 'hidden' : 'shown'}</span>;
 * }
 * ```
 */
export function useLayer<LayerId extends string = string>(
  id: LayerId
): LayerRecord<LayerId> | undefined;
/**
 * Subscribe to a value derived from one layer. Re-renders only when the
 * selected value changes — the same shallow, array-aware comparison `useCell`
 * uses, or your `isEqual` — so select a primitive where you can:
 * `useLayer('foreground', (layer) => layer.visible !== false)` does not
 * re-render when the layer's name changes.
 * @title Select from a layer by id
 * @template LayerId - Union of your layer ids. Defaults to `string`.
 * @template Selected - The selector's return type.
 * @param id - The layer id to track.
 * @param selector - Derives a value from the layer record. Hoist it to module
 *   scope or memoise it; an inline closure re-runs the selector each render.
 * @param isEqual - Equality used to skip re-renders. Defaults to a shallow,
 *   array-aware comparison that falls back to `Object.is` for scalars.
 * @returns The selected value, or `undefined` while the layer does not exist.
 * @example
 * ```tsx
 * import { useLayer, type LayerRecord } from '@joint/react';
 *
 * const selectVisible = (layer: LayerRecord) => layer.visible !== false;
 *
 * function VisibilityToggle() {
 *   const isVisible = useLayer('foreground', selectVisible);
 *   return <input type="checkbox" checked={isVisible ?? true} readOnly />;
 * }
 * ```
 */
export function useLayer<LayerId extends string = string, Selected = LayerRecord<LayerId>>(
  id: LayerId,
  selector: (layer: LayerRecord<LayerId>) => Selected,
  isEqual?: (a: Selected | undefined, b: Selected | undefined) => boolean
): Selected | undefined;
// Implementation on `string` ids; the overloads above narrow to the caller's
// union without a cast.
export function useLayer<Selected = LayerRecord>(
  id: string,
  selector?: (layer: LayerRecord) => Selected,
  isEqual?: (a: LayerSelection<Selected>, b: LayerSelection<Selected>) => boolean
): LayerSelection<Selected> {
  const { layers } = useGraphStore().graphProjection;
  // The list is the subscription unit, but the read is by id against a
  // per-snapshot index, so this stays O(1) however many layers exist.
  const select = useCallback(
    (): LayerSelection<Selected> => {
      const layer = layers.getLayer(id);
      if (layer === undefined) return undefined;
      return selector ? selector(layer) : layer;
    },
    [layers, id, selector]
  );
  return useSyncExternalStoreWithSelector<readonly LayerRecord[], LayerSelection<Selected>>(
    layers.subscribe,
    layers.getSnapshot,
    layers.getSnapshot,
    select,
    isEqual ?? arrayAwareEqual
  );
}
