import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE } from '../graph-store';
import { graphChanges } from '../graph-changes';
import type { FlatElementData, FlatLinkData } from '../../types/data-types';
import { flatMapDataToElementAttributes, flatMapDataToLinkAttributes } from '../../state/data-mapping';

function createGraph() {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

function defaultElementToAttributes({ id, data }: { id: string; data: FlatElementData }) {
  return flatMapDataToElementAttributes({ id, data });
}

function defaultLinkToAttributes({ id, data }: { id?: string; data: FlatLinkData }) {
  return flatMapDataToLinkAttributes({ id: id ?? '', data });
}

interface SetupOptions {
  enableBatchUpdates?: boolean;
}

function setup(options: SetupOptions = {}) {
  const graph = createGraph();
  const onChanges = jest.fn();
  const controller = graphChanges({
    graph,
    onChanges,
    enableBatchUpdates: options.enableBatchUpdates,
    elementToAttributes: defaultElementToAttributes,
    linkToAttributes: defaultLinkToAttributes,
  });
  return { graph, onChanges, controller };
}

function addElement(graph: dia.Graph, id: string, x = 10, y = 20, width = 100, height = 50) {
  graph.addCell({
    id,
    type: 'PortalElement',
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

describe('graphChanges', () => {
  describe('cell events', () => {
    it('calls onChanges with "add" when element is added', () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');

      expect(onChanges).toHaveBeenCalled();
      const { changes } = onChanges.mock.calls[0][0];
      expect(changes.get('el-1')).toEqual(
        expect.objectContaining({ type: 'add' })
      );
    });

    it('calls onChanges with "change" when element position changes', () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');
      onChanges.mockClear();

      const element = graph.getCell('el-1') as dia.Element;
      element.position(50, 60);

      expect(onChanges).toHaveBeenCalled();
      const lastCall = onChanges.mock.calls.at(-1)[0];
      expect(lastCall.changes.get('el-1')).toEqual(
        expect.objectContaining({ type: 'change' })
      );
    });

    it('calls onChanges with "remove" when element is removed', () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');
      onChanges.mockClear();

      (graph.getCell('el-1') as dia.Element).remove();

      expect(onChanges).toHaveBeenCalled();
      const lastCall = onChanges.mock.calls.at(-1)[0];
      expect(lastCall.changes.get('el-1')).toEqual(
        expect.objectContaining({ type: 'remove' })
      );
    });

    it('calls onChanges for link add', () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');
      addElement(graph, 'el-2');
      onChanges.mockClear();

      addLink(graph, 'link-1', 'el-1', 'el-2');

      expect(onChanges).toHaveBeenCalled();
      const lastCall = onChanges.mock.calls.at(-1)[0];
      expect(lastCall.changes.get('link-1')).toEqual(
        expect.objectContaining({ type: 'add' })
      );
    });

    it('calls onChanges on graph reset', () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');
      onChanges.mockClear();

      graph.resetCells([
        { id: 'el-2', type: 'PortalElement', position: { x: 0, y: 0 }, size: { width: 50, height: 50 } },
      ]);

      expect(onChanges).toHaveBeenCalled();
      const lastCall = onChanges.mock.calls.at(-1)[0];
      expect(lastCall.changes.get('el-2')).toEqual(
        expect.objectContaining({ type: 'add' })
      );
      // old element should not be in changes (reset clears the map first)
      expect(lastCall.changes.has('el-1')).toBe(false);
    });
  });

  describe('isUpdateFromReact filtering', () => {
    it('ignores add events with isUpdateFromReact flag', () => {
      const { graph, onChanges } = setup();
      graph.addCell(
        { id: 'el-1', type: 'PortalElement', position: { x: 0, y: 0 }, size: { width: 50, height: 50 } },
        { isUpdateFromReact: true }
      );

      expect(onChanges).not.toHaveBeenCalled();
    });

    it('ignores change events with isUpdateFromReact flag', () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');
      onChanges.mockClear();

      const element = graph.getCell('el-1') as dia.Element;
      element.position(50, 60, { isUpdateFromReact: true });

      expect(onChanges).not.toHaveBeenCalled();
    });

    it('ignores remove events with isUpdateFromReact flag', () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');
      onChanges.mockClear();

      const element = graph.getCell('el-1') as dia.Element;
      element.remove({ isUpdateFromReact: true });

      expect(onChanges).not.toHaveBeenCalled();
    });
  });

  describe('onlyLayoutUpdate', () => {
    it('sets onlyLayoutUpdate to false when not in batch', () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');

      const { onlyLayoutUpdate } = onChanges.mock.calls[0][0];
      expect(onlyLayoutUpdate).toBe(false);
    });

    it('sets onlyLayoutUpdate to false even in batch when enableBatchUpdates is off', () => {
      const { graph, onChanges } = setup({ enableBatchUpdates: false });

      graph.startBatch('update');
      addElement(graph, 'el-1');

      const { onlyLayoutUpdate } = onChanges.mock.calls[0][0];
      expect(onlyLayoutUpdate).toBe(false);
      graph.stopBatch('update');
    });
  });

  describe('batch updates', () => {
    it('sets onlyLayoutUpdate to true during batch when enabled', () => {
      const { graph, onChanges } = setup({ enableBatchUpdates: true });

      graph.startBatch('update');
      addElement(graph, 'el-1');

      // During batch, onChanges is still called but with onlyLayoutUpdate=true
      const duringBatch = onChanges.mock.calls[0][0];
      expect(duringBatch.onlyLayoutUpdate).toBe(true);

      onChanges.mockClear();
      graph.stopBatch('update');

      // On batch stop, onChanges is called again with onlyLayoutUpdate=false
      expect(onChanges).toHaveBeenCalled();
      const afterBatch = onChanges.mock.calls.at(-1)[0];
      expect(afterBatch.onlyLayoutUpdate).toBe(false);
    });

    it('does not fire extra onChanges on batch stop if no changes', () => {
      const { graph, onChanges } = setup({ enableBatchUpdates: true });

      graph.startBatch('update');
      graph.stopBatch('update');

      expect(onChanges).not.toHaveBeenCalled();
    });

    it('handles nested batches — only fires on outermost stop', () => {
      const { graph, onChanges } = setup({ enableBatchUpdates: true });

      graph.startBatch('outer');
      graph.startBatch('inner');
      addElement(graph, 'el-1');
      onChanges.mockClear();

      graph.stopBatch('inner');
      // Inner stop should not trigger full onChanges (batchDepth still > 0)
      expect(onChanges).not.toHaveBeenCalled();

      graph.stopBatch('outer');
      // Outer stop should trigger
      expect(onChanges).toHaveBeenCalled();
      const { onlyLayoutUpdate } = onChanges.mock.calls.at(-1)[0];
      expect(onlyLayoutUpdate).toBe(false);
    });
  });

  describe('updateGraph', () => {
    it('syncs elements to the graph', () => {
      const { graph, controller } = setup();
      controller.updateGraph({
        elements: {
          'el-1': { data: {}, x: 10, y: 20, width: 100, height: 50 } as FlatElementData,
        },
        links: {},
      });

      const element = graph.getCell('el-1') as dia.Element;
      expect(element).toBeDefined();
      expect(element.position()).toEqual({ x: 10, y: 20 });
    });

    it('removes elements not in the update', () => {
      const { graph, controller } = setup();
      addElement(graph, 'el-1');

      controller.updateGraph({ elements: {}, links: {} });

      expect(graph.getCell('el-1')).toBeUndefined();
    });

    it('uses syncCells with isUpdateFromReact flag', () => {
      const { graph, onChanges, controller } = setup();
      onChanges.mockClear();

      controller.updateGraph({
        elements: {
          'el-1': { data: {}, x: 10, y: 20, width: 100, height: 50 } as FlatElementData,
        },
        links: {},
        flag: 'updateFromReact',
      });

      // syncCells with isUpdateFromReact=true should not trigger onChanges
      expect(onChanges).not.toHaveBeenCalled();
      // But the element should still be in the graph
      expect(graph.getCell('el-1')).toBeDefined();
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
