import { act, renderHook, waitFor } from '@testing-library/react';
import { paperRenderElementWrapper } from '../../utils/test-wrappers';
import { usePaper } from '../../hooks/use-paper';
import { useGraph } from '../../hooks/use-graph';
import { useGraphStore } from '../../hooks/use-graph-store';
import type { CellRecord } from '../../types/cell.types';
import type { LayerRecord } from '../../types/layer.types';

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

function makeWrapper(id: string) {
  return paperRenderElementWrapper({
    graphProviderProps: { initialLayers: LAYERS, initialCells: CELLS },
    paperProps: { id, renderElement: renderRect },
  });
}

/** Mounts a paper with the layers fixture and resolves once the paper exists. */
async function mountPaper(id: string) {
  const { result } = renderHook(
    () => ({ paperApi: usePaper(id), api: useGraph(), store: useGraphStore() }),
    { wrapper: makeWrapper(id) }
  );
  await waitFor(() => expect(result.current.paperApi.paper).not.toBeNull());
  return { result, paper: result.current.paperApi.paper! };
}

describe('layer visibility on <Paper>', () => {
  it('hides a layer declared with visible: false and keeps its cells mounted', async () => {
    const { paper } = await mountPaper('vis-initial');
    expect(paper.getLayerView('notes').el.style.display).toBe('none');
    expect(paper.getLayerView('overlay').el.style.display).toBe('');
    // Hidden means not painted, not unmounted: the cell view is still there.
    expect(paper.findViewByModel('n')).toBeDefined();
  });

  it('toggles display when visible changes, without touching cell views', async () => {
    const { result, paper } = await mountPaper('vis-toggle');
    const viewBefore = paper.findViewByModel('n');

    await commit(() => {
      result.current.api.setLayer('notes', { visible: true });
    });
    expect(paper.getLayerView('notes').el.style.display).toBe('');
    expect(paper.findViewByModel('n')).toBe(viewBefore);

    await commit(() => {
      result.current.api.setLayer('notes', { visible: false });
    });
    expect(paper.getLayerView('notes').el.style.display).toBe('none');
  });

  it('applies visibility to a layer added after the paper mounted', async () => {
    const { result, paper } = await mountPaper('vis-late');
    await commit(() => {
      result.current.api.setLayer('late', { visible: false });
    });
    expect(paper.getLayerView('late').el.style.display).toBe('none');
  });
});

// Regression: core's Paper defers a layer view removal but early-returns on a
// re-add while that removal is still pending, so dropping and re-declaring a
// layer within one frame orphaned it — the next cell placed on it threw
// `Unknown layer view` from the async update loop and never rendered.
describe('re-declaring a layer within one frame', () => {
  it('keeps a live layer view and renders a cell added to it afterwards', async () => {
    const { result, paper } = await mountPaper('vis-readd');

    await commit(() => {
      result.current.api.setLayers([{ id: 'cells' }, { id: 'notes' }]); // drops 'overlay'
      result.current.api.setLayers([{ id: 'cells' }, { id: 'notes' }, { id: 'overlay' }]);
    });
    paper.updateViews();
    expect(result.current.store.graph.hasLayer('overlay')).toBe(true);
    expect(paper.hasLayerView('overlay')).toBe(true);

    await commit(() => {
      result.current.api.setCell({ id: 'late', type: 'element', layer: 'overlay' });
    });
    paper.updateViews();
    const view = paper.findViewByModel('late');
    expect(view).toBeDefined();
    expect(paper.getLayerView('overlay').el.contains(view.el)).toBe(true);
  });
});
