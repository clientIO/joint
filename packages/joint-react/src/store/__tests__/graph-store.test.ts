/* eslint-disable unicorn/consistent-function-scoping */
import { dia } from '@joint/core';
import { GraphStore, DEFAULT_CELL_NAMESPACE } from '../graph-store';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import type { CellRecord, Cells } from '../../types/cell.types';

const createGraph = () => new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('GraphStore', () => {
  describe('constructor', () => {
    it('creates with a default graph and an empty cells container', () => {
      const store = new GraphStore({});
      expect(store.graph).toBeInstanceOf(dia.Graph);
      expect(store.graphView).toBeDefined();
      expect(store.graphView.cells.getSize()).toBe(0);
      store.destroy(false);
    });

    it('honors an externally-provided graph', () => {
      const graph = createGraph();
      const store = new GraphStore({ graph });
      expect(store.graph).toBe(graph);
      store.destroy(true);
    });

    it('seeds the graph from initialCells', () => {
      const initialCells: Cells = [
        {
          id: 'a',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 10, y: 20 },
          size: { width: 100, height: 50 },
        } as CellRecord,
        {
          id: 'b',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 30, y: 40 },
          size: { width: 80, height: 60 },
        } as CellRecord,
      ];
      const store = new GraphStore({ initialCells });
      expect(store.graph.getCell('a')).toBeDefined();
      expect(store.graph.getCell('b')).toBeDefined();
      expect(store.graphView.cells.getSize()).toBe(2);
      store.destroy(false);
    });

    it('seeds from an externally-populated graph via syncFromGraph', () => {
      const graph = createGraph();
      graph.addCell({
        id: 'a',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
      });
      const store = new GraphStore({ graph });
      expect(store.graphView.cells.has('a')).toBe(true);
      store.destroy(true);
    });

    it('accepts a controlled cells prop and mirrors it into the graph', () => {
      const cells: Cells = [
        {
          id: 'x',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
        } as CellRecord,
      ];
      const store = new GraphStore({ cells });
      expect(store.graphView.cells.has('x')).toBe(true);
      expect(store.graph.getCell('x')).toBeDefined();
      store.destroy(false);
    });
  });

  describe('onCellsChange', () => {
    it('fires with the full cells array after a graph mutation', async () => {
      const onCellsChange = jest.fn();
      const store = new GraphStore({ onCellsChange });
      store.graph.addCell({
        id: 'a',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
      });
      await flush();
      expect(onCellsChange).toHaveBeenCalled();
      const lastArgument = onCellsChange.mock.calls.at(-1)![0] as readonly CellRecord[];
      expect(Array.isArray(lastArgument)).toBe(true);
      expect(lastArgument.some((c) => c.id === 'a')).toBe(true);
      store.destroy(false);
    });
  });

  describe('onIncrementalCellsChange', () => {
    /** Clone synchronously — the store clears its tracking maps after the callback returns. */
    const snapshot = (changes: {
      added: Map<string, unknown>;
      changed: Map<string, unknown>;
      removed: Set<string>;
    }) => ({
      added: new Map(changes.added),
      changed: new Map(changes.changed),
      removed: new Set(changes.removed),
    });

    it('fires with added/changed/removed summary', async () => {
      const snaps: Array<ReturnType<typeof snapshot>> = [];
      const store = new GraphStore({
        onIncrementalCellsChange: (c) => snaps.push(snapshot(c as Parameters<typeof snapshot>[0])),
      });
      store.graph.addCell({
        id: 'a',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
      });
      await flush();
      const last = snaps.at(-1)!;
      expect(last.added.has('a')).toBe(true);
      expect(last.changed.size).toBe(0);
      expect(last.removed.size).toBe(0);
      store.destroy(false);
    });

    it('reports links alongside elements in the unified pipeline', async () => {
      const snaps: Array<ReturnType<typeof snapshot>> = [];
      const store = new GraphStore({
        onIncrementalCellsChange: (c) => snaps.push(snapshot(c as Parameters<typeof snapshot>[0])),
      });
      store.graph.addCells([
        {
          id: 'a',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
        },
        {
          id: 'b',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 50, y: 0 },
          size: { width: 10, height: 10 },
        },
        {
          id: 'l1',
          type: LINK_MODEL_TYPE,
          source: { id: 'a' },
          target: { id: 'b' },
        },
      ]);
      await flush();
      const last = snaps.at(-1)!;
      expect(last.added.has('l1')).toBe(true);
      store.destroy(false);
    });
  });

  describe('applyControlled', () => {
    it('re-syncs the graph to the parent snapshot', () => {
      const initial: Cells = [
        {
          id: 'a',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
        } as CellRecord,
      ];
      const store = new GraphStore({ cells: initial });
      expect(store.graphView.cells.has('a')).toBe(true);

      store.applyControlled([
        {
          id: 'b',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
        } as CellRecord,
      ]);
      expect(store.graphView.cells.has('a')).toBe(false);
      expect(store.graphView.cells.has('b')).toBe(true);
      store.destroy(false);
    });
  });

  describe('destroy', () => {
    it('clears features, papers, and internal state', () => {
      const store = new GraphStore({});
      store.destroy(false);
      expect(Object.keys(store.features)).toHaveLength(0);
      expect(store.paperStores.size).toBe(0);
    });
  });
});
