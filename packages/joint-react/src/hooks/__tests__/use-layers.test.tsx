import { act, render, renderHook, waitFor } from '@testing-library/react';
import { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';
import { GraphProvider } from '../../components/graph/graph-provider';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useGraphStore } from '../use-graph-store';
import { useGraph } from '../use-graph';
import { useLayers } from '../use-layers';
import { useLayer } from '../use-layer';
import { useCell } from '../use-cell';
import { selectCellLayer } from '../../selectors/cell-selectors';
import type { CellRecord } from '../../types/cell.types';
import type { LayerRecord } from '../../types/layer.types';

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));
/** Runs a mutation inside `act` and drains the store's microtask commit. */
const commit = (run: () => void) =>
  act(async () => {
    run();
    await flush();
  });

let storeRef: ReturnType<typeof useGraphStore> | undefined;
function StoreProbe() {
  storeRef = useGraphStore();
  return null;
}

const THREE_LAYERS: readonly LayerRecord[] = [
  { id: 'background' },
  { id: 'cells' },
  { id: 'foreground', visible: false },
];
const CELLS: readonly CellRecord[] = [
  { id: 'a', type: 'element', layer: 'background' } as CellRecord,
  { id: 'b', type: 'element' } as CellRecord,
];

const selectIds = (layers: readonly LayerRecord[]) => layers.map((layer) => layer.id);
const withDefaultLayer = graphProviderWrapper({ initialCells: [] });
const withLayers = graphProviderWrapper({ initialLayers: THREE_LAYERS, initialCells: [] });
const withLayersAndCells = graphProviderWrapper({
  initialLayers: THREE_LAYERS,
  initialCells: CELLS,
});

/** `renderHook` plus a render counter, for the re-render contract tests. */
function renderCounted<Result>(hook: () => Result, wrapper: typeof withLayers) {
  const renderSpy = jest.fn();
  const view = renderHook(
    () => {
      renderSpy();
      return hook();
    },
    { wrapper }
  );
  return { ...view, renderSpy };
}
const selectVisible = (layer: LayerRecord) => layer.visible !== false;

/** Mounts a provider with BOTH `layers` and `cells` controlled from one state object. */
async function mountBoth(initial: {
  layers: readonly LayerRecord[];
  cells: readonly CellRecord[];
}) {
  let setBoth!: (layers: readonly LayerRecord[], cells: readonly CellRecord[]) => void;
  function Both() {
    const [state, setState] = useState(initial);
    setBoth = (layers, cells) => setState({ layers, cells });
    return (
      <GraphProvider layers={state.layers} cells={state.cells}>
        <StoreProbe />
      </GraphProvider>
    );
  }
  render(<Both />);
  await waitFor(() => expect(storeRef).toBeDefined());
  return setBoth;
}

describe('useLayers — uncontrolled', () => {
  it('reports only the default layer on a fresh provider', () => {
    const { result } = renderHook(() => useLayers(), {
      wrapper: withDefaultLayer,
    });
    expect(result.current).toEqual([{ id: 'cells', isDefault: true }]);
  });

  // React-way of core's "Changing default layer": the default is visible on the
  // record, so an imperative setDefaultLayer() reaches useLayers.
  it('marks the default layer and follows an imperative setDefaultLayer()', async () => {
    const { result } = renderHook(() => ({ layers: useLayers(), store: useGraphStore() }), {
      wrapper: withLayers,
    });
    expect(result.current.layers.map((layer) => layer.isDefault === true)).toEqual([
      false,
      true,
      false,
    ]);
    await commit(() => {
      result.current.store.graph.setDefaultLayer('background');
    });
    expect(result.current.layers.map((layer) => layer.isDefault === true)).toEqual([
      true,
      false,
      false,
    ]);
  });

  it('declares layers in paint order, with the default layer where the array names it', () => {
    const { result } = renderHook(() => useLayers(), {
      wrapper: withLayersAndCells,
    });
    expect(selectIds(result.current)).toEqual(['background', 'cells', 'foreground']);
    expect(result.current[2]).toEqual({ id: 'foreground', visible: false });
  });

  it('assigns cells to their declared layer and leaves untagged cells on the default layer', () => {
    const { result } = renderHook(() => useGraphStore(), {
      wrapper: withLayersAndCells,
    });
    const { graph } = result.current;
    expect(graph.getCell('a').layer()).toBe('background');
    expect(graph.getCell('b').layer()).toBeNull();
    expect(graph.getLayer('background').cellCollection.has('a')).toBe(true);
    expect(graph.getDefaultLayer().cellCollection.has('b')).toBe(true);
  });

  it('reflects an imperative graph.addLayer()', async () => {
    const { result } = renderHook(() => ({ layers: useLayers(), store: useGraphStore() }), {
      wrapper: withDefaultLayer,
    });
    await commit(() => {
      result.current.store.graph.addLayer({ id: 'late', name: 'Late' });
    });
    expect(result.current.layers).toEqual([
      { id: 'cells', isDefault: true },
      { id: 'late', name: 'Late' },
    ]);
  });

  it('reflects an imperative graph.fromJSON() carrying layers', async () => {
    const { result } = renderHook(() => ({ layers: useLayers(), store: useGraphStore() }), {
      wrapper: withDefaultLayer,
    });
    await commit(() => {
      result.current.store.graph.fromJSON({
        cells: [],
        layers: [{ id: 'cells' }, { id: 'imported' }],
        defaultLayer: 'cells',
      });
    });
    expect(selectIds(result.current.layers)).toEqual(['cells', 'imported']);
  });
});

describe('useLayer', () => {
  it('reads one layer by id, and undefined for an unknown id', () => {
    const { result } = renderHook(() => [useLayer('foreground'), useLayer('nope')] as const, {
      wrapper: withLayers,
    });
    expect(result.current[0]).toEqual({ id: 'foreground', visible: false });
    expect(result.current[1]).toBeUndefined();
  });

  it('selects a primitive and re-renders only when it changes', async () => {
    const { result, renderSpy } = renderCounted(
      () => ({ isVisible: useLayer('foreground', selectVisible), api: useGraph() }),
      withLayers
    );
    expect(result.current.isVisible).toBe(false);
    const baseline = renderSpy.mock.calls.length;

    // Unrelated attribute on the same layer: selected value unchanged → no render.
    await commit(() => {
      result.current.api.setLayer('foreground', { name: 'Annotations' });
    });
    expect(renderSpy.mock.calls.length).toBe(baseline);

    await commit(() => {
      result.current.api.setLayer('foreground', { visible: true });
    });
    expect(result.current.isVisible).toBe(true);
    expect(renderSpy.mock.calls.length).toBeGreaterThan(baseline);
  });

  it('does not re-render a sibling layer subscriber', async () => {
    const { result, renderSpy } = renderCounted(
      () => ({ background: useLayer('background'), api: useGraph() }),
      withLayers
    );
    const baseline = renderSpy.mock.calls.length;
    await commit(() => {
      result.current.api.setLayer('foreground', { visible: true });
    });
    expect(renderSpy.mock.calls.length).toBe(baseline);
  });
});

describe('useLayers — re-render contract', () => {
  it('does not re-render on a cell drag', async () => {
    const { result, renderSpy } = renderCounted(
      () => ({ layers: useLayers(), store: useGraphStore() }),
      withLayersAndCells
    );
    const baseline = renderSpy.mock.calls.length;
    const { layers } = result.current;
    await commit(() => {
      result.current.store.graph.getCell('a').set('position', { x: 999, y: 0 });
    });
    expect(renderSpy.mock.calls.length).toBe(baseline);
    expect(result.current.layers).toBe(layers);
  });
});

describe('cell ↔ layer membership (React way)', () => {
  it('moves a cell between layers via setCell and back to the default via layer: undefined', async () => {
    const { result } = renderHook(
      () => ({ layer: useCell('b', selectCellLayer), api: useGraph(), store: useGraphStore() }),
      { wrapper: withLayersAndCells }
    );
    expect(result.current.layer).toBeNull();

    await commit(() => {
      result.current.api.setCell({ id: 'b', type: 'element', layer: 'foreground' });
    });
    expect(result.current.layer).toBe('foreground');
    expect(result.current.store.graph.getLayer('foreground').cellCollection.has('b')).toBe(true);

    await commit(() => {
      result.current.api.setCell({ id: 'b', type: 'element', layer: undefined });
    });
    expect(result.current.layer).toBeNull();
    expect(result.current.store.graph.getDefaultLayer().cellCollection.has('b')).toBe(true);
  });
});

describe('setLayers (uncontrolled writes)', () => {
  it('adds, reorders and removes in one call', async () => {
    const { result } = renderHook(() => ({ layers: useLayers(), api: useGraph() }), {
      wrapper: withLayers,
    });
    await commit(() => {
      result.current.api.setLayers([{ id: 'foreground' }, { id: 'cells' }, { id: 'overlay' }]);
    });
    expect(selectIds(result.current.layers)).toEqual(['foreground', 'cells', 'overlay']);
  });

  it('keeps a dropped layer that still has cells and warns', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => ({ layers: useLayers(), api: useGraph() }), {
      wrapper: withLayersAndCells,
    });
    await commit(() => {
      result.current.api.setLayers([{ id: 'cells' }]);
    });
    // Declared layers come first in declared order; the kept layer follows.
    expect(selectIds(result.current.layers)).toEqual(['cells', 'background']);
    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls[0][0]).toContain('background');
    warn.mockRestore();
  });
});

describe('controlled layers', () => {
  let setExternal!: (next: readonly LayerRecord[]) => void;
  const onLayersChange = jest.fn();

  const ONE_LAYER: readonly LayerRecord[] = [{ id: 'background' }];
  const REORDERED: readonly LayerRecord[] = [{ id: 'background' }, { id: 'cells' }, { id: 'top' }];
  /** Distinct object, identical content — what an inline prop produces each render. */
  const ONE_LAYER_EQUAL: readonly LayerRecord[] = [{ id: 'background' }];

  function App({ initial }: Readonly<{ initial: readonly LayerRecord[] }>) {
    const [layers, setLayers] = useState(initial);
    setExternal = setLayers;
    const handleChange = useCallback((next: readonly LayerRecord[]) => {
      onLayersChange(next);
      setLayers(next);
    }, []);
    return (
      <GraphProvider layers={layers} onLayersChange={handleChange} initialCells={CELLS}>
        <StoreProbe />
      </GraphProvider>
    );
  }

  beforeEach(() => onLayersChange.mockClear());

  /** Renders the controlled App and waits for the store. */
  async function mountControlled(initial: readonly LayerRecord[]) {
    render(<App initial={initial} />);
    await waitFor(() => expect(storeRef).toBeDefined());
  }

  it('applies the controlled array and re-applies when it changes', async () => {
    render(<App initial={ONE_LAYER} />);
    await waitFor(() =>
      expect(storeRef!.graph.getLayers().map((l) => l.id)).toEqual(['cells', 'background'])
    );
    await commit(() => {
      setExternal(REORDERED);
    });
    expect(storeRef!.graph.getLayers().map((l) => l.id)).toEqual(['background', 'cells', 'top']);
  });

  it('emits the full list — including the default layer — on an imperative change', async () => {
    await mountControlled(ONE_LAYER);
    onLayersChange.mockClear();
    await commit(() => {
      storeRef!.graph.getLayer('background').set('visible', false);
    });
    expect(onLayersChange).toHaveBeenCalled();
    const [emitted] = onLayersChange.mock.calls.at(-1)!;
    expect(emitted).toEqual([
      { id: 'cells', isDefault: true },
      { id: 'background', visible: false },
    ]);
  });

  // Regression: layer events were coalesced onto a microtask, so a graph-origin
  // add followed by a synchronous controlled apply (flushSync) was consumed under
  // the React-origin guard — the layer was pruned and the parent never told.
  it('reports a graph-origin layer added right before a synchronous controlled apply', async () => {
    await mountControlled(ONE_LAYER);
    onLayersChange.mockClear();
    await commit(() => {
      storeRef!.graph.addLayer({ id: 'plugin' });
      // eslint-disable-next-line @eslint-react/dom/no-flush-sync -- the regression IS the synchronous commit
      flushSync(() => setExternal(REORDERED));
    });
    // The parent was told about `plugin` before its own array (which omits it)
    // was applied — it could have kept it. That is the contract.
    const [[notified]] = onLayersChange.mock.calls;
    expect(notified.map((layer: LayerRecord) => layer.id)).toContain('plugin');
  });

  it('does not echo the parent\'s own controlled write back through onLayersChange', async () => {
    await mountControlled(ONE_LAYER);
    onLayersChange.mockClear();
    await commit(() => {
      setExternal(REORDERED);
    });
    // The store re-read caused by our own apply is not a change to report.
    expect(onLayersChange).not.toHaveBeenCalled();
  });

  it('skips the cells diff when only the layers array changed', async () => {
    const setBoth = await mountBoth({ layers: ONE_LAYER, cells: CELLS });
    const syncCells = jest.spyOn(storeRef!.graph, 'syncCells');

    await commit(() => {
      setBoth(REORDERED, CELLS); // same cells reference
    });
    expect(syncCells).not.toHaveBeenCalled();
    expect(storeRef!.graph.getLayers().map((l) => l.id)).toEqual(['background', 'cells', 'top']);

    await commit(() => {
      setBoth(REORDERED, [...CELLS]); // new cells reference
    });
    expect(syncCells).toHaveBeenCalledTimes(1);
  });

  it('does no layer work on a cells-only commit when layers are controlled', async () => {
    const setBoth = await mountBoth({ layers: ONE_LAYER, cells: CELLS });
    // Every layer code path reads the default layer; a drag frame must read it 0 times.
    const getDefaultLayer = jest.spyOn(storeRef!.graph, 'getDefaultLayer');
    await commit(() => {
      setBoth(ONE_LAYER, [...CELLS]); // same layers reference, new cells
    });
    expect(getDefaultLayer).not.toHaveBeenCalled();
  });

  it('reverts a burst of graph-origin changes with one apply when uncontrolled by a handler', async () => {
    render(
      <GraphProvider layers={ONE_LAYER} initialCells={CELLS}>
        <StoreProbe />
      </GraphProvider>
    );
    await waitFor(() => expect(storeRef).toBeDefined());
    // `updateGraph` is looked up at call time, so the spy sees every revert apply.
    const updateGraph = jest.spyOn(storeRef!.graphProjection, 'updateGraph');
    await commit(() => {
      storeRef!.graph.addLayer({ id: 'p1' });
      storeRef!.graph.addLayer({ id: 'p2' });
      storeRef!.graph.addLayer({ id: 'p3' });
    });
    expect(updateGraph).toHaveBeenCalledTimes(1);
    expect(storeRef!.graph.getLayers().map((l) => l.id)).toEqual(['cells', 'background']);
  });

  it('does not touch the graph for an equal-but-new array', async () => {
    await mountControlled(ONE_LAYER);
    const { graph } = storeRef!;
    const spies = [
      jest.spyOn(graph, 'addLayer'),
      jest.spyOn(graph, 'moveLayer'),
      jest.spyOn(graph, 'removeLayer'),
    ];
    await commit(() => {
      setExternal(ONE_LAYER_EQUAL);
    });
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});

describe('apply order (React way of core\'s throw cases)', () => {
  it('accepts a layer and a cell naming it declared in the same commit', async () => {
    const setBoth = await mountBoth({ layers: [], cells: [] });

    // Both arrive in one render: the cell names a layer that does not exist yet.
    await commit(() => {
      setBoth([{ id: 'fresh' }], [{ id: 'x', type: 'element', layer: 'fresh' } as CellRecord]);
    });
    const { graph } = storeRef!;
    expect(graph.getCell('x').layer()).toBe('fresh');
    expect(graph.getLayer('fresh').cellCollection.has('x')).toBe(true);

    // And the reverse in one render: the cell leaves and the layer is dropped.
    await commit(() => {
      setBoth([], []);
    });
    expect(graph.getLayers().map((layer) => layer.id)).toEqual(['cells']);
  });
});
