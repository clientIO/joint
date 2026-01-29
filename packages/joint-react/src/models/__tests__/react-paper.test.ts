import { dia, shapes } from '@joint/core';
import { ReactPaper } from '../react-paper';
import { GraphStore } from '../../store/graph-store';
import type { ReactElementViewCache, ReactLinkViewCache } from '../../types/paper.types';

const DEFAULT_CELL_NAMESPACE = shapes;

describe('ReactPaper', () => {
  let graphStore: GraphStore;
  let paper: ReactPaper;
  let container: HTMLElement;
  let elementCache: ReactElementViewCache;
  let linkCache: ReactLinkViewCache;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    graphStore = new GraphStore({});

    // Initialize caches that PaperStore would normally set up
    elementCache = {
      elementViews: {},
      portsData: {},
    };
    linkCache = {
      linkViews: {},
      linksData: {},
    };
  });

  afterEach(() => {
    paper?.remove();
    graphStore?.destroy(false);
    container?.remove();
  });

  /**
   * Helper to create a ReactPaper with caches properly initialized
   */
  function createPaper(options: Partial<dia.Paper.Options> = {}): ReactPaper {
    const p = new ReactPaper({
      el: container,
      model: graphStore.graph,
      graphStore,
      cellNamespace: DEFAULT_CELL_NAMESPACE,
      async: false, // Synchronous for testing
      ...options,
    });
    p.reactElementCache = elementCache;
    p.reactLinkCache = linkCache;
    return p;
  }

  describe('constructor', () => {
    it('should create a paper instance', () => {
      paper = createPaper();

      expect(paper).toBeInstanceOf(dia.Paper);
    });

    it('should store graphStore reference', () => {
      paper = createPaper();

      // Access private property for testing
      expect((paper as unknown as { graphStore: GraphStore }).graphStore).toBe(graphStore);
    });
  });

  describe('insertView', () => {
    it('should add element view to reactElementCache when inserted', () => {
      paper = createPaper();

      const element = new shapes.standard.Rectangle({
        id: 'el1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);

      // After adding cell, view should be in elementCache
      expect(elementCache.elementViews['el1']).toBeDefined();
      expect(elementCache.elementViews['el1'].model).toBe(element);
    });

    it('should add link view to reactLinkCache when inserted', () => {
      paper = createPaper();

      const element1 = new shapes.standard.Rectangle({
        id: 'el1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new shapes.standard.Rectangle({
        id: 'el2',
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        id: 'link1',
        source: { id: 'el1' },
        target: { id: 'el2' },
      });
      graphStore.graph.addCells([element1, element2, link]);

      expect(linkCache.linkViews['link1']).toBeDefined();
      expect(linkCache.linkViews['link1'].model).toBe(link);
    });

    it('should set magnet=false on element views', () => {
      paper = createPaper();

      const element = new shapes.standard.Rectangle({
        id: 'el1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);

      const view = elementCache.elementViews['el1'];
      expect(view.el.getAttribute('magnet')).toBe('false');
    });

    it('should NOT set magnet=false on link views', () => {
      paper = createPaper();

      const element1 = new shapes.standard.Rectangle({
        id: 'el1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new shapes.standard.Rectangle({
        id: 'el2',
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        id: 'link1',
        source: { id: 'el1' },
        target: { id: 'el2' },
      });
      graphStore.graph.addCells([element1, element2, link]);

      const linkView = linkCache.linkViews['link1'];
      expect(linkView.el.getAttribute('magnet')).not.toBe('false');
    });

    it('should call schedulePaperUpdate when view is inserted', () => {
      const scheduleSpy = jest.spyOn(graphStore, 'schedulePaperUpdate');

      paper = createPaper();

      const element = new shapes.standard.Rectangle({
        id: 'el1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);

      expect(scheduleSpy).toHaveBeenCalled();
    });
  });

  describe('removeView', () => {
    it('should remove view from reactElementCache when cell is removed', () => {
      paper = createPaper();

      const element = new shapes.standard.Rectangle({
        id: 'el1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);
      expect(elementCache.elementViews['el1']).toBeDefined();

      graphStore.graph.removeCells([element]);
      expect(elementCache.elementViews['el1']).toBeUndefined();
    });

    it('should remove view from reactLinkCache when link is removed', () => {
      paper = createPaper();

      const element1 = new shapes.standard.Rectangle({
        id: 'el1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new shapes.standard.Rectangle({
        id: 'el2',
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        id: 'link1',
        source: { id: 'el1' },
        target: { id: 'el2' },
      });
      graphStore.graph.addCells([element1, element2, link]);
      expect(linkCache.linkViews['link1']).toBeDefined();

      graphStore.graph.removeCells([link]);
      expect(linkCache.linkViews['link1']).toBeUndefined();
    });

    it('should call schedulePaperUpdate when view is removed', () => {
      paper = createPaper();

      const element = new shapes.standard.Rectangle({
        id: 'el1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);

      const scheduleSpy = jest.spyOn(graphStore, 'schedulePaperUpdate');
      scheduleSpy.mockClear();

      graphStore.graph.removeCells([element]);
      expect(scheduleSpy).toHaveBeenCalled();
    });
  });

  describe('_hideCellView (viewport culling)', () => {
    it('should remove element view from reactElementCache when hidden', () => {
      paper = createPaper({
        width: 100,
        height: 100,
      });

      const element = new shapes.standard.Rectangle({
        id: 'el1',
        position: { x: 0, y: 0 },
        size: { width: 50, height: 50 },
      });
      graphStore.graph.addCell(element);
      expect(elementCache.elementViews['el1']).toBeDefined();

      // Get the view and call _hideCellView directly
      const view = paper.findViewByModel(element);
      paper._hideCellView(view);

      expect(elementCache.elementViews['el1']).toBeUndefined();
    });

    it('should remove link view from reactLinkCache when hidden', () => {
      paper = createPaper({
        width: 100,
        height: 100,
      });

      const element1 = new shapes.standard.Rectangle({
        id: 'el1',
        position: { x: 0, y: 0 },
        size: { width: 50, height: 50 },
      });
      const element2 = new shapes.standard.Rectangle({
        id: 'el2',
        position: { x: 200, y: 0 },
        size: { width: 50, height: 50 },
      });
      const link = new shapes.standard.Link({
        id: 'link1',
        source: { id: 'el1' },
        target: { id: 'el2' },
      });
      graphStore.graph.addCells([element1, element2, link]);
      expect(linkCache.linkViews['link1']).toBeDefined();

      // Get the link view and call _hideCellView directly
      const linkView = paper.findViewByModel(link);
      paper._hideCellView(linkView);

      expect(linkCache.linkViews['link1']).toBeUndefined();
    });

    it('should call schedulePaperUpdate when view is hidden', () => {
      paper = createPaper();

      const element = new shapes.standard.Rectangle({
        id: 'el1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);

      const scheduleSpy = jest.spyOn(graphStore, 'schedulePaperUpdate');
      scheduleSpy.mockClear();

      const view = paper.findViewByModel(element);
      paper._hideCellView(view);

      expect(scheduleSpy).toHaveBeenCalled();
    });
  });
});
