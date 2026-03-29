import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE } from '../graph-store';
import { graphChanges } from '../graph-changes';
import type { ElementRecord, LinkRecord } from '../../types/data-types';
import { elementToAttributes, linkToAttributes } from '../../state/data-mapping';

function createGraph() {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

function defaultElementToAttributes({ id, element }: { id: string; element: ElementRecord }) {
  return elementToAttributes({ id, element });
}

function defaultLinkToAttributes({ id, link }: { id?: string; link: LinkRecord }) {
  return linkToAttributes({ id: id ?? '', link });
}

function setup() {
  const graph = createGraph();
  const onChanges = jest.fn();
  const controller = graphChanges({
    graph,
    onChanges,
    mapElementToAttributes: defaultElementToAttributes,
    mapLinkToAttributes: defaultLinkToAttributes,
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

/** Flush pending microtasks so scheduled callbacks execute. */
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('graphChanges', () => {
  describe('cell events', () => {
    it('calls onChanges with "add" when element is added', async () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');
      await flush();

      expect(onChanges).toHaveBeenCalled();
      const { changes } = onChanges.mock.calls[0][0];
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
      const lastCall = onChanges.mock.calls.at(-1)[0];
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
      const lastCall = onChanges.mock.calls.at(-1)[0];
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
      const lastCall = onChanges.mock.calls.at(-1)[0];
      expect(lastCall.changes.get('link-1')).toEqual(expect.objectContaining({ type: 'add' }));
    });

    it('calls onChanges on graph reset', async () => {
      const { graph, onChanges } = setup();
      addElement(graph, 'el-1');
      await flush();
      onChanges.mockClear();

      graph.resetCells([
        {
          id: 'el-2',
          type: 'PortalElement',
          position: { x: 0, y: 0 },
          size: { width: 50, height: 50 },
        },
      ]);
      await flush();

      expect(onChanges).toHaveBeenCalled();
      const lastCall = onChanges.mock.calls.at(-1)[0];
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
          type: 'PortalElement',
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
      for (const call of onChanges.mock.calls) {
        const { changes } = call[0];
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

      const { isInsideBatch } = onChanges.mock.calls[0][0];
      expect(isInsideBatch).toBe(false);
    });

    it('sets isInsideBatch to true during batch', async () => {
      const { graph, onChanges } = setup();

      graph.startBatch('update');
      addElement(graph, 'el-1');
      await flush();

      // During batch, onChanges is still called but with isInsideBatch=true
      const duringBatch = onChanges.mock.calls[0][0];
      expect(duringBatch.isInsideBatch).toBe(true);

      onChanges.mockClear();
      graph.stopBatch('update');
      await flush();

      // On batch stop, onChanges is called again with isInsideBatch=false
      expect(onChanges).toHaveBeenCalled();
      const afterBatch = onChanges.mock.calls.at(-1)[0];
      expect(afterBatch.isInsideBatch).toBe(false);
    });

    it('fires onChanges on batch stop even with no cell changes', async () => {
      const { graph, onChanges } = setup();

      graph.startBatch('update');
      graph.stopBatch('update');
      await flush();

      // batch:stop always fires onChanges with the current (empty) changes map
      expect(onChanges).toHaveBeenCalled();
      const { changes, isInsideBatch } = onChanges.mock.calls.at(-1)[0];
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
      const { isInsideBatch } = onChanges.mock.calls.at(-1)[0];
      expect(isInsideBatch).toBe(false);
    });
  });

  describe('updateGraph', () => {
    it('syncs elements to the graph', () => {
      const { graph, controller } = setup();
      controller.updateGraph({
        elements: {
          'el-1': { data: undefined, position: { x: 10, y: 20 }, size: { width: 100, height: 50 } } as ElementRecord<undefined>,
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
          'el-1': { data: undefined, position: { x: 10, y: 20 }, size: { width: 100, height: 50 } } as ElementRecord<undefined>,
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
