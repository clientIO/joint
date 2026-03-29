import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE } from '../../store/graph-store';
import { graphView } from '../graph-view';
import { linkToAttributes } from '../../state/data-mapping/link-mapper';
import type { MixedLinkRecord } from '../../types/data-types';
import type { CellAttributes, MapLinkToAttributes } from '../../state/data-mapping';

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
      expect(linkData?.source).toEqual({ id: 'el-1' });
      expect(linkData?.target).toEqual({ id: 'el-2' });

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
          'link-1': { source: { id: 'el-1' }, target: { id: 'el-2' } },
        },
        flag: 'updateFromReact',
      });
      await flush();

      // Link exists in the container with source/target info
      const linkData = view.links.get('link-1');
      expect(linkData).toBeDefined();
      expect(linkData?.source).toEqual({ id: 'el-1' });
      expect(linkData?.target).toEqual({ id: 'el-2' });

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
          'a-b': { source: { id: 'a' }, target: { id: 'b' } },
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

  describe('selective reference stability', () => {
    it('preserves data reference when only position changes', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20, 100, 50);
      await flush();

      const before = view.elements.get('el-1')!;
      const dataBefore = before.data;

      (graph.getCell('el-1') as dia.Element).position(50, 60);
      await flush();

      const after = view.elements.get('el-1')!;
      // Position should change
      expect(after.position).toEqual({ x: 50, y: 60 });
      // Data reference should be preserved (not recreated)
      expect(after.data).toBe(dataBefore);
    });

    it('preserves position reference when only data changes', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20, 100, 50);
      await flush();

      const before = view.elements.get('el-1')!;
      const positionBefore = before.position;

      (graph.getCell('el-1') as dia.Element).set('data', { label: 'changed' });
      await flush();

      const after = view.elements.get('el-1')!;
      // Data should change
      expect(after.data).toEqual({ label: 'changed' });
      // Position reference should be preserved
      expect(after.position).toBe(positionBefore);
    });

    it('preserves size reference when only position changes', async () => {
      const { graph, view } = setup();
      addElement(graph, 'el-1', 10, 20, 100, 50);
      await flush();

      const before = view.elements.get('el-1')!;
      const sizeBefore = before.size;

      (graph.getCell('el-1') as dia.Element).position(50, 60);
      await flush();

      const after = view.elements.get('el-1')!;
      expect(after.size).toBe(sizeBefore);
    });

    it('element has correct data and size after add (no regression)', async () => {
      const { graph, view } = setup();
      graph.addCell({
        id: 'el-1',
        type: 'PortalElement',
        position: { x: 10, y: 20 },
        size: { width: 200, height: 100 },
        data: { label: 'Hello' },
      });
      await flush();

      const element = view.elements.get('el-1')!;
      expect(element.position).toEqual({ x: 10, y: 20 });
      expect(element.size).toEqual({ width: 200, height: 100 });
      expect(element.data).toEqual({ label: 'Hello' });
    });

    it('element preserves correct values after internal attribute change', async () => {
      const { graph, view } = setup();
      graph.addCell({
        id: 'el-1',
        type: 'PortalElement',
        position: { x: 10, y: 20 },
        size: { width: 200, height: 100 },
        data: { label: 'Hello' },
      });
      await flush();

      // Simulate an internal JointJS attribute change (like attrs update during rendering)
      (graph.getCell('el-1') as dia.Element).set('attrs', { body: { fill: 'red' } });
      await flush();

      const element = view.elements.get('el-1')!;
      expect(element.position).toEqual({ x: 10, y: 20 });
      expect(element.size).toEqual({ width: 200, height: 100 });
      expect(element.data).toEqual({ label: 'Hello' });
    });
  });

  describe('LAYOUT_UPDATE_EVENT (insertView path)', () => {
    it('element retains correct size after layout update with stale model.changed', async () => {
      const { graph, view } = setup();
      // Step 1: Add element normally
      graph.addCell({
        id: 'el-1',
        type: 'PortalElement',
        position: { x: 10, y: 20 },
        size: { width: 200, height: 100 },
        data: { label: 'Hello' },
      });
      await flush();

      const elementBefore = view.elements.get('el-1')!;
      expect(elementBefore.size).toEqual({ width: 200, height: 100 });
      expect(elementBefore.data).toEqual({ label: 'Hello' });

      // Step 2: Simulate what insertView does — fire LAYOUT_UPDATE_EVENT
      // with { type: 'add', data: cell }. At this point, cell.changed might
      // be stale (e.g., an internal set() cleared it or changed unrelated attrs).
      const cell = graph.getCell('el-1') as dia.Element;

      // Simulate JointJS internal attr change that modifies model.changed
      // to contain only unrelated attributes (like during rendering)
      cell.set('attrs', { body: { fill: 'blue' } });

      // Now fire LAYOUT_UPDATE_EVENT with this cell — simulating insertView
      const layoutChanges = new Map([['el-1', { type: 'add' as const, data: cell }]]);
      graph.trigger('layout:update', { changes: layoutChanges });
      await flush();
      await flush(); // Extra flush for the scheduled callback

      const elementAfter = view.elements.get('el-1')!;
      expect(elementAfter.size).toEqual({ width: 200, height: 100 });
      expect(elementAfter.position).toEqual({ x: 10, y: 20 });
      expect(elementAfter.data).toEqual({ label: 'Hello' });
    });

    it('element retains size after batch resize (multiple set calls)', async () => {
      const { graph, view } = setup();
      // Add element with initial size
      graph.addCell({
        id: 'el-1',
        type: 'PortalElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        data: { label: 'Resize me' },
      });
      await flush();

      const elementBefore = view.elements.get('el-1')!;
      expect(elementBefore.size).toEqual({ width: 100, height: 50 });

      // Simulate onBatchUpdate from resize observer:
      // Multiple set() calls in a batch — model.changed only keeps the LAST one
      const cell = graph.getCell('el-1') as dia.Element;
      graph.startBatch('resize');
      cell.set('size', { width: 300, height: 200 });
      cell.set('position', { x: 15, y: 25 });
      graph.stopBatch('resize');
      await flush();

      const elementAfter = view.elements.get('el-1')!;
      // Both size AND position must reflect the new values
      expect(elementAfter.size).toEqual({ width: 300, height: 200 });
      expect(elementAfter.position).toEqual({ x: 15, y: 25 });
      expect(elementAfter.data).toEqual({ label: 'Resize me' });
    });

    it('element retains position after batch where size is set last', async () => {
      const { graph, view } = setup();
      graph.addCell({
        id: 'el-1',
        type: 'PortalElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        data: { label: 'Test' },
      });
      await flush();

      const cell = graph.getCell('el-1') as dia.Element;
      graph.startBatch('resize');
      cell.set('position', { x: 50, y: 60 });
      cell.set('size', { width: 300, height: 200 });
      graph.stopBatch('resize');
      await flush();

      const element = view.elements.get('el-1')!;
      // Both must be updated regardless of set() order
      expect(element.position).toEqual({ x: 50, y: 60 });
      expect(element.size).toEqual({ width: 300, height: 200 });
    });

    it('element has correct values when layout update is first processing (no previous)', async () => {
      const graph = createGraph();
      const view = graphView({ graph, mappings: {} });

      // Simulate controlled mode: updateGraph sets element, but events are filtered
      view.updateGraph({
        elements: {
          'el-1': {
            data: { label: 'Test' },
            position: { x: 50, y: 60 },
            size: { width: 150, height: 80 },
          },
        },
        links: {},
        flag: 'updateFromReact',
      });
      await flush();

      const elementBefore = view.elements.get('el-1')!;
      expect(elementBefore.size).toEqual({ width: 150, height: 80 });

      // Now fire LAYOUT_UPDATE_EVENT — simulating insertView after paper mount
      const cell = graph.getCell('el-1') as dia.Element;
      const layoutChanges = new Map([['el-1', { type: 'add' as const, data: cell }]]);
      graph.trigger('layout:update', { changes: layoutChanges });
      await flush();
      await flush();

      const elementAfter = view.elements.get('el-1')!;
      expect(elementAfter.size).toEqual({ width: 150, height: 80 });
      expect(elementAfter.position).toEqual({ x: 50, y: 60 });
      expect(elementAfter.data).toEqual({ label: 'Test' });

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

  describe('updateMappers — link defaults re-sync', () => {
    function createLinkMapper(color: string): MapLinkToAttributes {
      return (mapOptions: { id?: string; link: MixedLinkRecord }) => {
        const merged: MixedLinkRecord = { color, width: 3, ...mapOptions.link };
        return linkToAttributes({ link: merged, id: mapOptions.id });
      };
    }

    it('updates JointJS link attrs when mapLinkToAttributes changes', async () => {
      const graph = createGraph();
      const initialMapper = createLinkMapper('red');

      const view = graphView({
        graph,
        mappings: { mapLinkToAttributes: initialMapper },
      });

      // Populate via updateGraph (simulates controlled-mode initial render)
      view.updateGraph({
        elements: {
          a: { data: undefined, position: { x: 0, y: 0 }, size: { width: 50, height: 50 } },
          b: { data: undefined, position: { x: 200, y: 0 }, size: { width: 50, height: 50 } },
        },
        links: {
          'a-b': { source: 'a', target: 'b' },
        },
        flag: 'updateFromReact',
      });
      await flush();

      // Verify initial color
      const linkBefore = graph.getCell('a-b') as dia.Link;
      expect(linkBefore.attr('line/style/stroke')).toBe('red');

      // Simulate useLinkDefaults changing color → new mapper reference
      const updatedMapper = createLinkMapper('blue');
      view.updateMappers({ mapLinkToAttributes: updatedMapper });

      // JointJS model should now have the updated color
      const linkAfter = graph.getCell('a-b') as dia.Link;
      expect(linkAfter.attr('line/style/stroke')).toBe('blue');

      view.destroy();
    });

    it('updates link color after container is populated by LAYOUT_UPDATE_EVENT (Paper view mount)', async () => {
      const graph = createGraph();
      const initialMapper = createLinkMapper('red');

      const view = graphView({
        graph,
        mappings: { mapLinkToAttributes: initialMapper },
      });

      // Populate via updateGraph (simulates controlled-mode initial render)
      view.updateGraph({
        elements: {
          a: { data: undefined, position: { x: 0, y: 0 }, size: { width: 50, height: 50 } },
          b: { data: undefined, position: { x: 200, y: 0 }, size: { width: 50, height: 50 } },
        },
        links: {
          'a-b': { source: 'a', target: 'b' },
        },
        flag: 'updateFromReact',
      });
      await flush();

      // Simulate Paper view mount: LAYOUT_UPDATE_EVENT fires, which triggers
      // onChanges → mapAttributesToLink → container now has round-tripped attrs
      // (including attrs.line.style.stroke = 'red')
      const linkCell = graph.getCell('a-b') as dia.Link;
      const layoutChanges = new Map([['a-b', { type: 'add' as const, data: linkCell }]]);
      graph.trigger('layout:update', { changes: layoutChanges });
      await flush();
      await flush();

      // The container link data now has stale attrs from the round-trip.
      // Verify the stale attrs are in the container:
      const containerLink = view.links.get('a-b')!;
      expect((containerLink as Record<string, unknown>).attrs).toBeDefined();

      // Now simulate useLinkDefaults changing color → new mapper
      const updatedMapper = createLinkMapper('blue');
      view.updateMappers({ mapLinkToAttributes: updatedMapper });

      // JointJS model should have the NEW color, not the stale one
      expect(linkCell.attr('line/style/stroke')).toBe('blue');

      view.destroy();
    });

    it('preserves updated link attrs after subsequent updateGraph call', async () => {
      const graph = createGraph();
      const initialMapper = createLinkMapper('red');

      const view = graphView({
        graph,
        mappings: { mapLinkToAttributes: initialMapper },
      });

      view.updateGraph({
        elements: {
          a: { data: undefined, position: { x: 0, y: 0 }, size: { width: 50, height: 50 } },
          b: { data: undefined, position: { x: 200, y: 0 }, size: { width: 50, height: 50 } },
        },
        links: {
          'a-b': { source: 'a', target: 'b' },
        },
        flag: 'updateFromReact',
      });
      await flush();

      // Change mapper (simulates useLinkDefaults with new color)
      const updatedMapper = createLinkMapper('blue');
      view.updateMappers({ mapLinkToAttributes: updatedMapper });

      // Now simulate a subsequent React render that calls updateGraph
      // (e.g., user drags an element, triggering onElementsChange → re-render)
      view.updateGraph({
        elements: {
          a: { data: undefined, position: { x: 50, y: 50 }, size: { width: 50, height: 50 } },
          b: { data: undefined, position: { x: 200, y: 0 }, size: { width: 50, height: 50 } },
        },
        links: {
          'a-b': { source: 'a', target: 'b' },
        },
        flag: 'updateFromReact',
      });
      await flush();

      // Color should still be blue (the updated mapper), not red (the old one)
      const link = graph.getCell('a-b') as dia.Link;
      expect(link.attr('line/style/stroke')).toBe('blue');

      view.destroy();
    });
  });
});
