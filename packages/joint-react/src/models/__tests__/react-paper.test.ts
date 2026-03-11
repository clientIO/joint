import { dia, shapes } from '@joint/core';
import { ReactPaper } from '../react-paper';
import { ReactElement } from '../react-element';
import { GraphStore } from '../../store/graph-store';
const DEFAULT_CELL_NAMESPACE = { ...shapes, ReactElement };
const TEST_PAPER_ID = 'test-paper';
const toCellId = (id: dia.Cell.ID): string => id as string;

describe('ReactPaper', () => {
  let graphStore: GraphStore;
  let paper: ReactPaper;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    graphStore = new GraphStore({});
  });

  afterEach(() => {
    paper?.remove();
    graphStore?.destroy(false);
    container?.remove();
  });

  /**
   * Helper to create a ReactPaper with GraphStore callbacks wired.
   */
  function createPaper(options: Partial<dia.Paper.Options> = {}): ReactPaper {
    return new ReactPaper({
      el: container,
      model: graphStore.graph,
      onViewMountChange: (kind, cellId, isMounted) => {
        switch (kind) {
          case 'element': {
            if (isMounted) {
              graphStore.markPaperElementViewMounted(TEST_PAPER_ID, cellId);
            } else {
              graphStore.markPaperElementViewUnmounted(TEST_PAPER_ID, cellId);
            }
            return;
          }
          case 'link': {
            if (isMounted) {
              graphStore.markPaperLinkViewMounted(TEST_PAPER_ID, cellId);
            } else {
              graphStore.markPaperLinkViewUnmounted(TEST_PAPER_ID, cellId);
            }
            return;
          }
        }
      },
      cellNamespace: DEFAULT_CELL_NAMESPACE,
      async: false, // Synchronous for testing
      ...options,
    });
  }

  /**
   * Helper to access private pendingLinks for testing
   */
  function getPendingLinks(p: ReactPaper): Set<string> {
    return (p as unknown as { pendingLinks: Set<string> }).pendingLinks;
  }

  function getElementViewOrThrow(id: dia.Cell.ID): dia.ElementView {
    const view = paper.getElementView(toCellId(id));
    if (!view) {
      throw new Error(`Expected element view for ${String(id)}`);
    }
    return view;
  }

  function getLinkViewOrThrow(id: dia.Cell.ID): dia.LinkView {
    const view = paper.getLinkView(toCellId(id));
    if (!view) {
      throw new Error(`Expected link view for ${String(id)}`);
    }
    return view;
  }

  function findViewOrThrow(cell: dia.Cell): dia.CellView {
    const view = paper.findViewByModel(cell);
    if (!view) {
      throw new Error(`Expected cell view for ${String(cell.id)}`);
    }
    return view;
  }

  describe('constructor', () => {
    it('should create a paper instance', () => {
      paper = createPaper();

      expect(paper).toBeInstanceOf(dia.Paper);
    });
  });

  describe('mounting', () => {
    it('should mount paper into provided host via setElement/render and unfreeze', () => {
      paper = createPaper({
        frozen: true,
      });
      const host = document.createElement('div');
      document.body.append(host);

      const unfreezeSpy = jest.spyOn(paper, 'unfreeze');
      paper.setElement(host);
      paper.render();
      paper.unfreeze();

      expect(paper.el).toBe(host);
      expect(host.querySelector('svg')).not.toBeNull();
      expect(unfreezeSpy).toHaveBeenCalled();

      host.remove();
    });
  });

  describe('render', () => {
    it('should mount paper element into provided host and unfreeze the paper', () => {
      paper = createPaper({
        frozen: true,
      });
      const host = document.createElement('div');
      document.body.append(host);

      const unfreezeSpy = jest.spyOn(paper, 'unfreeze');
      paper.render(host);

      expect(host.firstChild).toBe(paper.el);
      expect(unfreezeSpy).toHaveBeenCalled();

      host.remove();
    });
  });

  describe('insertView', () => {
    it('should expose element view through getElementView when inserted', () => {
      paper = createPaper();

      const element = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);

      expect(paper.getElementView(toCellId(element.id))).toBeDefined();
      expect(getElementViewOrThrow(element.id).model).toBe(element);
    });

    it('should expose link view through getLinkView when inserted', () => {
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

      expect(paper.getLinkView(toCellId(link.id))).toBeDefined();
      expect(getLinkViewOrThrow(link.id).model).toBe(link);
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

      const linkView = getLinkViewOrThrow(link.id);
      expect(linkView.el.getAttribute('magnet')).not.toBe('false');
    });

    it('should mark element view as mounted when view is inserted', () => {
      const mountSpy = jest.spyOn(graphStore, 'markPaperElementViewMounted');

      paper = createPaper();

      const element = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);

      expect(mountSpy).toHaveBeenCalledWith(TEST_PAPER_ID, element.id as string);
    });
  });

  describe('removeView', () => {
    it('should remove element view from getElementView when cell is removed', () => {
      paper = createPaper();

      const element = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);
      expect(paper.getElementView(toCellId(element.id))).toBeDefined();

      graphStore.graph.removeCells([element]);
      expect(paper.getElementView(toCellId(element.id))).toBeUndefined();
    });

    it('should remove link view from getLinkView when link is removed', () => {
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
      expect(paper.getLinkView(toCellId(link.id))).toBeDefined();

      graphStore.graph.removeCells([link]);
      expect(paper.getLinkView(toCellId(link.id))).toBeUndefined();
    });

    it('should mark element view as unmounted when view is removed', () => {
      paper = createPaper();

      const element = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);

      const unmountSpy = jest.spyOn(graphStore, 'markPaperElementViewUnmounted');
      unmountSpy.mockClear();

      graphStore.graph.removeCells([element]);
      expect(unmountSpy).toHaveBeenCalledWith(TEST_PAPER_ID, element.id as string);
    });
  });

  describe('_hideCellView (viewport culling)', () => {
    it('should remove element id from internal mounted snapshot when hidden', () => {
      paper = createPaper({
        width: 100,
        height: 100,
      });

      const element = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 50, height: 50 },
      });
      graphStore.graph.addCell(element);
      expect(
        graphStore.internalState.getSnapshot().papers[TEST_PAPER_ID]?.elementViewIds[
          toCellId(element.id)
        ]
      ).toBe(true);

      // Get the view and call _hideCellView directly
      const view = findViewOrThrow(element);
      paper._hideCellView(view);

      expect(
        graphStore.internalState.getSnapshot().papers[TEST_PAPER_ID]?.elementViewIds[
          toCellId(element.id)
        ]
      ).toBeUndefined();
    });

    it('should remove link id from internal mounted snapshot when hidden', () => {
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
      expect(
        graphStore.internalState.getSnapshot().papers[TEST_PAPER_ID]?.linkViewIds[toCellId(link.id)]
      ).toBe(true);

      // Get the link view and call _hideCellView directly
      const linkView = findViewOrThrow(link);
      paper._hideCellView(linkView);

      expect(
        graphStore.internalState.getSnapshot().papers[TEST_PAPER_ID]?.linkViewIds[toCellId(link.id)]
      ).toBeUndefined();
    });

    it('should mark element view as unmounted when view is hidden', () => {
      paper = createPaper();

      const element = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);

      const unmountSpy = jest.spyOn(graphStore, 'markPaperElementViewUnmounted');
      unmountSpy.mockClear();

      const view = findViewOrThrow(element);
      paper._hideCellView(view);

      expect(unmountSpy).toHaveBeenCalledWith(TEST_PAPER_ID, element.id as string);
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
      const linkView = findViewOrThrow(link);
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

      const linkView = getLinkViewOrThrow(link.id);

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

      const linkView = getLinkViewOrThrow(link.id);
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
      const linkView = getLinkViewOrThrow(dragLink.id);

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

      const linkView = getLinkViewOrThrow(link.id);
      const element1View = getElementViewOrThrow(element1.id);
      const element2View = getElementViewOrThrow(element2.id);

      // Initially hidden
      expect(linkView.el.style.visibility).toBe('hidden');

      // Simulate React rendering children by adding child elements to portal nodes
      const child1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const child2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      paper.getCellViewPortalNode(element1View).append(child1);
      paper.getCellViewPortalNode(element2View).append(child2);

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
      const element1View = getElementViewOrThrow(element1.id);
      const element2View = getElementViewOrThrow(element2.id);

      // Initially in pending
      expect(pendingLinks.has(link.id as string)).toBe(true);

      // Simulate React rendering children into portal nodes
      paper.getCellViewPortalNode(element1View).append(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));
      paper.getCellViewPortalNode(element2View).append(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));

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

      const linkView = getLinkViewOrThrow(link.id);
      const element1View = getElementViewOrThrow(element1.id);

      // Only add children to source element's portal node
      paper.getCellViewPortalNode(element1View).append(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));

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
      const linkId = link.id as string;

      // Link should be in pending
      expect(pendingLinks.has(linkId)).toBe(true);

      const originalGetLinkView = paper.getLinkView.bind(paper);
      const getLinkViewSpy = jest
        .spyOn(paper, 'getLinkView')
        .mockImplementation((id) => (id === linkId ? undefined : originalGetLinkView(id)));

      // Should not throw
      expect(() => paper.checkPendingLinks()).not.toThrow();
      getLinkViewSpy.mockRestore();

      // Should clean up the orphaned pending link
      expect(pendingLinks.has(linkId)).toBe(false);
    });
  });
});
