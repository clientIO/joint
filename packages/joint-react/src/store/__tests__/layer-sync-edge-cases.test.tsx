import { act, render, waitFor } from '@testing-library/react';
import { dia } from '@joint/core';
import { GraphProvider } from '../../components/graph/graph-provider';
import { useGraph } from '../../hooks/use-graph';
import { useGraphStore } from '../../hooks/use-graph-store';
import { DEFAULT_CELL_NAMESPACE, GraphStore } from '../graph-store';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import type { CellRecord, ElementRecord } from '../../types/cell.types';
import type { LayerRecord } from '../../types/layer.types';

const element = (id: string, layer?: string) =>
  ({
    id,
    type: ELEMENT_MODEL_TYPE,
    ...(layer === undefined ? {} : { layer }),
    position: { x: 0, y: 0 },
    size: { width: 10, height: 10 },
  }) satisfies ElementRecord;

const ROLLBACK_LAYERS: readonly LayerRecord[] = [{ id: 'notes' }];
const ROLLBACK_CELLS: readonly CellRecord[] = [element('node', 'notes')];

const flushMicrotasks = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('cell layer membership', () => {
  it('accepts a controlled cell with an empty layer, as joint-core does', () => {
    const store = new GraphStore({});
    try {
      store.syncControlled([element('a', '')]);

      expect(store.graph.getCellLayerId(store.graph.getCell('a'))).toBe('cells');
    } finally {
      store.destroy(false);
    }
  });

  it('accepts any layer name on an external graph that ignores layers', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE, ignoreLayers: true });
    const store = new GraphStore({ graph });
    try {
      store.syncControlled([element('a', 'nowhere')]);

      expect(graph.getCell('a')).toBeDefined();
      expect(graph.hasActiveBatch()).toBe(false);
    } finally {
      store.destroy(true);
    }
  });
});

describe('graph listeners during a React-origin layers apply', () => {
  it('delivers a cell a layer:add listener adds inside the batch', async () => {
    const store = new GraphStore({});
    const addedIds: unknown[] = [];
    // The projection reuses and clears the change maps after the callback.
    const onIncrementalCellsChange = jest.fn((change: { readonly added: ReadonlyMap<unknown, unknown> }) => {
      addedIds.push(...change.added.keys());
    });
    store.setOnIncrementalCellsChange(onIncrementalCellsChange);
    const addCellOnce = () => {
      store.graph.off('layer:add', addCellOnce);
      store.graph.addCell(element('from-listener'));
    };
    store.graph.on('layer:add', addCellOnce);
    try {
      store.applyLayers([{ id: 'notes' }]);
      await flushMicrotasks();

      expect(store.graphProjection.cells.has('from-listener')).toBe(true);
      // The incremental change drives `onCellsChange` and controlled reverts.
      expect(onIncrementalCellsChange).toHaveBeenCalledTimes(1);
      expect(addedIds).toEqual(['from-listener']);
      expect(store.graph.hasActiveBatch()).toBe(false);
    } finally {
      store.destroy(false);
    }
  });

  it('stops a superseded declaration and closes its batch', () => {
    const store = new GraphStore({});
    const replaceDeclaration = () => {
      store.graph.off('layer:add', replaceDeclaration);
      store.applyLayers([{ id: 'b' }]);
    };
    store.graph.on('layer:add', replaceDeclaration);
    try {
      expect(() => store.applyLayers([{ id: 'a' }, { id: 'c' }])).not.toThrow();

      expect(store.graph.hasActiveBatch()).toBe(false);
      expect(store.graph.hasLayer('b')).toBe(true);
      expect(store.graph.hasLayer('c')).toBe(false);
      expect(store.graphProjection.layers.getLayer('b')).toBeDefined();
    } finally {
      store.destroy(false);
    }
  });
});

describe('transaction rollback with layers', () => {
  it('restores a layer the transaction removed before restoring its cells', async () => {
    const captured: { api?: ReturnType<typeof useGraph>; store?: GraphStore } = {};
    function Capture() {
      captured.api = useGraph();
      captured.store = useGraphStore();
      return null;
    }
    const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
    const view = render(
      <GraphProvider initialLayers={ROLLBACK_LAYERS} initialCells={ROLLBACK_CELLS}>
        <Capture />
      </GraphProvider>
    );
    try {
      await waitFor(() => expect(captured.store?.graph.hasLayer('notes')).toBe(true));
      const { api, store } = captured;
      const failure = new Error('transaction failed');

      expect(() =>
        act(() =>
          api!.transaction(
            () => {
              store!.graph.getCell('node').set('layer', 'cells');
              api!.setLayers([]);
              throw failure;
            },
            { rollbackOnError: true }
          )
        )
      ).toThrow(failure);
      await act(flushMicrotasks);

      expect(store!.graph.hasActiveBatch()).toBe(false);
      expect(store!.graph.hasLayer('notes')).toBe(true);
      expect(store!.graph.getCellLayerId(store!.graph.getCell('node'))).toBe('notes');
    } finally {
      view.unmount();
      warn.mockRestore();
    }
  });
});
