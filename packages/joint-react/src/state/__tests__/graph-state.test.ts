/* eslint-disable @typescript-eslint/no-invalid-void-type */
import { dia } from '@joint/core';
import type { PaperStore } from '../../store';
import { DEFAULT_CELL_NAMESPACE } from '../../store/graph-store';
import { graphState } from '../graph-state';
import type { IncrementalStateChanges } from '../incremental.types';
import type { FlatElementData } from '../../types/element-types';
import type { FlatLinkData } from '../../types/link-types';

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

  describe('layoutState count and measuredElements', () => {
    it('increments count and measuredElements on add', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      const listener = graphState({
        graph,
        papers: new Map<string, PaperStore>(),
        onReset: jest.fn(),
        mappers: {},
      });

      const layout = () => listener.layoutState.getSnapshot().elements;

      expect(layout().count).toBe(0);
      expect(layout().measuredElements).toBe(0);

      graph.addCell({
        id: 'el-1',
        type: 'PortalElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
      });

      expect(layout().count).toBe(1);
      expect(layout().measuredElements).toBe(1);

      graph.addCell({
        id: 'el-2',
        type: 'PortalElement',
        position: { x: 10, y: 10 },
        size: { width: 200, height: 200 },
      });

      expect(layout().count).toBe(2);
      expect(layout().measuredElements).toBe(2);

      listener.destroy();
    });

    it('does not count unmeasured elements (width/height <= 1)', () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      const listener = graphState({
        graph,
        papers: new Map<string, PaperStore>(),
        onReset: jest.fn(),
        mappers: {},
      });

      const layout = () => listener.layoutState.getSnapshot().elements;

      graph.addCell({
        id: 'el-unmeasured',
        type: 'PortalElement',
        position: { x: 0, y: 0 },
        size: { width: 1, height: 1 },
      });

      expect(layout().count).toBe(1);
      expect(layout().measuredElements).toBe(0);

      // Resize to measured
      const element = graph.getCell('el-unmeasured') as dia.Element;
      element.resize(50, 50);

      expect(layout().count).toBe(1);
      expect(layout().measuredElements).toBe(1);

      // Resize back to unmeasured
      element.resize(1, 1);

      expect(layout().count).toBe(1);
      expect(layout().measuredElements).toBe(0);

      listener.destroy();
    });

    it('decrements count and measuredElements on remove', () => {
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
      expect(layout().measuredElements).toBe(2);

      graph.removeCells([graph.getCell('el-1')!]);

      expect(layout().count).toBe(1);
      expect(layout().measuredElements).toBe(1);

      graph.removeCells([graph.getCell('el-2')!]);

      expect(layout().count).toBe(0);
      expect(layout().measuredElements).toBe(0);

      listener.destroy();
    });

    it('does not count links in element count or measuredElements', () => {
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
      expect(layout().measuredElements).toBe(1);

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
});
