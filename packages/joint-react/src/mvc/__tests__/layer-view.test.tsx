import { act, renderHook, waitFor } from '@testing-library/react';
import { dia } from '@joint/core';
import { paperRenderElementWrapper } from '../../utils/test-wrappers';
import { usePaper } from '../../hooks/use-paper';
import { useGraph } from '../../hooks/use-graph';
import { useGraphStore } from '../../hooks/use-graph-store';
import { LayerModel, LAYER_MODEL_TYPE } from '../layer-model';
import { LayerView } from '../layer-view';
import type { CellRecord } from '../../types/cell.types';
import type { LayerRecord } from '../../types/layer.types';
import type { GraphProviderProps } from '../../components/graph/graph-provider';
import type { PaperProps } from '../../components/paper/paper.types';

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));
/** Runs a mutation inside `act` and drains the store's microtask commit. */
const commit = (run: () => void) =>
  act(async () => {
    run();
    await flush();
  });

const LAYERS: readonly LayerRecord[] = [
  { id: 'cells' },
  { id: 'notes', visible: false },
  { id: 'overlay' },
];
const CELLS: readonly CellRecord[] = [
  { id: 'n', type: 'element', size: { width: 10, height: 10 }, layer: 'notes' } as CellRecord,
];
const renderRect = () => <rect />;

interface MountOptions {
  readonly graphProviderProps?: Partial<GraphProviderProps>;
  readonly paperProps?: Partial<PaperProps>;
}

function makeWrapper(id: string, { graphProviderProps, paperProps }: MountOptions) {
  return paperRenderElementWrapper({
    graphProviderProps: { initialLayers: LAYERS, initialCells: CELLS, ...graphProviderProps },
    paperProps: { id, renderElement: renderRect, ...paperProps },
  });
}

/** Mounts a paper with the layers fixture and resolves once the paper exists. */
async function mountPaper(id: string, options: MountOptions = {}) {
  const { result } = renderHook(
    () => ({ paperApi: usePaper(id), api: useGraph(), store: useGraphStore() }),
    { wrapper: makeWrapper(id, options) }
  );
  await waitFor(() => expect(result.current.paperApi.paper).not.toBeNull());
  return { result, paper: result.current.paperApi.paper! };
}

describe('LayerModel / LayerView registration', () => {
  it('keeps the plain layer type, so the graph JSON is unchanged', () => {
    expect(LAYER_MODEL_TYPE).toBe(dia.GraphLayer.prototype.defaults().type);
  });

  it('constructs the default layer and declared layers as LayerModel, rendered by LayerView', async () => {
    const { result, paper } = await mountPaper('reg');
    const { graph } = result.current.store;
    expect(graph.getDefaultLayer()).toBeInstanceOf(LayerModel);
    expect(graph.getLayer('notes')).toBeInstanceOf(LayerModel);
    expect(paper.getLayerView('cells')).toBeInstanceOf(LayerView);
    expect(paper.getLayerView('notes')).toBeInstanceOf(LayerView);
  });

  it('merges a custom layerNamespace on top of the built-in', async () => {
    class TintLayer extends LayerModel {
      defaults() {
        return { ...super.defaults(), type: 'TintLayer' };
      }
    }
    // joint-core resolves a layer's view as `<type>View`, so a custom type needs
    // a view registered too. The wrapper mounts the hook inside `renderElement`,
    // so the graph also needs a cell.
    const { result, paper } = await mountPaper('custom-ns', {
      graphProviderProps: {
        layerNamespace: { TintLayer },
        initialLayers: [{ id: 'cells' }, { id: 'tint', type: 'TintLayer', visible: false }],
        initialCells: [{ id: 't', type: 'element', layer: 'tint' } as CellRecord],
      },
      paperProps: { layerViewNamespace: { TintLayerView: LayerView } },
    });
    const { graph } = result.current.store;
    expect(graph.getLayer('tint')).toBeInstanceOf(TintLayer);
    expect(graph.getDefaultLayer()).toBeInstanceOf(LayerModel);
    expect(paper.getLayerView('tint')).toBeInstanceOf(LayerView);
    expect(paper.getLayerView('tint').el.style.visibility).toBe('hidden');
  });
});

describe('layer visibility on <Paper>', () => {
  it('hides a layer declared with visible: false and keeps its cells mounted', async () => {
    const { paper } = await mountPaper('vis-initial');
    expect(paper.getLayerView('notes').el.style.visibility).toBe('hidden');
    expect(paper.getLayerView('overlay').el.style.visibility).toBe('');
    // Hidden means not painted, not unmounted: the cell view is still there
    // and, unlike `display: none`, keeps its bounding box for measurement.
    expect(paper.findViewByModel('n')).toBeDefined();
  });

  it('toggles visibility when visible changes, without touching cell views', async () => {
    const { result, paper } = await mountPaper('vis-toggle');
    const viewBefore = paper.findViewByModel('n');

    await commit(() => {
      result.current.api.setLayer('notes', { visible: true });
    });
    expect(paper.getLayerView('notes').el.style.visibility).toBe('');
    expect(paper.findViewByModel('n')).toBe(viewBefore);

    await commit(() => {
      result.current.api.setLayer('notes', { visible: false });
    });
    expect(paper.getLayerView('notes').el.style.visibility).toBe('hidden');
  });

  it('applies visibility to a layer added after the paper mounted', async () => {
    const { result, paper } = await mountPaper('vis-late');
    await commit(() => {
      result.current.api.setLayer('late', { visible: false });
    });
    expect(paper.getLayerView('late').el.style.visibility).toBe('hidden');
  });
});

// Regression (fixed in joint-core's `dia.Paper.onGraphLayerAdd`): the paper
// defers a layer view removal but early-returned on a re-add while that
// removal was still pending, so dropping and re-declaring a layer within one
// frame left it without a view — the next cell placed on it threw
// `Unknown layer view` from the async update loop and never rendered.
describe('re-declaring a layer within one frame', () => {
  it('gets a view bound to the new layer and renders a cell added to it afterwards', async () => {
    const { result, paper } = await mountPaper('vis-readd');

    await commit(() => {
      result.current.api.setLayers([{ id: 'cells' }, { id: 'notes' }]); // drops 'overlay'
      result.current.api.setLayers([{ id: 'cells' }, { id: 'notes' }, { id: 'overlay' }]);
    });
    paper.updateViews();
    const { graph } = result.current.store;
    expect(graph.hasLayer('overlay')).toBe(true);
    expect(paper.hasLayerView('overlay')).toBe(true);
    expect(paper.getLayerView('overlay').model).toBe(graph.getLayer('overlay'));

    await commit(() => {
      result.current.api.setCell({ id: 'late', type: 'element', layer: 'overlay' });
    });
    paper.updateViews();
    const view = paper.findViewByModel('late');
    expect(view).toBeDefined();
    expect(paper.getLayerView('overlay').el.contains(view.el)).toBe(true);
  });
});
