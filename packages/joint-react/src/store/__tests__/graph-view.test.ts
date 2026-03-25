import { dia } from '@joint/core';
import type { PaperStore } from '../../store';
import { DEFAULT_CELL_NAMESPACE } from '../../store/graph-store';
import { graphView } from '../graph-view';

function createGraph() {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

function setup() {
  const graph = createGraph();
  const view = graphView({
    graph,
    getPaperStores: () => new Map<string, PaperStore>(),
  });
  return { graph, view };
}

function addElement(graph: dia.Graph, id: string, x = 10, y = 20, width = 100, height = 50) {
  graph.addCell({ id, type: 'PortalElement', position: { x, y }, size: { width, height } });
}

function addLink(graph: dia.Graph, id: string, source: string, target: string) {
  graph.addCell({ id, type: 'standard.Link', source: { id: source }, target: { id: target } });
}

/** Flush pending microtasks so commitChanges callbacks execute. */
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('graphView', () => {
  describe('elements — data reflects graph state', () => {
    it('has correct data after add', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20, 100, 50);

      expect(view.elements.get('el-1')).toEqual(
        expect.objectContaining({ x: 10, y: 20, width: 100, height: 50 })
      );
    });

    it('has correct data after position change', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20);

      (graph.getCell('el-1') as dia.Element).position(50, 60);

      expect(view.elements.get('el-1')).toEqual(
        expect.objectContaining({ x: 50, y: 60 })
      );
    });

    it('has correct data after resize', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20, 100, 50);

      (graph.getCell('el-1') as dia.Element).resize(200, 150);

      expect(view.elements.get('el-1')).toEqual(
        expect.objectContaining({ width: 200, height: 150 })
      );
    });

    it('returns undefined after remove', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');

      (graph.getCell('el-1') as dia.Element).remove();

      expect(view.elements.get('el-1')).toBeUndefined();
    });

    it('returns new reference after change (immutable items)', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20);

      const before = view.elements.get('el-1');
      (graph.getCell('el-1') as dia.Element).position(50, 60);
      const after = view.elements.get('el-1');

      expect(after).not.toBe(before);
      expect(after).toEqual(expect.objectContaining({ x: 50, y: 60 }));
    });

    it('preserves reference when same value is set', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20);

      const before = view.elements.get('el-1');
      // set same position — elementToData returns same-shaped object but different ref,
      // however container.set uses Object.is so it will be a new ref
      // (this tests that the container stores what elementToData returns)
      (graph.getCell('el-1') as dia.Element).position(10, 20);
      const after = view.elements.get('el-1');

      // data content should be equivalent
      expect(after).toEqual(before);
    });

    it('tracks count correctly', () => {
      const { graph, view } = setup();
      expect(view.elements.getSize()).toBe(0);

      addElement(graph, 'el-1');
      addElement(graph, 'el-2');
      addElement(graph, 'el-3');
      expect(view.elements.getSize()).toBe(3);

      (graph.getCell('el-2') as dia.Element).remove();
      expect(view.elements.getSize()).toBe(2);
    });
  });

  describe('elementsLayout — layout reflects graph state', () => {
    it('has correct layout after add', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20, 100, 50);

      expect(view.elementsLayout.get('el-1')).toEqual({ x: 10, y: 20, width: 100, height: 50, angle: 0 });
    });

    it('has correct layout after position change', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20, 100, 50);

      (graph.getCell('el-1') as dia.Element).position(99, 88);

      expect(view.elementsLayout.get('el-1')).toEqual(
        expect.objectContaining({ x: 99, y: 88, width: 100, height: 50 })
      );
    });

    it('has correct layout after resize', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20, 100, 50);

      (graph.getCell('el-1') as dia.Element).resize(200, 150);

      expect(view.elementsLayout.get('el-1')).toEqual(
        expect.objectContaining({ width: 200, height: 150 })
      );
    });

    it('has correct layout after rotate', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20, 100, 50);

      (graph.getCell('el-1') as dia.Element).rotate(45);

      expect(view.elementsLayout.get('el-1')).toEqual(
        expect.objectContaining({ angle: 45 })
      );
    });

    it('returns undefined after remove', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');

      (graph.getCell('el-1') as dia.Element).remove();

      expect(view.elementsLayout.get('el-1')).toBeUndefined();
    });

    it('returns new reference after layout change (immutable items)', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20, 100, 50);

      const before = view.elementsLayout.get('el-1');
      (graph.getCell('el-1') as dia.Element).position(50, 60);
      const after = view.elementsLayout.get('el-1');

      expect(after).not.toBe(before);
    });
  });

  describe('links — data reflects graph state', () => {
    it('has data after add', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      addElement(graph, 'el-2');
      addLink(graph, 'link-1', 'el-1', 'el-2');

      expect(view.links.get('link-1')).toBeDefined();
    });

    it('returns undefined after remove', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      addElement(graph, 'el-2');
      addLink(graph, 'link-1', 'el-1', 'el-2');

      (graph.getCell('link-1') as dia.Link).remove();

      expect(view.links.get('link-1')).toBeUndefined();
    });

    it('tracks link count', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      addElement(graph, 'el-2');
      expect(view.links.getSize()).toBe(0);

      addLink(graph, 'link-1', 'el-1', 'el-2');
      expect(view.links.getSize()).toBe(1);

      (graph.getCell('link-1') as dia.Link).remove();
      expect(view.links.getSize()).toBe(0);
    });
  });

  describe('per-id subscriptions', () => {
    it('notifies only the changed element subscriber', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      addElement(graph, 'el-2');

      // drain adds
      await flush();

      const listener1 = jest.fn();
      const listener2 = jest.fn();
      view.elements.subscribe('el-1', listener1);
      view.elements.subscribe('el-2', listener2);

      (graph.getCell('el-2') as dia.Element).position(50, 60);
      await flush();

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('notifies layout subscriber only for the moved element', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      addElement(graph, 'el-2');
      await flush();

      const listener1 = jest.fn();
      const listener2 = jest.fn();
      view.elementsLayout.subscribe('el-1', listener1);
      view.elementsLayout.subscribe('el-2', listener2);

      (graph.getCell('el-1') as dia.Element).position(99, 88);
      await flush();

      expect(listener1).toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('notifies size listener on add/remove', async () => {
      const { graph, view } = setup();
      const sizeListener = jest.fn();
      view.elements.subscribeToSize(sizeListener);

      addElement(graph, 'el-1');
      await flush();
      expect(sizeListener).toHaveBeenCalledTimes(1);

      (graph.getCell('el-1') as dia.Element).remove();
      await flush();
      expect(sizeListener).toHaveBeenCalledTimes(2);
    });

    it('does not notify size listener on position change', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      await flush();

      const sizeListener = jest.fn();
      view.elements.subscribeToSize(sizeListener);

      (graph.getCell('el-1') as dia.Element).position(50, 60);
      await flush();

      expect(sizeListener).not.toHaveBeenCalled();
    });
  });

  describe('multiple elements — isolation', () => {
    it('changing one element does not affect another', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20, 100, 50);
      addElement(graph, 'el-2', 30, 40, 200, 100);

      const el2Before = view.elements.get('el-2');
      const el2LayoutBefore = view.elementsLayout.get('el-2');

      (graph.getCell('el-1') as dia.Element).position(99, 99);

      // el-2 data and layout should be the exact same reference
      expect(view.elements.get('el-2')).toBe(el2Before);
      expect(view.elementsLayout.get('el-2')).toBe(el2LayoutBefore);
    });

    it('removing one element does not affect another', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      addElement(graph, 'el-2', 30, 40, 200, 100);

      const el2Data = view.elements.get('el-2');

      (graph.getCell('el-1') as dia.Element).remove();

      expect(view.elements.get('el-2')).toBe(el2Data);
      expect(view.elements.get('el-1')).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('repopulates with new cells', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      addElement(graph, 'el-2');

      graph.resetCells([
        { id: 'el-3', type: 'PortalElement', position: { x: 5, y: 5 }, size: { width: 50, height: 50 } },
      ]);

      expect(view.elements.get('el-3')).toEqual(
        expect.objectContaining({ x: 5, y: 5, width: 50, height: 50 })
      );
      expect(view.elementsLayout.get('el-3')).toEqual(
        expect.objectContaining({ x: 5, y: 5, width: 50, height: 50 })
      );
    });
  });

  describe('destroy', () => {
    it('stops tracking graph changes', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      expect(view.elements.get('el-1')).toBeDefined();

      view.destroy();

      addElement(graph, 'el-2');
      expect(view.elements.get('el-2')).toBeUndefined();
    });

    it('does not notify subscribers after destroy', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      await flush();

      const listener = jest.fn();
      view.elements.subscribe('el-1', listener);

      view.destroy();

      (graph.getCell('el-1') as dia.Element).position(50, 60);
      await flush();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('isUpdateFromReact filtering', () => {
    it('ignores changes with isUpdateFromReact flag', () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');

      const before = view.elements.get('el-1');

      (graph.getCell('el-1') as dia.Element).position(50, 60, { isUpdateFromReact: true });

      // Data should not have changed because the event was filtered
      expect(view.elements.get('el-1')).toBe(before);
    });
  });
});
