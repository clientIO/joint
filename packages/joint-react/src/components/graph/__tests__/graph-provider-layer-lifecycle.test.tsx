import { dia } from '@joint/core';
import { act, render } from '@testing-library/react';
import { useLayoutEffect } from 'react';
import { GraphProvider } from '../graph-provider';
import { useGraph } from '../../../hooks/use-graph';
import type { GraphApi } from '../../../hooks/use-graph';
import type { LayerRecord } from '../../../types/layer.types';

const UPDATED_LAYERS = [{ id: 'cells' }, { id: 'notes', name: 'Updated' }];
const INITIAL_LAYERS: readonly LayerRecord[] = [{ id: 'cells' }, { id: 'notes' }];

function MountMutation({ mutate }: { readonly mutate: (api: GraphApi) => void }) {
  const api = useGraph();
  useLayoutEffect(() => {
    mutate(api);
  }, [api, mutate]);
  return null;
}

const hideNotes = (api: GraphApi) => api.setLayer('notes', { visible: false });
const addLayer = (api: GraphApi) => {
  if (!api.graph.hasLayer('child')) api.graph.addLayer({ id: 'child' });
};

describe('GraphProvider layer subscription ownership', () => {
  it.each([
    ['setLayer', hideNotes, { id: 'notes', visible: false }],
    ['graph.addLayer', addLayer, { id: 'child' }],
  ] as const)('reports %s from a child mount layout effect', (_name, mutate, expected) => {
    const onLayersChange = jest.fn();
    render(
      <GraphProvider initialLayers={INITIAL_LAYERS} onLayersChange={onLayersChange}>
        <MountMutation mutate={mutate} />
      </GraphProvider>
    );

    expect(onLayersChange).toHaveBeenCalledTimes(1);
    expect(onLayersChange).toHaveBeenLastCalledWith(expect.arrayContaining([expected]));
  });

  it('restores controlled layers changed by a child mount layout effect without a handler', async () => {
    const graph = new dia.Graph();
    render(
      <GraphProvider graph={graph} layers={INITIAL_LAYERS}>
        <MountMutation mutate={hideNotes} />
      </GraphProvider>
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(graph.getLayer('notes').get('visible')).not.toBe(false);
  });

  it('does not revert external graph layers after the provider unmounts', async () => {
    const graph = new dia.Graph();
    const { unmount } = render(<GraphProvider graph={graph} layers={INITIAL_LAYERS} />);

    act(() => {
      graph.getLayer('notes').set('visible', false);
    });
    expect(graph.getLayer('notes').get('visible')).toBe(false);
    unmount();

    await act(async () => {
      await Promise.resolve();
    });
    expect(graph.getLayer('notes').get('visible')).toBe(false);
  });

  it('uses the latest callback and does not echo controlled prop updates', () => {
    const graph = new dia.Graph();
    const initialHandler = jest.fn();
    const nextHandler = jest.fn();
    const { rerender } = render(
      <GraphProvider graph={graph} layers={INITIAL_LAYERS} onLayersChange={initialHandler} />
    );

    rerender(<GraphProvider graph={graph} layers={UPDATED_LAYERS} onLayersChange={nextHandler} />);
    expect(initialHandler).not.toHaveBeenCalled();
    expect(nextHandler).not.toHaveBeenCalled();

    act(() => {
      graph.getLayer('notes').set('visible', false);
    });
    expect(initialHandler).not.toHaveBeenCalled();
    expect(nextHandler).toHaveBeenCalledTimes(1);
    expect(nextHandler).toHaveBeenLastCalledWith(
      expect.arrayContaining([{ id: 'notes', name: 'Updated', visible: false }])
    );
  });
});


function CommitLayerChange({ visible }: { readonly visible: boolean }) {
  const { setLayer } = useGraph();
  useLayoutEffect(() => { setLayer('notes', { visible }); }, [setLayer, visible]);
  return null;
}

it('uses the replacement handler for a child layout-effect write in the same commit', () => {
  const oldHandler = jest.fn();
  const nextHandler = jest.fn();
  const { rerender } = render(
    <GraphProvider initialLayers={INITIAL_LAYERS} onLayersChange={oldHandler}>
      <CommitLayerChange visible />
    </GraphProvider>
  );
  oldHandler.mockClear();
  rerender(
    <GraphProvider initialLayers={INITIAL_LAYERS} onLayersChange={nextHandler}>
      <CommitLayerChange visible={false} />
    </GraphProvider>
  );
  expect(oldHandler).not.toHaveBeenCalled();
  expect(nextHandler).toHaveBeenCalledTimes(1);
  expect(nextHandler).toHaveBeenLastCalledWith(
    expect.arrayContaining([{ id: 'notes', visible: false }])
  );
});
