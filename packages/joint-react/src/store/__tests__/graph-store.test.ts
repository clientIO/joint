/* eslint-disable unicorn/consistent-function-scoping */
import { dia, shapes } from '@joint/core';
import { GraphStore, DEFAULT_CELL_NAMESPACE } from '../graph-store';
import { ELEMENT_MODEL_TYPE, ElementModel } from '../../mvc/element-model';
import { LINK_MODEL_TYPE, LinkModel } from '../../mvc/link-model';
import type { CellRecord } from '../../types/cell.types';

const createGraph = () => new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('GraphStore', () => {
  describe('constructor', () => {
    it('creates with a default graph and an empty cells container', () => {
      const store = new GraphStore({});
      expect(store.graph).toBeInstanceOf(dia.Graph);
      expect(store.graphProjection).toBeDefined();
      expect(store.graphProjection.cells.getSize()).toBe(0);
      store.destroy(false);
    });

    it('honors an externally-provided graph', () => {
      const graph = createGraph();
      const store = new GraphStore({ graph });
      expect(store.graph).toBe(graph);
      store.destroy(true);
    });

    it('seeds the graph from initialCells', () => {
      const initialCells: readonly CellRecord[] = [
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
      expect(store.graphProjection.cells.getSize()).toBe(2);
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
      expect(store.graphProjection.cells.has('a')).toBe(true);
      store.destroy(true);
    });

    it('bumps measureState after initialCells seed (so useOnElementsMeasured can fire isInitial)', async () => {
      const initialCells: readonly CellRecord[] = [
        {
          id: 'a',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 100, height: 50 },
        } as CellRecord,
      ];
      const store = new GraphStore({ initialCells });
      // simpleScheduler defers the measureState bump to a microtask.
      await flush();
      expect(store.measureState.get()).toBeGreaterThan(0);
      store.destroy(false);
    });

    it('does not bump measureState when initialCells contain only links or zero-sized elements', async () => {
      const initialCells: readonly CellRecord[] = [
        {
          id: 'zero',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 0, height: 0 },
        } as CellRecord,
      ];
      const store = new GraphStore({ initialCells });
      await flush();
      expect(store.measureState.get()).toBe(0);
      store.destroy(false);
    });

    it('seeds from dia.Cell instances in initialCells', () => {
      const element = new ElementModel({
        id: 'dia-el',
        position: { x: 5, y: 10 },
        size: { width: 80, height: 40 },
      });
      const link = new LinkModel({
        id: 'dia-lk',
        source: { id: 'dia-el' },
        target: { x: 100, y: 100 },
      });
      const store = new GraphStore({ initialCells: [element, link] });
      expect(store.graph.getCell('dia-el')).toBeDefined();
      expect(store.graph.getCell('dia-lk')).toBeDefined();
      expect(store.graphProjection.cells.getSize()).toBe(2);
      store.destroy(false);
    });

    it('seeds from shapes.standard.Rectangle dia.Cell in initialCells', () => {
      const rect = new shapes.standard.Rectangle({
        id: 'rect-1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
      });
      const store = new GraphStore({ initialCells: [rect] });
      expect(store.graph.getCell('rect-1')).toBeDefined();
      expect(store.graph.getCell('rect-1')!.get('type')).toBe('standard.Rectangle');
      expect(store.graphProjection.cells.getSize()).toBe(1);
      store.destroy(false);
    });

    it('seeds from a mix of plain records and dia.Cell instances', () => {
      const record: CellRecord = {
        id: 'rec-a',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
      } as CellRecord;
      const diaElement = new ElementModel({
        id: 'dia-b',
        position: { x: 50, y: 50 },
        size: { width: 20, height: 20 },
      });
      const store = new GraphStore({ initialCells: [record, diaElement] });
      expect(store.graph.getCell('rec-a')).toBeDefined();
      expect(store.graph.getCell('dia-b')).toBeDefined();
      expect(store.graphProjection.cells.getSize()).toBe(2);
      store.destroy(false);
    });

    it('accepts a controlled cells prop and mirrors it into the graph', () => {
      const cells: readonly CellRecord[] = [
        {
          id: 'x',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
        } as CellRecord,
      ];
      const store = new GraphStore({ initialCells: cells });
      expect(store.graphProjection.cells.has('x')).toBe(true);
      expect(store.graph.getCell('x')).toBeDefined();
      store.destroy(false);
    });
  });

  describe('onCellsChange', () => {
    it('fires with the full cells array after a graph mutation', async () => {
      const onCellsChange = jest.fn();
      const store = new GraphStore({});
      store.setOnIncrementalCellsChange(() => {
        onCellsChange(store.graphProjection.cells.getAll());
      });
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
      const store = new GraphStore({});
      store.setOnIncrementalCellsChange((c) => snaps.push(snapshot(c as Parameters<typeof snapshot>[0])));
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
      const store = new GraphStore({});
      store.setOnIncrementalCellsChange((c) => snaps.push(snapshot(c as Parameters<typeof snapshot>[0])));
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
      const initial: readonly CellRecord[] = [
        {
          id: 'a',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
        } as CellRecord,
      ];
      const store = new GraphStore({ initialCells: initial });
      expect(store.graphProjection.cells.has('a')).toBe(true);

      store.applyControlled([
        {
          id: 'b',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
        } as CellRecord,
      ]);
      expect(store.graphProjection.cells.has('a')).toBe(false);
      expect(store.graphProjection.cells.has('b')).toBe(true);
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
