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
      type: 'ReactElement',
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
      type: 'ReactElement',
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
    });
    onIncrementalChange.mockClear();

    graph.resetCells([
      {
        id: 'reset-element',
        type: 'ReactElement',
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
        'react-element': { x: 15, y: 25, width: 100, height: 60, type: 'ReactElement' },
      },
      links: {},
      flag: 'updateFromReact',
    });

    expect(syncCellsSpy).toHaveBeenCalledTimes(1);
    expect(syncCellsSpy).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ isUpdateFromReact: true })
    );
    expect(graph.getCell('react-element')).toBeDefined();
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
      type: 'ReactElement',
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
      type: 'ReactElement',
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
});
