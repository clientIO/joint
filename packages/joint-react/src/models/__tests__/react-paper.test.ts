import { dia, shapes } from '@joint/core';
import { ReactPaper } from '../react-paper';
import { ReactElement } from '../react-element';
import { GraphStore } from '../../store/graph-store';
import type { ReactElementViewCache, ReactLinkViewCache } from '../../types/paper.types';

const DEFAULT_CELL_NAMESPACE = { ...shapes, ReactElement };

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

  /**
   * Helper to access private pendingLinks for testing
   */
  function getPendingLinks(p: ReactPaper): Set<string> {
    return (p as unknown as { pendingLinks: Set<string> }).pendingLinks;
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
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);

      // After adding cell, view should be in elementCache
      expect(elementCache.elementViews[element.id]).toBeDefined();
      expect(elementCache.elementViews[element.id].model).toBe(element);
    });

    it('should add link view to reactLinkCache when inserted', () => {
      paper = createPaper();

      const element1 = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new shapes.standard.Rectangle({
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        source: { id: element1.id },
        target: { id: element2.id },
      });
      graphStore.graph.addCells([element1, element2, link]);

      expect(linkCache.linkViews[link.id]).toBeDefined();
      expect(linkCache.linkViews[link.id].model).toBe(link);
    });

    it('should set magnet=false on element views', () => {
      paper = createPaper();

      const element = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);

      const view = elementCache.elementViews[element.id];
      expect(view.el.getAttribute('magnet')).toBe('false');
    });

    it('should NOT set magnet=false on link views', () => {
      paper = createPaper();

      const element1 = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new shapes.standard.Rectangle({
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        source: { id: element1.id },
        target: { id: element2.id },
      });
      graphStore.graph.addCells([element1, element2, link]);

      const linkView = linkCache.linkViews[link.id];
      expect(linkView.el.getAttribute('magnet')).not.toBe('false');
    });

    it('should call schedulePaperUpdate when view is inserted', () => {
      const scheduleSpy = jest.spyOn(graphStore, 'schedulePaperUpdate');

      paper = createPaper();

      const element = new shapes.standard.Rectangle({
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
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);
      expect(elementCache.elementViews[element.id]).toBeDefined();

      graphStore.graph.removeCells([element]);
      expect(elementCache.elementViews[element.id]).toBeUndefined();
    });

    it('should remove view from reactLinkCache when link is removed', () => {
      paper = createPaper();

      const element1 = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new shapes.standard.Rectangle({
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        source: { id: element1.id },
        target: { id: element2.id },
      });
      graphStore.graph.addCells([element1, element2, link]);
      expect(linkCache.linkViews[link.id]).toBeDefined();

      graphStore.graph.removeCells([link]);
      expect(linkCache.linkViews[link.id]).toBeUndefined();
    });

    it('should call schedulePaperUpdate when view is removed', () => {
      paper = createPaper();

      const element = new shapes.standard.Rectangle({
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
        position: { x: 0, y: 0 },
        size: { width: 50, height: 50 },
      });
      graphStore.graph.addCell(element);
      expect(elementCache.elementViews[element.id]).toBeDefined();

      // Get the view and call _hideCellView directly
      const view = paper.findViewByModel(element);
      paper._hideCellView(view);

      expect(elementCache.elementViews[element.id]).toBeUndefined();
    });

    it('should remove link view from reactLinkCache when hidden', () => {
      paper = createPaper({
        width: 100,
        height: 100,
      });

      const element1 = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 50, height: 50 },
      });
      const element2 = new shapes.standard.Rectangle({
        position: { x: 200, y: 0 },
        size: { width: 50, height: 50 },
      });
      const link = new shapes.standard.Link({
        source: { id: element1.id },
        target: { id: element2.id },
      });
      graphStore.graph.addCells([element1, element2, link]);
      expect(linkCache.linkViews[link.id]).toBeDefined();

      // Get the link view and call _hideCellView directly
      const linkView = paper.findViewByModel(link);
      paper._hideCellView(linkView);

      expect(linkCache.linkViews[link.id]).toBeUndefined();
    });

    it('should call schedulePaperUpdate when view is hidden', () => {
      paper = createPaper();

      const element = new shapes.standard.Rectangle({
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

    it('should remove link from pendingLinks when hidden', () => {
      paper = createPaper();

      // Use ReactElement which has empty markup (like real React usage)
      const element1 = new ReactElement({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new ReactElement({
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        source: { id: element1.id },
        target: { id: element2.id },
      });
      graphStore.graph.addCells([element1, element2, link]);

      const pendingLinks = getPendingLinks(paper);

      // Link should be in pending (source/target have no children - ReactElement has empty markup)
      expect(pendingLinks.has(link.id as string)).toBe(true);

      // Hide the link
      const linkView = paper.findViewByModel(link);
      paper._hideCellView(linkView);

      // Should be removed from pending
      expect(pendingLinks.has(link.id as string)).toBe(false);
    });
  });

  describe('pending links visibility', () => {
    it('should hide link when source element has no children (ReactElement)', () => {
      paper = createPaper();

      // Use ReactElement which has empty markup (like real React usage)
      const element1 = new ReactElement({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new ReactElement({
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        source: { id: element1.id },
        target: { id: element2.id },
      });
      graphStore.graph.addCells([element1, element2, link]);

      const linkView = linkCache.linkViews[link.id];

      // Link should be hidden (ReactElement has empty markup, no children)
      expect(linkView.el.style.visibility).toBe('hidden');
    });

    it('should NOT hide link when using standard shapes with default markup', () => {
      paper = createPaper();

      // Standard shapes have default markup with children
      const element1 = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new shapes.standard.Rectangle({
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        source: { id: element1.id },
        target: { id: element2.id },
      });
      graphStore.graph.addCells([element1, element2, link]);

      const linkView = linkCache.linkViews[link.id];
      const pendingLinks = getPendingLinks(paper);

      // Standard shapes have children, so link should NOT be hidden or pending
      expect(linkView.el.style.visibility).toBe('');
      expect(pendingLinks.has(link.id as string)).toBe(false);
    });

    it('should add link to pendingLinks when source/target not ready (ReactElement)', () => {
      paper = createPaper();

      // Use ReactElement which has empty markup
      const element1 = new ReactElement({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new ReactElement({
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        source: { id: element1.id },
        target: { id: element2.id },
      });
      graphStore.graph.addCells([element1, element2, link]);

      const pendingLinks = getPendingLinks(paper);

      expect(pendingLinks.has(link.id as string)).toBe(true);
    });

    it('should keep link visible while dragging when one end is a point', () => {
      paper = createPaper();

      const sourceElement = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const dragLink = new shapes.standard.Link({
        source: { id: sourceElement.id },
        target: { x: 240, y: 160 },
      });
      graphStore.graph.addCells([sourceElement, dragLink]);

      const pendingLinks = getPendingLinks(paper);
      const linkView = linkCache.linkViews[dragLink.id];

      expect(linkView.el.style.visibility).toBe('');
      expect(pendingLinks.has(dragLink.id as string)).toBe(false);
    });

    it('should show link when source and target elements have children', () => {
      paper = createPaper();

      // Use ReactElement which has empty markup
      const element1 = new ReactElement({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new ReactElement({
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        source: { id: element1.id },
        target: { id: element2.id },
      });
      graphStore.graph.addCells([element1, element2, link]);

      const linkView = linkCache.linkViews[link.id];
      const element1View = elementCache.elementViews[element1.id];
      const element2View = elementCache.elementViews[element2.id];

      // Initially hidden
      expect(linkView.el.style.visibility).toBe('hidden');

      // Simulate React rendering children by adding child elements
      const child1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const child2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      element1View.el.append(child1);
      element2View.el.append(child2);

      // Call checkPendingLinks to process
      paper.checkPendingLinks();

      // Link should now be visible
      expect(linkView.el.style.visibility).toBe('');
    });

    it('should remove link from pendingLinks after showing', () => {
      paper = createPaper();

      // Use ReactElement which has empty markup
      const element1 = new ReactElement({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new ReactElement({
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        source: { id: element1.id },
        target: { id: element2.id },
      });
      graphStore.graph.addCells([element1, element2, link]);

      const pendingLinks = getPendingLinks(paper);
      const element1View = elementCache.elementViews[element1.id];
      const element2View = elementCache.elementViews[element2.id];

      // Initially in pending
      expect(pendingLinks.has(link.id as string)).toBe(true);

      // Simulate React rendering children
      element1View.el.append(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));
      element2View.el.append(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));

      paper.checkPendingLinks();

      // Should be removed from pending
      expect(pendingLinks.has(link.id as string)).toBe(false);
    });

    it('should not show link if only source is ready', () => {
      paper = createPaper();

      // Use ReactElement which has empty markup
      const element1 = new ReactElement({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new ReactElement({
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        source: { id: element1.id },
        target: { id: element2.id },
      });
      graphStore.graph.addCells([element1, element2, link]);

      const linkView = linkCache.linkViews[link.id];
      const element1View = elementCache.elementViews[element1.id];

      // Only add children to source element
      element1View.el.append(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));

      paper.checkPendingLinks();

      // Link should still be hidden (target has no children)
      expect(linkView.el.style.visibility).toBe('hidden');
    });

    it('should clean up pendingLinks when link is removed', () => {
      paper = createPaper();

      // Use ReactElement which has empty markup
      const element1 = new ReactElement({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new ReactElement({
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        source: { id: element1.id },
        target: { id: element2.id },
      });
      graphStore.graph.addCells([element1, element2, link]);

      const pendingLinks = getPendingLinks(paper);

      // Link should be in pending
      expect(pendingLinks.has(link.id as string)).toBe(true);

      // Remove the link
      graphStore.graph.removeCells([link]);

      // Should be cleaned up
      expect(pendingLinks.has(link.id as string)).toBe(false);
    });

    it('should handle checkPendingLinks when link view was removed', () => {
      paper = createPaper();

      // Use ReactElement which has empty markup
      const element1 = new ReactElement({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new ReactElement({
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        source: { id: element1.id },
        target: { id: element2.id },
      });
      graphStore.graph.addCells([element1, element2, link]);

      const pendingLinks = getPendingLinks(paper);

      // Link should be in pending
      expect(pendingLinks.has(link.id as string)).toBe(true);

      // Manually remove from linkCache but keep in pendingLinks (simulating race condition)
      Reflect.deleteProperty(linkCache.linkViews, link.id);

      // Should not throw
      expect(() => paper.checkPendingLinks()).not.toThrow();

      // Should clean up the orphaned pending link
      expect(pendingLinks.has(link.id as string)).toBe(false);
    });
  });
});
