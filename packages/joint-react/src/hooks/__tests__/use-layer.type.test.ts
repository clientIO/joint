/* eslint-disable react-hooks/rules-of-hooks */
/**
 * Type-only tests for `useLayers` / `useLayer`. If the file compiles, the
 * contract holds; the dummy `describe`/`it` keeps Jest from failing an empty
 * test file.
 *
 * Locked patterns (DX contract):
 * - `useLayers()` → `readonly LayerRecord<string>[]`
 * - `useLayers<'a' | 'b'>()` → ids narrowed to the union
 * - `useLayer('a')` → `LayerRecord | undefined` (never throws for a missing id)
 * - `useLayer<'a' | 'b'>('a', (layer) => layer.locked === true)` → `boolean | undefined`
 * - `useLayer<'a' | 'b'>('nope')` is a type error
 * - `useLayer(typedId, selector)` infers both generics — the everyday form
 * - `LayerRecord` keeps custom attributes typed `unknown`
 */
import { useLayers } from '../use-layers';
import { useLayer } from '../use-layer';
import type { LayerPatch, LayerRecord } from '../../types/layer.types';
import type { GraphProviderProps } from '../../components/graph/graph-provider';

type DiagramLayerId = 'background' | 'cells' | 'foreground';

/**
 * Compile-time assertion helper: `T` must be exactly assignable to `Expected`.
 * @param _value - the value whose type is checked
 */
function expectType<Expected>(_value: Expected): void {
  return;
}

function typeChecks() {
  const untyped = useLayers();
  expectType<readonly LayerRecord[]>(untyped);
  expectType<string>(untyped[0].id);

  const typed = useLayers<DiagramLayerId>();
  expectType<ReadonlyArray<LayerRecord<DiagramLayerId>>>(typed);
  expectType<DiagramLayerId>(typed[0].id);

  const one = useLayer('anything');
  expectType<LayerRecord | undefined>(one);

  const narrow = useLayer<DiagramLayerId>('foreground');
  expectType<LayerRecord<DiagramLayerId> | undefined>(narrow);
  expectType<unknown>(narrow?.name);

  const selected = useLayer<DiagramLayerId, boolean>(
    'foreground',
    (layer) => layer.locked === true
  );
  expectType<boolean | undefined>(selected);

  // Everyday form: both generics inferred from a typed id and a selector.
  const typedId: DiagramLayerId = 'foreground';
  const selectIsLocked = (layer: LayerRecord) => layer.locked === true;
  const inferred = useLayer(typedId, selectIsLocked);
  expectType<boolean | undefined>(inferred);
  // @ts-expect-error -- inferred as boolean, not a record
  expectType<LayerRecord | undefined>(inferred);

  // @ts-expect-error -- 'nope' is not a DiagramLayerId
  useLayer<DiagramLayerId>('nope');

  const record: LayerRecord<DiagramLayerId> = { id: 'background', locked: true, name: 'BG' };
  const widened: LayerRecord = record;
  expectType<LayerRecord>(widened);

  // LayerPatch carries custom attributes, typed `unknown`.
  const patch: LayerPatch = { locked: false, name: 'Notes' };
  expectType<unknown>(patch.locked);
  // The reserved fields are not patchable, index signature or not.
  // @ts-expect-error -- a layer cannot be renamed through a patch
  const renamePatch: LayerPatch = { id: 'b' };
  // @ts-expect-error -- isDefault is derived from the graph
  const defaultPatch: LayerPatch = { isDefault: true };

  // Controlled mode with a typed union: the provider is generic over LayerId.
  const controlled: GraphProviderProps<never, never, DiagramLayerId> = {
    layers: [{ id: 'background' }],
    onLayersChange: (next) => expectType<ReadonlyArray<LayerRecord<DiagramLayerId>>>(next),
  };
  // @ts-expect-error -- 'nope' is not a DiagramLayerId
  const badControlled: GraphProviderProps<never, never, DiagramLayerId> = { layers: [{ id: 'nope' }] };
  return [patch, renamePatch, defaultPatch, controlled, badControlled];
}

describe('useLayer types', () => {
  it('compiles', () => {
    expect(typeof typeChecks).toBe('function');
  });
});
