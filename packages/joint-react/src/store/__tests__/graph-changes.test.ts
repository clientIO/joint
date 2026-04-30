import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE } from '../graph-store';
import { graphChanges } from '../graph-changes';
import type { CellRecord } from '../../types/cell.types';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';

function createGraph() {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

function setup() {
  const graph = createGraph();
  const onChanges = jest.fn();
  const controller = graphChanges({
    graph,
    onChanges,
  });
  return { graph, onChanges, controller };
}

function addElement(graph: dia.Graph, id: string, x = 10, y = 20, width = 100, height = 50) {
  graph.addCell({
    id,
    type: 'element',
    position: { x, y },
    size: { width, height },
  });
}

function addLink(graph: dia.Graph, id: string, source: string, target: string) {
  graph.addCell({
    id,
    type: 'standard.Link',
    source: { id: source },
    target: { id: target },
  });
}

/** Flush pending microtasks so scheduled callbacks execute. */
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('graphChanges', () => {
  describe('cell events', () => {
    it('calls onChanges with "add" when element is added', async () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');
      await flush();

      expect(onChanges).toHaveBeenCalled();
      const [[{ changes }]] = onChanges.mock.calls;
      expect(changes.get('el-1')).toEqual(expect.objectContaining({ type: 'add' }));
    });

    it('calls onChanges with "change" when element position changes', async () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');
      await flush();
      onChanges.mockClear();

      const element = graph.getCell('el-1') as dia.Element;
      element.position(50, 60);
      await flush();

      expect(onChanges).toHaveBeenCalled();
      const [lastCall] = onChanges.mock.calls.at(-1) ?? [];
      expect(lastCall.changes.get('el-1')).toEqual(expect.objectContaining({ type: 'change' }));
    });

    it('calls onChanges with "remove" when element is removed', async () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');
      await flush();
      onChanges.mockClear();

      (graph.getCell('el-1') as dia.Element).remove();
      await flush();

      expect(onChanges).toHaveBeenCalled();
      const [lastCall] = onChanges.mock.calls.at(-1) ?? [];
      expect(lastCall.changes.get('el-1')).toEqual(expect.objectContaining({ type: 'remove' }));
    });

    it('calls onChanges for link add', async () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');
      addElement(graph, 'el-2');
      await flush();
      onChanges.mockClear();

      addLink(graph, 'link-1', 'el-1', 'el-2');
      await flush();

      expect(onChanges).toHaveBeenCalled();
      const [lastCall] = onChanges.mock.calls.at(-1) ?? [];
      expect(lastCall.changes.get('link-1')).toEqual(expect.objectContaining({ type: 'add' }));
    });

    it('calls onChanges synchronously on graph reset (bypasses scheduler)', () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');

      // Reset must invoke onChanges within the same tick — callers (e.g.
      // GraphStore constructor) rely on the cells container being
      // observable immediately after `graph.resetCells(...)` returns.
      onChanges.mockClear();
      graph.resetCells([
        {
          id: 'reset-el',
          type: 'element',
          position: { x: 0, y: 0 },
          size: { width: 50, height: 50 },
        },
      ]);

      expect(onChanges).toHaveBeenCalledTimes(1);
      const [[{ changes }]] = onChanges.mock.calls;
      expect(changes.has('reset-el')).toBe(true);
      expect(changes.has('el-1')).toBe(false);
    });

    it('calls onChanges on graph reset', async () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');
      await flush();
      onChanges.mockClear();

      graph.resetCells([
        {
          id: 'el-2',
          type: 'element',
          position: { x: 0, y: 0 },
          size: { width: 50, height: 50 },
        },
      ]);
      await flush();

      expect(onChanges).toHaveBeenCalled();
      const [lastCall] = onChanges.mock.calls.at(-1) ?? [];
      expect(lastCall.changes.get('el-2')).toEqual(expect.objectContaining({ type: 'add' }));
      // old element should not be in changes (reset clears the map first)
      expect(lastCall.changes.has('el-1')).toBe(false);
    });
  });

  describe('isUpdateFromReact filtering', () => {
    it('ignores add events with isUpdateFromReact flag', async () => {
      const { graph, onChanges } = setup();
      graph.addCell(
        {
          id: 'el-1',
          type: 'element',
          position: { x: 0, y: 0 },
          size: { width: 50, height: 50 },
        },
        { isUpdateFromReact: true }
      );
      await flush();

      expect(onChanges).not.toHaveBeenCalled();
    });

    it('ignores change events with isUpdateFromReact flag', async () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');
      await flush();
      onChanges.mockClear();

      const element = graph.getCell('el-1') as dia.Element;
      element.position(50, 60, { isUpdateFromReact: true });
      await flush();

      expect(onChanges).not.toHaveBeenCalled();
    });

    it('ignores remove events with isUpdateFromReact flag', async () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');
      await flush();
      onChanges.mockClear();

      const element = graph.getCell('el-1') as dia.Element;
      element.remove({ isUpdateFromReact: true });
      await flush();

      // batch:stop still fires onChanges, but it should not contain a 'remove' entry for el-1
      // because the remove event itself was filtered by isUpdateFromReact
      for (const [{ changes }] of onChanges.mock.calls) {
        const change = changes.get('el-1');
        expect(change?.type).not.toBe('remove');
      }
    });
  });

  describe('isInsideBatch', () => {
    it('sets isInsideBatch to false when not in batch', async () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');
      await flush();

      const [[{ isInsideBatch }]] = onChanges.mock.calls;
      expect(isInsideBatch).toBe(false);
    });

    it('sets isInsideBatch to true during batch', async () => {
      const { graph, onChanges } = setup();

      graph.startBatch('update');
      addElement(graph, 'el-1');
      await flush();

      // During batch, onChanges is still called but with isInsideBatch=true
      const [[duringBatch]] = onChanges.mock.calls;
      expect(duringBatch.isInsideBatch).toBe(true);

      onChanges.mockClear();
      graph.stopBatch('update');
      await flush();

      // On batch stop, onChanges is called again with isInsideBatch=false
      expect(onChanges).toHaveBeenCalled();
      const [afterBatch] = onChanges.mock.calls.at(-1) ?? [];
      expect(afterBatch.isInsideBatch).toBe(false);
    });

    it('fires onChanges on batch stop even with no cell changes', async () => {
      const { graph, onChanges } = setup();

      graph.startBatch('update');
      graph.stopBatch('update');
      await flush();

      // batch:stop always fires onChanges with the current (empty) changes map
      expect(onChanges).toHaveBeenCalled();
      const [{ changes, isInsideBatch }] = onChanges.mock.calls.at(-1) ?? [];
      expect(changes.size).toBe(0);
      expect(isInsideBatch).toBe(false);
    });

    it('handles nested batches — only fires on outermost stop', async () => {
      const { graph, onChanges } = setup();

      graph.startBatch('outer');
      graph.startBatch('inner');
      addElement(graph, 'el-1');
      await flush();
      onChanges.mockClear();

      graph.stopBatch('inner');
      await flush();
      // Inner stop should not trigger full onChanges (batchDepth still > 0)
      expect(onChanges).not.toHaveBeenCalled();

      graph.stopBatch('outer');
      await flush();
      // Outer stop should trigger
      expect(onChanges).toHaveBeenCalled();
      const [{ isInsideBatch }] = onChanges.mock.calls.at(-1) ?? [];
      expect(isInsideBatch).toBe(false);
    });
  });

  describe('updateGraph', () => {
    it('syncs a unified cells array to the graph', () => {
      const { graph, controller } = setup();
      const cells: readonly CellRecord[] = [
        {
          id: 'el-1',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 10, y: 20 },
          size: { width: 100, height: 50 },
        } as CellRecord,
      ];
      controller.updateGraph({ cells });

      const element = graph.getCell('el-1') as dia.Element;
      expect(element).toBeDefined();
      expect(element.position()).toEqual({ x: 10, y: 20 });
    });

    it('removes cells not in the update', () => {
      const { graph, controller } = setup();
      addElement(graph, 'el-1');

      controller.updateGraph({ cells: [] });

      expect(graph.getCell('el-1')).toBeUndefined();
    });

    it('routes links and elements through the unified cells input', () => {
      const { graph, controller } = setup();
      const cells: readonly CellRecord[] = [
        {
          id: 'a',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
        } as CellRecord,
        {
          id: 'b',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 50, y: 0 },
          size: { width: 10, height: 10 },
        } as CellRecord,
        {
          id: 'l1',
          type: LINK_MODEL_TYPE,
          source: { id: 'a' },
          target: { id: 'b' },
        } as CellRecord,
      ];
      controller.updateGraph({ cells });

      expect(graph.getCell('a')).toBeDefined();
      expect(graph.getCell('b')).toBeDefined();
      const link = graph.getCell('l1') as dia.Link;
      expect(link).toBeDefined();
      expect(link.source()).toEqual({ id: 'a' });
      expect(link.target()).toEqual({ id: 'b' });
    });

    it('uses syncCells with isUpdateFromReact flag', () => {
      const { graph, onChanges, controller } = setup();
      onChanges.mockClear();

      controller.updateGraph({
        cells: [
          {
            id: 'el-1',
            type: ELEMENT_MODEL_TYPE,
            position: { x: 10, y: 20 },
            size: { width: 100, height: 50 },
          } as CellRecord,
        ],
        flag: 'updateFromReact',
      });

      expect(onChanges).not.toHaveBeenCalled();
      expect(graph.getCell('el-1')).toBeDefined();
    });

    it('returns an empty cellIds list when no cells were provided', () => {
      const { controller } = setup();
      const result = controller.updateGraph({});
      expect(result.cellIds).toEqual([]);
    });

    it('returns the ids of synced cells', () => {
      const { controller } = setup();
      const cells: readonly CellRecord[] = [
        {
          id: 'el-1',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
        } as CellRecord,
        {
          id: 'el-2',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 20, y: 20 },
          size: { width: 10, height: 10 },
        } as CellRecord,
      ];
      const result = controller.updateGraph({ cells });
      expect([...result.cellIds].toSorted((a, b) => String(a).localeCompare(String(b)))).toEqual([
        'el-1',
        'el-2',
      ]);
    });
  });

  describe('onElementsSizeChange', () => {
    function setupWithSize() {
      const graph = createGraph();
      const onChanges = jest.fn();
      const onElementsSizeChange = jest.fn();
      const controller = graphChanges({
        graph,
        onChanges,
        onElementsSizeChange,
      });
      return { graph, onChanges, onElementsSizeChange, controller };
    }

    it('fires for each element when resetCells seeds cells with sizes', () => {
      const { graph, onElementsSizeChange } = setupWithSize();
      graph.resetCells([
        {
          id: 'a',
          type: 'element',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 50 },
        },
        {
          id: 'b',
          type: 'element',
          position: { x: 200, y: 0 },
          size: { width: 80, height: 40 },
        },
        {
          id: 'l1',
          type: 'standard.Link',
          source: { id: 'a' },
          target: { id: 'b' },
        },
      ]);

      const elementCalls = onElementsSizeChange.mock.calls.filter(
        ([id]) => id === 'a' || id === 'b'
      );
      expect(elementCalls).toHaveLength(2);
      expect(elementCalls).toEqual(
        expect.arrayContaining([
          ['a', { width: 100, height: 50 }],
          ['b', { width: 80, height: 40 }],
        ])
      );
    });

    it('does not fire for links on reset', () => {
      const { graph, onElementsSizeChange } = setupWithSize();
      graph.resetCells([
        {
          id: 'a',
          type: 'element',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 50 },
        },
        {
          id: 'b',
          type: 'element',
          position: { x: 200, y: 0 },
          size: { width: 80, height: 40 },
        },
        {
          id: 'l1',
          type: 'standard.Link',
          source: { id: 'a' },
          target: { id: 'b' },
        },
      ]);

      for (const [id] of onElementsSizeChange.mock.calls) {
        expect(id).not.toBe('l1');
      }
    });
  });

  describe('destroy', () => {
    it('stops listening to graph events', () => {
      const { graph, onChanges, controller } = setup();
      addElement(graph, 'el-1');
      onChanges.mockClear();

      controller.destroy();

      const element = graph.getCell('el-1') as dia.Element;
      element.position(99, 99);

      expect(onChanges).not.toHaveBeenCalled();
    });
  });
});
