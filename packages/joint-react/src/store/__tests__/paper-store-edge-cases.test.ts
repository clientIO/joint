import { dia } from '@joint/core';
import { GraphStore } from '../graph-store';
import { PaperStore } from '../paper-store';
import { PortalPaper } from '../../models/portal-paper';

describe('PaperStore — externalPaper adoption', () => {
  it('overrides onViewMountChange on the adopted paper to relay into the graph store', () => {
    const graphStore = new GraphStore({});
    const externalPaper = new PortalPaper({
      model: graphStore.graph,
      id: 'external-paper',
    });

    const setPaperViewsSpy = jest.spyOn(graphStore, 'setPaperViews');

    const paperStore = new PaperStore({
      graphStore,
      paperOptions: {},
      id: 'test-paper',
      paper: externalPaper,
    });

    expect(paperStore.paper).toBe(externalPaper);

    // Trigger the relay manually to assert the wire is in place.
    const sample = new Map();
    externalPaper.onViewMountChange(sample);
    expect(setPaperViewsSpy).toHaveBeenCalledWith('test-paper', sample);

    paperStore.destroy();
    graphStore.destroy(true);
  });
});

describe('PaperStore — afterRender re-entrance guard', () => {
  it('skips when invoked re-entrantly during the same processing pass', () => {
    const graphStore = new GraphStore({});
    const paperStore = new PaperStore({
      graphStore,
      paperOptions: {},
      id: 'test-paper',
    });

    const afterRender = paperStore.paper.options.afterRender as
      | ((this: PortalPaper) => void)
      | undefined;
    expect(typeof afterRender).toBe('function');

    let entries = 0;
    const checkPendingLinks = jest.fn(() => {
      entries += 1;
      // Re-entrant call from inside the first processing pass: should
      // short-circuit via `if (isProcessing) return;`.
      if (entries === 1) {
        afterRender!.call(paperStore.paper);
      }
    });

    const fakeContext = {
      checkPendingLinks,
    } as unknown as PortalPaper;

    afterRender!.call(fakeContext);

    // The recursive invocation hits the guard and returns immediately, so
    // checkPendingLinks runs exactly once.
    expect(checkPendingLinks).toHaveBeenCalledTimes(1);

    paperStore.destroy();
    graphStore.destroy(false);
  });
});

describe('PaperStore.addPendingLinkChanges + flush', () => {
  it('queues link changes and flushes via setPaperViews after afterRender runs', async () => {
    const graphStore = new GraphStore({});
    const paperStore = new PaperStore({
      graphStore,
      paperOptions: {},
      id: 'test-paper',
    });

    const setPaperViewsSpy = jest.spyOn(graphStore, 'setPaperViews');

    const link = new dia.Link({
      type: 'standard.Link',
      source: { x: 0, y: 0 },
      target: { x: 10, y: 10 },
    });
    const changes = new Map<string, { type: 'change'; data: dia.Cell }>([
      ['link-1', { type: 'change', data: link }],
    ]);

    paperStore.addPendingLinkChanges(changes);

    // Trigger the afterRender hook attached to the paper to drive the flush.
    const afterRender = paperStore.paper.options.afterRender as
      | ((this: PortalPaper) => void)
      | undefined;
    expect(typeof afterRender).toBe('function');

    afterRender!.call(paperStore.paper);

    // flushPendingLinkChanges schedules via simpleScheduler — wait for microtask.
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(setPaperViewsSpy).toHaveBeenCalled();
    paperStore.destroy();
    graphStore.destroy(false);
  });
});
