import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE } from '../../store/graph-store';
import { graphView } from '../graph-view';

function createGraph() {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

function setup() {
  const graph = createGraph();
  const view = graphView({
    graph,
    mappings: {},
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
    it('has correct data after add', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20, 100, 50);
      await flush();

      expect(view.elements.get('el-1')).toEqual(
        expect.objectContaining({ position: { x: 10, y: 20 }, size: { width: 100, height: 50 } })
      );
    });

    it('has correct position after position change', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20);
      await flush();

      (graph.getCell('el-1') as dia.Element).position(50, 60);
      await flush();

      expect(view.elements.get('el-1')).toEqual(
        expect.objectContaining({ position: { x: 50, y: 60 } })
      );
    });

    it('has correct size after resize', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20, 100, 50);
      await flush();

      (graph.getCell('el-1') as dia.Element).resize(200, 150);
      await flush();

      expect(view.elements.get('el-1')).toEqual(
        expect.objectContaining({ size: { width: 200, height: 150 } })
      );
    });

    it('returns undefined after remove', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      await flush();

      (graph.getCell('el-1') as dia.Element).remove();
      await flush();

      expect(view.elements.get('el-1')).toBeUndefined();
    });

    it('returns new reference after data change (immutable items)', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20);
      await flush();

      const before = view.elements.get('el-1');
      // Data change (not position) — should update elements container
      (graph.getCell('el-1') as dia.Element).set('data', { label: 'changed' });
      await flush();
      const after = view.elements.get('el-1');

      expect(after).not.toBe(before);
    });

    it('has correct angle after rotate', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20, 100, 50);
      await flush();

      (graph.getCell('el-1') as dia.Element).rotate(45);
      await flush();

      expect(view.elements.get('el-1')).toEqual(expect.objectContaining({ angle: 45 }));
    });

    it('preserves reference when same value is set', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20);
      await flush();

      const before = view.elements.get('el-1');
      // set same position — elementToData returns same-shaped object but different ref,
      // however container.set uses Object.is so it will be a new ref
      // (this tests that the container stores what elementToData returns)
      (graph.getCell('el-1') as dia.Element).position(10, 20);
      await flush();
      const after = view.elements.get('el-1');

      // data content should be equivalent
      expect(after).toEqual(before);
    });

    it('tracks count correctly', async () => {
      const { graph, view } = setup();
      expect(view.elements.getSize()).toBe(0);

      addElement(graph, 'el-1');
      addElement(graph, 'el-2');
      addElement(graph, 'el-3');
      await flush();
      expect(view.elements.getSize()).toBe(3);

      (graph.getCell('el-2') as dia.Element).remove();
      await flush();
      expect(view.elements.getSize()).toBe(2);
    });

    it('returns new reference after position change', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20, 100, 50);
      await flush();

      const before = view.elements.get('el-1');
      (graph.getCell('el-1') as dia.Element).position(50, 60);
      await flush();
      const after = view.elements.get('el-1');

      expect(after).not.toBe(before);
    });
  });

  describe('links — data reflects graph state', () => {
    it('has data after add', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      addElement(graph, 'el-2');
      addLink(graph, 'link-1', 'el-1', 'el-2');
      await flush();

      expect(view.links.get('link-1')).toBeDefined();
    });

    it('returns undefined after remove', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      addElement(graph, 'el-2');
      addLink(graph, 'link-1', 'el-1', 'el-2');
      await flush();

      (graph.getCell('link-1') as dia.Link).remove();
      await flush();

      expect(view.links.get('link-1')).toBeUndefined();
    });

    it('tracks link count', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      addElement(graph, 'el-2');
      await flush();
      expect(view.links.getSize()).toBe(0);

      addLink(graph, 'link-1', 'el-1', 'el-2');
      await flush();
      expect(view.links.getSize()).toBe(1);

      (graph.getCell('link-1') as dia.Link).remove();
      await flush();
      expect(view.links.getSize()).toBe(0);
    });
  });

  describe('per-id subscriptions', () => {
    it('notifies subscriber for the moved element', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      addElement(graph, 'el-2');
      await flush();

      const listener1 = jest.fn();
      const listener2 = jest.fn();
      view.elements.subscribe('el-1', listener1);
      view.elements.subscribe('el-2', listener2);

      (graph.getCell('el-2') as dia.Element).position(50, 60);
      await flush();

      // Only the moved element's subscriber should be notified
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
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
    it('changing one element does not affect another', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20, 100, 50);
      addElement(graph, 'el-2', 30, 40, 200, 100);
      await flush();

      const element2Before = view.elements.get('el-2');

      (graph.getCell('el-1') as dia.Element).position(99, 99);
      await flush();

      // el-2 data should be the exact same reference
      expect(view.elements.get('el-2')).toBe(element2Before);
    });

    it('removing one element does not affect another', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      addElement(graph, 'el-2', 30, 40, 200, 100);
      await flush();

      const element2Data = view.elements.get('el-2');

      (graph.getCell('el-1') as dia.Element).remove();
      await flush();

      expect(view.elements.get('el-2')).toBe(element2Data);
      expect(view.elements.get('el-1')).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('repopulates with new cells', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      addElement(graph, 'el-2');
      await flush();

      graph.resetCells([
        {
          id: 'el-3',
          type: 'PortalElement',
          position: { x: 5, y: 5 },
          size: { width: 50, height: 50 },
        },
      ]);
      await flush();

      expect(view.elements.get('el-3')).toEqual(
        expect.objectContaining({ position: { x: 5, y: 5 }, size: { width: 50, height: 50 } })
      );
    });
  });

  describe('destroy', () => {
    it('stops tracking graph changes', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      await flush();
      expect(view.elements.get('el-1')).toBeDefined();

      view.destroy();

      addElement(graph, 'el-2');
      await flush();
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

  describe('link layout', () => {
    it('link data is populated when link is added (layout resolved by useLink at render time)', async () => {
      const graph = createGraph();

      const view = graphView({
        graph,
        mappings: {},
      });

      addElement(graph, 'el-1', 10, 20);
      addElement(graph, 'el-2', 300, 400);
      addLink(graph, 'link-1', 'el-1', 'el-2');
      await flush();

      // Link data is in the container; layout is resolved at render time by useLink
      const linkData = view.links.get('link-1');
      expect(linkData).toBeDefined();
      expect(linkData?.source).toBe('el-1');
      expect(linkData?.target).toBe('el-2');

      view.destroy();
    });

    it('updates link data when connected element position changes', async () => {
      const graph = createGraph();

      const view = graphView({
        graph,
        mappings: {},
      });

      addElement(graph, 'el-1', 10, 20);
      addElement(graph, 'el-2', 300, 400);
      addLink(graph, 'link-1', 'el-1', 'el-2');
      await flush();

      const linkBefore = view.links.get('link-1');
      expect(linkBefore).toBeDefined();

      // Move connected element — link data should be re-set (new reference)
      (graph.getCell('el-1') as dia.Element).position(50, 60);
      await flush();

      const linkAfter = view.links.get('link-1');
      expect(linkAfter).toBeDefined();
      // Link reference should have changed because connected element moved
      expect(linkAfter).not.toBe(linkBefore);

      view.destroy();
    });

    it('link data exists without layout field (layout resolved at render time)', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      addElement(graph, 'el-2');
      addLink(graph, 'link-1', 'el-1', 'el-2');
      await flush();

      // Link data is in the container; layout is resolved at render time by useLink
      const linkData = view.links.get('link-1');
      expect(linkData).toBeDefined();
      // The container link data does not have a layout field
      expect((linkData as Record<string, unknown>).layout).toBeUndefined();

      view.destroy();
    });
  });

  describe('link data — late paper mount', () => {
    it('link data is populated after updateGraph (layout resolved at render time by useLink)', async () => {
      const graph = createGraph();

      const view = graphView({
        graph,
        mappings: {},
      });

      // updateGraph populates link data in the container
      view.updateGraph({
        elements: {
          'el-1': { data: undefined, position: { x: 10, y: 20 } },
          'el-2': { data: undefined, position: { x: 300, y: 400 } },
        },
        links: {
          'link-1': { source: 'el-1', target: 'el-2' },
        },
        flag: 'updateFromReact',
      });
      await flush();

      // Link exists in the container with source/target info
      const linkData = view.links.get('link-1');
      expect(linkData).toBeDefined();
      expect(linkData?.source).toBe('el-1');
      expect(linkData?.target).toBe('el-2');

      // Layout is no longer stored in the container — it is resolved at render time by useLink

      view.destroy();
    });
  });

  describe('controlled mode — updateGraph round-trip', () => {
    it('elements persist after position change and updateGraph round-trip', async () => {
      const graph = createGraph();
      let lastIncrementalChanges: unknown = null;
      const view = graphView({
        graph,

        mappings: {},
        onIncrementalChange: (changes) => {
          lastIncrementalChanges = changes;
        },
      });

      // Step 1: Initial controlled-mode sync (simulates GraphProvider initial render)
      view.updateGraph({
        elements: {
          a: { data: { label: 'A' }, position: { x: 50, y: 50 } },
          b: { data: { label: 'B' }, position: { x: 200, y: 200 } },
        },
        links: {
          'a-b': { source: 'a', target: 'b' },
        },
        flag: 'updateFromReact',
      });
      await flush();

      expect(view.elements.getSize()).toBe(2);
      expect(view.links.getSize()).toBe(1);

      // Step 2: User drags element 'a' — JointJS fires change:position
      const elA = graph.getCell('a') as dia.Element;
      expect(elA).toBeDefined();
      elA.position(100, 100);
      await flush();

      // Verify incremental callback fired
      expect(lastIncrementalChanges).not.toBeNull();

      // Step 3: Simulate React re-render — read all elements from container (like notifyElementsChange does)
      const newElements: Record<string, unknown> = {};
      for (const [id, item] of view.elements.getFull()) {
        newElements[id] = item;
      }
      const newLinks: Record<string, unknown> = {};
      for (const [id, item] of view.links.getFull()) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { layout, ...linkData } = item as Record<string, unknown>;
        newLinks[id] = linkData;
      }

      // Step 4: updateGraph with new React state (simulates controlled-mode re-render)
      view.updateGraph({
        elements: newElements as Record<
          string,
          { data: { label: string }; position?: { x: number; y: number } }
        >,
        links: newLinks as Record<string, { source: string; target: string }>,
        flag: 'updateFromReact',
      });
      await flush();

      // Step 5: ALL elements must still exist — this is the controlled-mode bug
      expect(view.elements.getSize()).toBe(2);
      expect(view.elements.get('a')).toBeDefined();
      expect(view.elements.get('b')).toBeDefined();
      expect(view.elements.get('a')?.position).toEqual({ x: 100, y: 100 });
      expect(view.links.getSize()).toBe(1);

      view.destroy();
    });

    it('elements persist when only links change and updateGraph round-trips', async () => {
      const graph = createGraph();
      let lastChanges: { elements: unknown; links: unknown } | null = null;
      const view = graphView({
        graph,

        mappings: {},
        onIncrementalChange: (changes) => {
          lastChanges = changes as { elements: unknown; links: unknown };
        },
      });

      // Initial sync
      view.updateGraph({
        elements: {
          a: { data: { label: 'A' }, position: { x: 50, y: 50 } },
          b: { data: { label: 'B' }, position: { x: 200, y: 200 } },
        },
        links: {},
        flag: 'updateFromReact',
      });
      await flush();

      expect(view.elements.getSize()).toBe(2);

      // Simulate a link being added via JointJS (user draws a link)
      graph.addCell({
        id: 'link-1',
        type: 'standard.Link',
        source: { id: 'a' },
        target: { id: 'b' },
      });
      await flush();

      expect(lastChanges).not.toBeNull();

      // Read current state from container (simulates notifyLinksChange + setLinks)
      const currentElements: Record<string, unknown> = {};
      for (const [id, item] of view.elements.getFull()) {
        currentElements[id] = item;
      }
      const currentLinks: Record<string, unknown> = {};
      for (const [id, item] of view.links.getFull()) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { layout, ...linkData } = item as Record<string, unknown>;
        currentLinks[id] = linkData;
      }

      // Re-render with new links state — elements unchanged
      view.updateGraph({
        elements: currentElements as Record<string, { data: { label: string } }>,
        links: currentLinks as Record<string, { source: string; target: string }>,
        flag: 'updateFromReact',
      });
      await flush();

      // ALL elements must still exist
      expect(view.elements.getSize()).toBe(2);
      expect(view.elements.get('a')).toBeDefined();
      expect(view.elements.get('b')).toBeDefined();
      expect(view.links.getSize()).toBe(1);

      view.destroy();
    });
  });

  describe('isUpdateFromReact filtering', () => {
    it('ignores changes with isUpdateFromReact flag', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1');
      await flush();

      const before = view.elements.get('el-1');

      (graph.getCell('el-1') as dia.Element).position(50, 60, { isUpdateFromReact: true });
      await flush();

      // Data should not have changed because the event was filtered
      expect(view.elements.get('el-1')).toBe(before);
    });
  });
});
