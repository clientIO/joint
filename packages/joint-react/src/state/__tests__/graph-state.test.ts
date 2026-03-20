/* eslint-disable @typescript-eslint/no-invalid-void-type */
import { dia } from '@joint/core';
import type { PaperStore } from '../../store';
import { DEFAULT_CELL_NAMESPACE } from '../../store/graph-store';
import { graphState } from '../graph-state';
import type { IncrementalStateChanges } from '../incremental.types';
import type { FlatElementData } from '../../types/element-types';
import type { FlatLinkData } from '../../types/link-types';

function createListener() {
  const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
  const onIncrementalChange = jest.fn<
    void,
    [IncrementalStateChanges<FlatElementData, FlatLinkData>]
  >();
  const listener = graphState({
    graph,
    papers: new Map<string, PaperStore>(),
    onIncrementalChange,
    onReset: jest.fn(),
    mappers: {},
  });
  return { graph, listener, onIncrementalChange };
}

function addElement(graph: dia.Graph, id: string, x = 10, y = 20, width = 100, height = 50) {
  graph.addCell({ id, type: 'PortalElement', position: { x, y }, size: { width, height } });
}

describe('graphState', () => {
  it('emits added, changed, and removed records for element changes', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
    const onIncrementalChange = jest.fn<
      void,
      [IncrementalStateChanges<FlatElementData, FlatLinkData>]
    >();

    const listener = graphState({
      graph,
      papers: new Map<string, PaperStore>(),
      onIncrementalChange,
      onReset: jest.fn(),
      mappers: {},
    });

    graph.addCell({
      id: 'element-1',
      type: 'PortalElement',
      position: { x: 10, y: 20 },
      size: { width: 100, height: 100 },
    });

    expect(onIncrementalChange).toHaveBeenLastCalledWith({
      elements: {
        added: {
          'element-1': expect.objectContaining({
            x: 10,
            y: 20,
            width: 100,
            height: 100,
          }),
        },
      },
      links: {},
    });

    onIncrementalChange.mockClear();

    const element = graph.getCell('element-1');
    if (!element?.isElement()) {
      throw new Error('Expected graph element to exist');
    }

    element.position(30, 40);

    expect(onIncrementalChange).toHaveBeenLastCalledWith({
      elements: {
        changed: {
          'element-1': expect.objectContaining({
            x: 30,
            y: 40,
          }),
        },
      },
      links: {},
    });

    onIncrementalChange.mockClear();
    graph.removeCells([element]);

    expect(onIncrementalChange).toHaveBeenLastCalledWith({
      elements: {
        removed: {
          'element-1': expect.objectContaining({
            x: 30,
            y: 40,
          }),
        },
      },
      links: {},
    });

    listener.destroy();
  });

  it('emits reset records with the replacement snapshot', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
    const onIncrementalChange = jest.fn<
      void,
      [IncrementalStateChanges<FlatElementData, FlatLinkData>]
    >();

    const listener = graphState({
      graph,
      papers: new Map<string, PaperStore>(),
      onIncrementalChange,
      onReset: jest.fn(),
      mappers: {},
    });

    graph.addCell({
      id: 'old-element',
      type: 'PortalElement',
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
    });
    onIncrementalChange.mockClear();

    graph.resetCells([
      {
        id: 'reset-element',
        type: 'PortalElement',
        position: { x: 50, y: 60 },
        size: { width: 120, height: 80 },
      },
    ]);

    expect(onIncrementalChange).toHaveBeenLastCalledWith({
      elements: {
        reset: {
          'reset-element': expect.objectContaining({
            x: 50,
            y: 60,
            width: 120,
            height: 80,
          }),
        },
      },
      links: {
        reset: {},
      },
    });

    listener.destroy();
  });

  it('applies react-originated updates once without emitting graph-to-react changes', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
    const onIncrementalChange = jest.fn<
      void,
      [IncrementalStateChanges<FlatElementData, FlatLinkData>]
    >();
    const syncCellsSpy = jest.spyOn(graph, 'syncCells');

    const listener = graphState({
      graph,
      papers: new Map<string, PaperStore>(),
      onIncrementalChange,
      onReset: jest.fn(),
      mappers: {},
    });

    listener.updateGraph({
      elements: {
        'portal-element': { x: 15, y: 25, width: 100, height: 60, type: 'PortalElement' },
      },
      links: {},
      flag: 'updateFromReact',
    });

    expect(syncCellsSpy).toHaveBeenCalledTimes(1);
    expect(syncCellsSpy).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ isUpdateFromReact: true })
    );
    expect(graph.getCell('portal-element')).toBeDefined();
    expect(onIncrementalChange).toHaveBeenCalledTimes(0);

    listener.destroy();
  });

  it('defers dataState until batch:stop but keeps layoutState realtime', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
    const onIncrementalChange = jest.fn<
      void,
      [IncrementalStateChanges<FlatElementData, FlatLinkData>]
    >();

    const listener = graphState({
      graph,
      papers: new Map<string, PaperStore>(),
      onIncrementalChange,
      onReset: jest.fn(),
      enableBatchUpdates: true,
      mappers: {},
    });

    // Add initial element outside batch
    graph.addCell({
      id: 'el-1',
      type: 'PortalElement',
      position: { x: 0, y: 0 },
      size: { width: 50, height: 50 },
    });
    onIncrementalChange.mockClear();

    const publicSnapshotBefore = listener.dataState.getSnapshot();

    // Start a batch and make multiple changes
    graph.startBatch('test');

    const element = graph.getCell('el-1')!;
    (element as dia.Element).position(10, 20);
    (element as dia.Element).resize(200, 200);

    // During batch: dataState should NOT have been updated
    expect(listener.dataState.getSnapshot()).toBe(publicSnapshotBefore);
    expect(onIncrementalChange).not.toHaveBeenCalled();

    // But layoutState IS updated in realtime
    const { positions, sizes } = listener.layoutState.getSnapshot().elements;
    expect(positions['el-1']?.x).toBe(10);
    expect(positions['el-1']?.y).toBe(20);
    expect(sizes['el-1']?.width).toBe(200);
    expect(sizes['el-1']?.height).toBe(200);

    graph.stopBatch('test');

    // After batch:stop: dataState updates
    expect(listener.dataState.getSnapshot()).not.toBe(publicSnapshotBefore);
    expect(onIncrementalChange).toHaveBeenCalledTimes(1);

    listener.destroy();
  });

  it('emits graph-originated changes once and ignores the immediate react echo', () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
    const onIncrementalChange = jest.fn<
      void,
      [IncrementalStateChanges<FlatElementData, FlatLinkData>]
    >();
    const syncCellsSpy = jest.spyOn(graph, 'syncCells');

    const listener = graphState({
      graph,
      papers: new Map<string, PaperStore>(),
      onIncrementalChange,
      onReset: jest.fn(),
      mappers: {},
    });

    graph.addCell({
      id: 'graph-element',
      type: 'PortalElement',
      position: { x: 10, y: 20 },
      size: { width: 100, height: 100 },
    });

    expect(onIncrementalChange).toHaveBeenCalledTimes(1);
    expect(syncCellsSpy).toHaveBeenCalledTimes(0);

    const publicSnapshot = listener.dataState.getSnapshot();
    listener.updateGraph({
      elements: publicSnapshot.elements,
      links: publicSnapshot.links,
      flag: 'updateFromReact',
    });

    expect(syncCellsSpy).toHaveBeenCalledTimes(0);
    expect(onIncrementalChange).toHaveBeenCalledTimes(1);

    listener.updateGraph({
      elements: {
        ...publicSnapshot.elements,
        'graph-element': {
          ...publicSnapshot.elements['graph-element'],
          x: 45,
          y: 55,
        },
      },
      links: publicSnapshot.links,
      flag: 'updateFromReact',
    });

    expect(syncCellsSpy).toHaveBeenCalledTimes(1);
    expect(onIncrementalChange).toHaveBeenCalledTimes(1);
    expect(graph.getCell('graph-element')?.get('position')).toEqual({ x: 45, y: 55 });

    listener.destroy();
  });

  describe('reference stability', () => {
    it('preserves dataState reference when position is set to same value', () => {
      const { graph, listener } = createListener();
      addElement(graph, 'el-1');

      const before = listener.dataState.getSnapshot();
      (graph.getCell('el-1') as dia.Element).position(10, 20);

      expect(listener.dataState.getSnapshot()).toBe(before);
      listener.destroy();
    });

    it('preserves layoutState reference when position is set to same value', () => {
      const { graph, listener } = createListener();
      addElement(graph, 'el-1');

      const before = listener.layoutState.getSnapshot();
      (graph.getCell('el-1') as dia.Element).position(10, 20);

      expect(listener.layoutState.getSnapshot()).toBe(before);
      listener.destroy();
    });

    it('preserves dataState reference when size is set to same value', () => {
      const { graph, listener } = createListener();
      addElement(graph, 'el-1');

      const before = listener.dataState.getSnapshot();
      (graph.getCell('el-1') as dia.Element).resize(100, 50);

      expect(listener.dataState.getSnapshot()).toBe(before);
      listener.destroy();
    });

    it('preserves layoutState reference when size is set to same value', () => {
      const { graph, listener } = createListener();
      addElement(graph, 'el-1');

      const before = listener.layoutState.getSnapshot();
      (graph.getCell('el-1') as dia.Element).resize(100, 50);

      expect(listener.layoutState.getSnapshot()).toBe(before);
      listener.destroy();
    });

    it('preserves references with multiple elements when only one changes', () => {
      const { graph, listener } = createListener();
      addElement(graph, 'el-1', 0, 0);
      addElement(graph, 'el-2', 50, 50);

      const layoutBefore = listener.layoutState.getSnapshot();
      const sizesBefore = layoutBefore.elements.sizes;

      // Move el-1 — positions should change, sizes should stay
      (graph.getCell('el-1') as dia.Element).position(99, 99);

      const layoutAfter = listener.layoutState.getSnapshot();
      expect(layoutAfter).not.toBe(layoutBefore);
      expect(layoutAfter.elements.sizes).toBe(sizesBefore);

      listener.destroy();
    });

    it('does not notify onIncrementalChange when setting same value', () => {
      const { graph, listener, onIncrementalChange } = createListener();
      addElement(graph, 'el-1');
      onIncrementalChange.mockClear();

      (graph.getCell('el-1') as dia.Element).position(10, 20);

      expect(onIncrementalChange).not.toHaveBeenCalled();
      listener.destroy();
    });

    it('creates new dataState reference on reset', () => {
      const { graph, listener } = createListener();
      addElement(graph, 'el-1');

      const before = listener.dataState.getSnapshot();
      graph.resetCells([
        { id: 'el-1', type: 'PortalElement', position: { x: 10, y: 20 }, size: { width: 100, height: 50 } },
      ]);

      expect(listener.dataState.getSnapshot()).not.toBe(before);
      listener.destroy();
    });

    it('creates new layoutState reference on reset', () => {
      const { graph, listener } = createListener();
      addElement(graph, 'el-1');

      const before = listener.layoutState.getSnapshot();
      graph.resetCells([
        { id: 'el-1', type: 'PortalElement', position: { x: 10, y: 20 }, size: { width: 100, height: 50 } },
      ]);

      expect(listener.layoutState.getSnapshot()).not.toBe(before);
      listener.destroy();
    });
  });

  describe('link operations', () => {
    it('tracks link add and change in dataState', () => {
      const { graph, listener, onIncrementalChange } = createListener();
      addElement(graph, 'el-1', 0, 0);
      addElement(graph, 'el-2', 200, 200);
      onIncrementalChange.mockClear();

      graph.addCell({
        id: 'link-1',
        type: 'standard.Link',
        source: { id: 'el-1' },
        target: { id: 'el-2' },
      });

      expect(onIncrementalChange).toHaveBeenCalledWith(
        expect.objectContaining({
          links: { added: { 'link-1': expect.any(Object) } },
        })
      );

      const dataBefore = listener.dataState.getSnapshot();
      expect(dataBefore.links['link-1']).toBeDefined();

      onIncrementalChange.mockClear();

      // Change the link target
      const link = graph.getCell('link-1') as dia.Link;
      link.set('target', { x: 300, y: 300 });

      expect(onIncrementalChange).toHaveBeenCalledWith(
        expect.objectContaining({
          links: { changed: { 'link-1': expect.any(Object) } },
        })
      );

      listener.destroy();
    });

    it('tracks link removal in dataState', () => {
      const { graph, listener, onIncrementalChange } = createListener();
      addElement(graph, 'el-1', 0, 0);
      addElement(graph, 'el-2', 200, 200);
      graph.addCell({
        id: 'link-1',
        type: 'standard.Link',
        source: { id: 'el-1' },
        target: { id: 'el-2' },
      });
      onIncrementalChange.mockClear();

      graph.removeCells([graph.getCell('link-1')!]);

      expect(onIncrementalChange).toHaveBeenCalledWith(
        expect.objectContaining({
          links: { removed: { 'link-1': expect.any(Object) } },
        })
      );
      expect(listener.dataState.getSnapshot().links['link-1']).toBeUndefined();

      listener.destroy();
    });
  });

  describe('onElementsChange and onLinksChange callbacks', () => {
    it('calls onElementsChange when element is added', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      const onElementsChange = jest.fn();
      const onLinksChange = jest.fn();

      const listener = graphState({
        graph,
        papers: new Map<string, PaperStore>(),
        onElementsChange,
        onLinksChange,
        onReset: jest.fn(),
        mappers: {},
      });

      addElement(graph, 'el-1');

      expect(onElementsChange).toHaveBeenCalledWith(
        expect.objectContaining({ 'el-1': expect.any(Object) })
      );
      expect(onLinksChange).toHaveBeenCalledWith({});

      listener.destroy();
    });

    it('calls onLinksChange when link is added', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      const onElementsChange = jest.fn();
      const onLinksChange = jest.fn();

      const listener = graphState({
        graph,
        papers: new Map<string, PaperStore>(),
        onElementsChange,
        onLinksChange,
        onReset: jest.fn(),
        mappers: {},
      });

      addElement(graph, 'el-1', 0, 0);
      addElement(graph, 'el-2', 200, 200);
      onLinksChange.mockClear();

      graph.addCell({
        id: 'link-1',
        type: 'standard.Link',
        source: { id: 'el-1' },
        target: { id: 'el-2' },
      });

      expect(onLinksChange).toHaveBeenCalledWith(
        expect.objectContaining({ 'link-1': expect.any(Object) })
      );

      listener.destroy();
    });
  });

  describe('angle tracking', () => {
    it('tracks element angle changes in layoutState', () => {
      const { graph, listener } = createListener();
      addElement(graph, 'el-1');

      const anglesBefore = listener.layoutState.getSnapshot().elements.angles;
      expect(anglesBefore['el-1']).toBe(0);

      (graph.getCell('el-1') as dia.Element).rotate(45);

      const anglesAfter = listener.layoutState.getSnapshot().elements.angles;
      expect(anglesAfter['el-1']).toBe(45);
      // Angles ref must be new, sizes/positions preserved
      expect(anglesAfter).not.toBe(anglesBefore);
      expect(listener.layoutState.getSnapshot().elements.sizes).toBe(
        listener.layoutState.getSnapshot().elements.sizes
      );

      listener.destroy();
    });

    it('preserves angles reference when angle is set to same value', () => {
      const { graph, listener } = createListener();
      addElement(graph, 'el-1');

      const layoutBefore = listener.layoutState.getSnapshot();
      // Angle is already 0, setting to 0 again
      (graph.getCell('el-1') as dia.Element).set('angle', 0);

      expect(listener.layoutState.getSnapshot()).toBe(layoutBefore);

      listener.destroy();
    });
  });

  describe('reset with links', () => {
    it('emits reset with both elements and links', () => {
      const { graph, listener, onIncrementalChange } = createListener();
      addElement(graph, 'el-1', 0, 0);
      addElement(graph, 'el-2', 200, 200);
      graph.addCell({
        id: 'link-1',
        type: 'standard.Link',
        source: { id: 'el-1' },
        target: { id: 'el-2' },
      });
      onIncrementalChange.mockClear();

      graph.resetCells([
        { id: 'new-el', type: 'PortalElement', position: { x: 0, y: 0 }, size: { width: 50, height: 50 } },
        { id: 'new-link', type: 'standard.Link', source: { id: 'new-el' }, target: { x: 100, y: 100 } },
      ]);

      expect(onIncrementalChange).toHaveBeenCalledWith({
        elements: { reset: expect.objectContaining({ 'new-el': expect.any(Object) }) },
        links: { reset: expect.objectContaining({ 'new-link': expect.any(Object) }) },
      });

      listener.destroy();
    });
  });

  describe('layoutState count', () => {
    it('increments count on add', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      const listener = graphState({
        graph,
        papers: new Map<string, PaperStore>(),
        onReset: jest.fn(),
        mappers: {},
      });

      const layout = () => listener.layoutState.getSnapshot().elements;

      expect(layout().count).toBe(0);

      graph.addCell({
        id: 'el-1',
        type: 'PortalElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
      });

      expect(layout().count).toBe(1);

      graph.addCell({
        id: 'el-2',
        type: 'PortalElement',
        position: { x: 10, y: 10 },
        size: { width: 200, height: 200 },
      });

      expect(layout().count).toBe(2);

      listener.destroy();
    });

    it('counts elements regardless of size', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      const listener = graphState({
        graph,
        papers: new Map<string, PaperStore>(),
        onReset: jest.fn(),
        mappers: {},
      });

      const layout = () => listener.layoutState.getSnapshot().elements;

      graph.addCell({
        id: 'el-small',
        type: 'PortalElement',
        position: { x: 0, y: 0 },
        size: { width: 1, height: 1 },
      });

      expect(layout().count).toBe(1);

      graph.addCell({
        id: 'el-large',
        type: 'PortalElement',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
      });

      expect(layout().count).toBe(2);

      listener.destroy();
    });

    it('decrements count on remove', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      const listener = graphState({
        graph,
        papers: new Map<string, PaperStore>(),
        onReset: jest.fn(),
        mappers: {},
      });

      const layout = () => listener.layoutState.getSnapshot().elements;

      graph.addCell({
        id: 'el-1',
        type: 'PortalElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
      });
      graph.addCell({
        id: 'el-2',
        type: 'PortalElement',
        position: { x: 10, y: 10 },
        size: { width: 80, height: 60 },
      });

      expect(layout().count).toBe(2);

      graph.removeCells([graph.getCell('el-1')!]);

      expect(layout().count).toBe(1);

      graph.removeCells([graph.getCell('el-2')!]);

      expect(layout().count).toBe(0);

      listener.destroy();
    });

    it('does not count links in element count', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      const listener = graphState({
        graph,
        papers: new Map<string, PaperStore>(),
        onReset: jest.fn(),
        mappers: {},
      });

      const layout = () => listener.layoutState.getSnapshot().elements;

      graph.addCell({
        id: 'el-1',
        type: 'PortalElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
      });
      graph.addCell({
        id: 'link-1',
        type: 'standard.Link',
        source: { id: 'el-1' },
        target: { x: 100, y: 100 },
      });

      expect(layout().count).toBe(1);

      listener.destroy();
    });

    it('position change does not create new sizes reference', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      const listener = graphState({
        graph,
        papers: new Map<string, PaperStore>(),
        onReset: jest.fn(),
        mappers: {},
      });

      graph.addCell({
        id: 'el-1',
        type: 'PortalElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
      });

      const sizesBefore = listener.layoutState.getSnapshot().elements.sizes;
      const anglesBefore = listener.layoutState.getSnapshot().elements.angles;

      // Change position only
      const element = graph.getCell('el-1') as dia.Element;
      element.position(50, 60);

      const sizesAfter = listener.layoutState.getSnapshot().elements.sizes;
      const anglesAfter = listener.layoutState.getSnapshot().elements.angles;

      // Sizes and angles references must be preserved (unchanged)
      expect(sizesAfter).toBe(sizesBefore);
      expect(anglesAfter).toBe(anglesBefore);

      // Positions reference must be new
      const positionsAfter = listener.layoutState.getSnapshot().elements.positions;
      expect(positionsAfter['el-1']?.x).toBe(50);
      expect(positionsAfter['el-1']?.y).toBe(60);

      listener.destroy();
    });

    it('size change does not create new positions reference', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      const listener = graphState({
        graph,
        papers: new Map<string, PaperStore>(),
        onReset: jest.fn(),
        mappers: {},
      });

      graph.addCell({
        id: 'el-1',
        type: 'PortalElement',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      const positionsBefore = listener.layoutState.getSnapshot().elements.positions;
      const anglesBefore = listener.layoutState.getSnapshot().elements.angles;

      // Change size only
      const element = graph.getCell('el-1') as dia.Element;
      element.resize(200, 200);

      const positionsAfter = listener.layoutState.getSnapshot().elements.positions;
      const anglesAfter = listener.layoutState.getSnapshot().elements.angles;

      // Positions and angles references must be preserved
      expect(positionsAfter).toBe(positionsBefore);
      expect(anglesAfter).toBe(anglesBefore);

      // Sizes reference must be new
      const sizesAfter = listener.layoutState.getSnapshot().elements.sizes;
      expect(sizesAfter['el-1']?.width).toBe(200);
      expect(sizesAfter['el-1']?.height).toBe(200);

      listener.destroy();
    });
  });

  describe('autoSizedElementIds', () => {
    it('should track elements with undefined width as auto-sized via updateGraph', () => {
      const { listener } = createListener();

      listener.updateGraph({
        elements: {
          'el-1': { x: 0, y: 0 },
          'el-2': { x: 10, y: 10, width: 100, height: 50 },
        },
        links: {},
        flag: 'updateFromReact',
      });

      const { autoSizedElementIds } = listener.layoutState.getSnapshot().elements;
      expect(autoSizedElementIds.has('el-1')).toBe(true);
      expect(autoSizedElementIds.has('el-2')).toBe(false);

      listener.destroy();
    });

    it('should track elements with undefined height as auto-sized via updateGraph', () => {
      const { listener } = createListener();

      listener.updateGraph({
        elements: {
          'el-1': { x: 0, y: 0, width: 100 },
        },
        links: {},
        flag: 'updateFromReact',
      });

      const { autoSizedElementIds } = listener.layoutState.getSnapshot().elements;
      expect(autoSizedElementIds.has('el-1')).toBe(true);

      listener.destroy();
    });

    it('should remove element from auto-sized when user provides explicit size', () => {
      const { listener } = createListener();

      // First: no size → auto-sized
      listener.updateGraph({
        elements: { 'el-1': { x: 0, y: 0 } },
        links: {},
        flag: 'updateFromReact',
      });
      expect(listener.layoutState.getSnapshot().elements.autoSizedElementIds.has('el-1')).toBe(
        true
      );

      // Second: explicit size → not auto-sized
      listener.updateGraph({
        elements: { 'el-1': { x: 0, y: 0, width: 200, height: 100 } },
        links: {},
        flag: 'updateFromReact',
      });
      expect(listener.layoutState.getSnapshot().elements.autoSizedElementIds.has('el-1')).toBe(
        false
      );

      listener.destroy();
    });

    it('should update auto-sized status via updateAutoSizedElement', () => {
      const { listener } = createListener();

      // Initially not in the set
      expect(listener.layoutState.getSnapshot().elements.autoSizedElementIds.has('el-1')).toBe(
        false
      );

      // Set as auto-sized (no width)
      listener.updateAutoSizedElement('el-1', { x: 0, y: 0 });
      expect(listener.layoutState.getSnapshot().elements.autoSizedElementIds.has('el-1')).toBe(
        true
      );

      // Set back to explicit size
      listener.updateAutoSizedElement('el-1', { x: 0, y: 0, width: 100, height: 50 });
      expect(listener.layoutState.getSnapshot().elements.autoSizedElementIds.has('el-1')).toBe(
        false
      );

      listener.destroy();
    });

    it('should preserve reference when updateAutoSizedElement has no change', () => {
      const { listener } = createListener();

      const before = listener.layoutState.getSnapshot();

      // Element is not auto-sized, setting explicit size should be a no-op
      listener.updateAutoSizedElement('el-1', { x: 0, y: 0, width: 100, height: 50 });

      const after = listener.layoutState.getSnapshot();
      expect(after).toBe(before);

      listener.destroy();
    });

    it('should handle mixed auto-sized and explicit elements', () => {
      const { listener } = createListener();

      listener.updateGraph({
        elements: {
          'el-1': { x: 0, y: 0 },
          'el-2': { x: 10, y: 10, width: 100, height: 50 },
          'el-3': { x: 20, y: 20, width: 200 },
        },
        links: {},
        flag: 'updateFromReact',
      });

      const { autoSizedElementIds } = listener.layoutState.getSnapshot().elements;
      expect(autoSizedElementIds.has('el-1')).toBe(true);
      expect(autoSizedElementIds.has('el-2')).toBe(false);
      expect(autoSizedElementIds.has('el-3')).toBe(true);
      expect(autoSizedElementIds.size).toBe(2);

      listener.destroy();
    });

    it('should transition from defined → undefined (user removes size in controlled mode)', () => {
      const { listener } = createListener();

      // User starts with explicit size
      listener.updateGraph({
        elements: { 'el-1': { x: 0, y: 0, width: 100, height: 50 } },
        links: {},
        flag: 'updateFromReact',
      });
      expect(listener.layoutState.getSnapshot().elements.autoSizedElementIds.has('el-1')).toBe(
        false
      );

      // User sets width to undefined via controlled state update
      listener.updateGraph({
        elements: { 'el-1': { x: 0, y: 0, height: 50 } },
        links: {},
        flag: 'updateFromReact',
      });
      expect(listener.layoutState.getSnapshot().elements.autoSizedElementIds.has('el-1')).toBe(
        true
      );

      listener.destroy();
    });

    it('should transition from undefined → defined (user sets size in controlled mode)', () => {
      const { listener } = createListener();

      // User starts without size
      listener.updateGraph({
        elements: { 'el-1': { x: 0, y: 0 } },
        links: {},
        flag: 'updateFromReact',
      });
      expect(listener.layoutState.getSnapshot().elements.autoSizedElementIds.has('el-1')).toBe(
        true
      );

      // User provides explicit size
      listener.updateGraph({
        elements: { 'el-1': { x: 0, y: 0, width: 200, height: 100 } },
        links: {},
        flag: 'updateFromReact',
      });
      expect(listener.layoutState.getSnapshot().elements.autoSizedElementIds.has('el-1')).toBe(
        false
      );

      listener.destroy();
    });

    it('should handle rapid toggling between auto-sized and explicit', () => {
      const { listener } = createListener();
      const getAutoSized = () =>
        listener.layoutState.getSnapshot().elements.autoSizedElementIds;

      // Start auto-sized
      listener.updateGraph({
        elements: { 'el-1': { x: 0, y: 0 } },
        links: {},
        flag: 'updateFromReact',
      });
      expect(getAutoSized().has('el-1')).toBe(true);

      // Switch to explicit
      listener.updateGraph({
        elements: { 'el-1': { x: 0, y: 0, width: 100, height: 50 } },
        links: {},
        flag: 'updateFromReact',
      });
      expect(getAutoSized().has('el-1')).toBe(false);

      // Switch back to auto-sized
      listener.updateGraph({
        elements: { 'el-1': { x: 0, y: 0 } },
        links: {},
        flag: 'updateFromReact',
      });
      expect(getAutoSized().has('el-1')).toBe(true);

      // And back to explicit again
      listener.updateGraph({
        elements: { 'el-1': { x: 0, y: 0, width: 300, height: 200 } },
        links: {},
        flag: 'updateFromReact',
      });
      expect(getAutoSized().has('el-1')).toBe(false);

      listener.destroy();
    });

    it('should handle updateAutoSizedElement toggling from defined → undefined → defined', () => {
      const { listener } = createListener();
      const getAutoSized = () =>
        listener.layoutState.getSnapshot().elements.autoSizedElementIds;

      // Start explicit
      listener.updateAutoSizedElement('el-1', { width: 100, height: 50 });
      expect(getAutoSized().has('el-1')).toBe(false);

      // setElement sets width to undefined
      listener.updateAutoSizedElement('el-1', { height: 50 });
      expect(getAutoSized().has('el-1')).toBe(true);

      // setElement restores width
      listener.updateAutoSizedElement('el-1', { width: 200, height: 50 });
      expect(getAutoSized().has('el-1')).toBe(false);

      listener.destroy();
    });

    it('should track multiple elements independently during state changes', () => {
      const { listener } = createListener();
      const getAutoSized = () =>
        listener.layoutState.getSnapshot().elements.autoSizedElementIds;

      // Both start auto-sized
      listener.updateGraph({
        elements: {
          'el-1': { x: 0, y: 0 },
          'el-2': { x: 10, y: 10 },
        },
        links: {},
        flag: 'updateFromReact',
      });
      expect(getAutoSized().has('el-1')).toBe(true);
      expect(getAutoSized().has('el-2')).toBe(true);
      expect(getAutoSized().size).toBe(2);

      // User sets size for el-1 only
      listener.updateGraph({
        elements: {
          'el-1': { x: 0, y: 0, width: 100, height: 50 },
          'el-2': { x: 10, y: 10 },
        },
        links: {},
        flag: 'updateFromReact',
      });
      expect(getAutoSized().has('el-1')).toBe(false);
      expect(getAutoSized().has('el-2')).toBe(true);
      expect(getAutoSized().size).toBe(1);

      // User removes size for el-1, sets size for el-2
      listener.updateGraph({
        elements: {
          'el-1': { x: 0, y: 0 },
          'el-2': { x: 10, y: 10, width: 200, height: 100 },
        },
        links: {},
        flag: 'updateFromReact',
      });
      expect(getAutoSized().has('el-1')).toBe(true);
      expect(getAutoSized().has('el-2')).toBe(false);
      expect(getAutoSized().size).toBe(1);

      listener.destroy();
    });

    it('should handle element removal from the graph', () => {
      const { listener } = createListener();
      const getAutoSized = () =>
        listener.layoutState.getSnapshot().elements.autoSizedElementIds;

      // Two auto-sized elements
      listener.updateGraph({
        elements: {
          'el-1': { x: 0, y: 0 },
          'el-2': { x: 10, y: 10 },
        },
        links: {},
        flag: 'updateFromReact',
      });
      expect(getAutoSized().size).toBe(2);

      // User removes el-2 from controlled state
      listener.updateGraph({
        elements: {
          'el-1': { x: 0, y: 0 },
        },
        links: {},
        flag: 'updateFromReact',
      });
      expect(getAutoSized().has('el-1')).toBe(true);
      expect(getAutoSized().has('el-2')).toBe(false);
      expect(getAutoSized().size).toBe(1);

      listener.destroy();
    });

    it('should handle adding new auto-sized element to existing explicit elements', () => {
      const { listener } = createListener();
      const getAutoSized = () =>
        listener.layoutState.getSnapshot().elements.autoSizedElementIds;

      // Start with explicit element
      listener.updateGraph({
        elements: { 'el-1': { x: 0, y: 0, width: 100, height: 50 } },
        links: {},
        flag: 'updateFromReact',
      });
      expect(getAutoSized().size).toBe(0);

      // Add new auto-sized element
      listener.updateGraph({
        elements: {
          'el-1': { x: 0, y: 0, width: 100, height: 50 },
          'el-2': { x: 10, y: 10 },
        },
        links: {},
        flag: 'updateFromReact',
      });
      expect(getAutoSized().has('el-1')).toBe(false);
      expect(getAutoSized().has('el-2')).toBe(true);
      expect(getAutoSized().size).toBe(1);

      listener.destroy();
    });

    it('should handle only height undefined as auto-sized then switching to both defined', () => {
      const { listener } = createListener();
      const getAutoSized = () =>
        listener.layoutState.getSnapshot().elements.autoSizedElementIds;

      // Only height undefined
      listener.updateGraph({
        elements: { 'el-1': { x: 0, y: 0, width: 100 } },
        links: {},
        flag: 'updateFromReact',
      });
      expect(getAutoSized().has('el-1')).toBe(true);

      // User provides height
      listener.updateGraph({
        elements: { 'el-1': { x: 0, y: 0, width: 100, height: 50 } },
        links: {},
        flag: 'updateFromReact',
      });
      expect(getAutoSized().has('el-1')).toBe(false);

      // User removes only width
      listener.updateGraph({
        elements: { 'el-1': { x: 0, y: 0, height: 50 } },
        links: {},
        flag: 'updateFromReact',
      });
      expect(getAutoSized().has('el-1')).toBe(true);

      listener.destroy();
    });
  });
});
