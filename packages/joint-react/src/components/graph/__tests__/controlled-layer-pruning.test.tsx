import { act, render, waitFor } from '@testing-library/react';
import { GraphProvider } from '../graph-provider';
import { useGraphStore } from '../../../hooks/use-graph-store';
import { useGraph } from '../../../hooks/use-graph';
import type { GraphStore } from '../../../store';
import type { CellRecord, ElementRecord } from '../../../types/cell.types';
import type { LayerRecord } from '../../../types/layer.types';
import { ELEMENT_MODEL_TYPE } from '../../../mvc/element-model';

const element = (layer: string) => ({
  id: 'node',
  type: ELEMENT_MODEL_TYPE,
  layer,
  position: { x: 0, y: 0 },
  size: { width: 10, height: 10 },
} satisfies ElementRecord);
const INITIAL_LAYERS: readonly LayerRecord[] = [{ id: 'notes' }];
const REMAINING_LAYERS: readonly LayerRecord[] = [];
const INITIAL_CELLS: readonly CellRecord[] = [element('notes')];
const MOVED_CELLS: readonly CellRecord[] = [element('cells')];
const NO_CELLS: readonly CellRecord[] = [];
interface Captured { store?: GraphStore; api?: ReturnType<typeof useGraph> }
function Capture({ captured }: Readonly<{ captured: Captured }>) {
  captured.store = useGraphStore();
  captured.api = useGraph();
  return null;
}

it.each(['move', 'delete'] as const)('prunes a retained layer after a controlled cells-only %s with the same layers array', async (mode) => {
  const captured: Captured = {};
  const onLayersChange = jest.fn();
  const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  const tree = (cells: readonly CellRecord[], layers: readonly LayerRecord[]) => (
    <GraphProvider cells={cells} layers={layers} onLayersChange={onLayersChange}>
      <Capture captured={captured} />
    </GraphProvider>
  );
  const view = render(tree(INITIAL_CELLS, INITIAL_LAYERS));
  try {
    await waitFor(() => expect(captured.store?.graph.hasLayer('notes')).toBe(true));
    onLayersChange.mockClear();
    await act(async () => {
      view.rerender(tree(INITIAL_CELLS, REMAINING_LAYERS));
    });
    expect(captured.store?.graph.hasLayer('notes')).toBe(true);

    await act(async () => {
      view.rerender(tree(mode === 'move' ? MOVED_CELLS : NO_CELLS, REMAINING_LAYERS));
    });

    if (mode === 'move') expect(captured.store?.graph.getCell('node').get('layer')).toBe('cells');
    else expect(captured.store?.graph.getCell('node')).toBeUndefined();
    expect(captured.store?.graph.hasLayer('notes')).toBe(false);
    expect(captured.store?.graphProjection.layers.getLayer('notes')).toBeUndefined();
    expect(onLayersChange).not.toHaveBeenCalled();
  } finally {
    view.unmount();
    warn.mockRestore();
  }
});

it.each(['api move', 'native move', 'native delete'] as const)(
  'prunes a retained controlled layer after an uncontrolled %s without a parent update',
  async (mode) => {
    const captured: Captured = {};
    const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
    const tree = (layers: readonly LayerRecord[]) => (
      <GraphProvider initialCells={INITIAL_CELLS} layers={layers}>
        <Capture captured={captured} />
      </GraphProvider>
    );
    const view = render(tree(INITIAL_LAYERS));
    try {
      await waitFor(() => expect(captured.store?.graph.hasLayer('notes')).toBe(true));
      await act(async () => {
        view.rerender(tree(REMAINING_LAYERS));
      });
      const { store, api } = captured;
      if (!store || !api) throw new Error('graph not ready');
      expect(store.graph.hasLayer('notes')).toBe(true);

      await act(async () => {
        if (mode === 'api move') api.setCell(element('cells'));
        else if (mode === 'native move') store.graph.getCell('node').layer('cells');
        else store.graph.removeCells([store.graph.getCell('node')]);
        await new Promise<void>((resolve) => queueMicrotask(resolve));
      });

      expect(store.graph.hasLayer('notes')).toBe(false);
      expect(store.graphProjection.layers.getLayer('notes')).toBeUndefined();
      if (mode === 'native delete') expect(store.graph.getCell('node')).toBeUndefined();
      else expect(store.graph.getCell('node').layer()).toBe('cells');
    } finally {
      view.unmount();
      warn.mockRestore();
    }
  }
);
