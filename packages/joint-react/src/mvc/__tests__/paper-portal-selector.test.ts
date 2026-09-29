/* eslint-disable @typescript-eslint/no-explicit-any */
import type { dia} from '@joint/core';
import { shapes } from '@joint/core';
import { PaperView } from '../paper';
import { ElementModel } from '../element-model';
import { GraphStore } from '../../store/graph-store';
import type { CellId } from '../../types/cell.types';
import type { IncrementalChange } from '../../state/incremental.types';

const TEST_PAPER_ID = 'portal-selector-paper';
const DEFAULT_CELL_NAMESPACE = { ...shapes, element: ElementModel };

describe('PaperView / portalSelector overrides', () => {
  let graphStore: GraphStore;
  let paper: PaperView;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    graphStore = new GraphStore({});
    graphStore.internalState.setState((previous) => ({
      ...previous,
      papers: {
        ...previous.papers,
        [TEST_PAPER_ID]: { version: 1, featuresState: {} },
      },
    }));
  });

  afterEach(() => {
    paper?.remove();
    graphStore?.destroy(false);
    container?.remove();
  });

  function createPaper(portalSelector: any): PaperView {
    return new PaperView({
      el: container,
      model: graphStore.graph,
      onViewMountChange: (changes: Map<CellId, IncrementalChange<dia.Cell>>) => {
        graphStore.setPaperViews(TEST_PAPER_ID, changes);
      },
      cellNamespace: DEFAULT_CELL_NAMESPACE,
      portalSelector,
      async: false,
      frozen: false,
    });
  }

  function addElement(): { element: dia.Element; view: dia.CellView } {
    const element = new shapes.standard.Rectangle({
      position: { x: 0, y: 0 },
      size: { width: 50, height: 50 },
    });
    graphStore.graph.addCell(element);
    const view = paper.findViewByModel(element)!;
    return { element, view };
  }

  it('returns null when paper-level portalSelector is null', () => {
    paper = createPaper(null);
    const { view } = addElement();
    expect(paper.getCellViewPortalNode(view)).toBeNull();
  });

  it('uses string selector to look up node', () => {
    paper = createPaper('root');
    const { view } = addElement();
    const node = paper.getCellViewPortalNode(view);
    expect(node).toBeDefined();
    expect(node).toBeInstanceOf(Element);
  });

  it('function selector returning null skips rendering', () => {
    paper = createPaper(() => null);
    const { view } = addElement();
    expect(paper.getCellViewPortalNode(view)).toBeNull();
  });

  it('function selector returning undefined falls back to cell default', () => {
    paper = createPaper(() => {});
    const { view } = addElement();
    // standard.Rectangle has no `portalSelector` field, so falls back to null
    expect(paper.getCellViewPortalNode(view)).toBeNull();
  });

  it('function selector returning undefined uses cell default selector when present', () => {
    paper = createPaper(() => {});

    const element = new ElementModel({
      position: { x: 0, y: 0 },
      size: { width: 50, height: 50 },
    });
    graphStore.graph.addCell(element);
    const view = paper.findViewByModel(element)!;

    const node = paper.getCellViewPortalNode(view);
    expect(node).toBeDefined();
    expect(node).toBeInstanceOf(Element);
  });

  it('function selector returning an Element uses that element directly', () => {
    const customNode = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    paper = createPaper(() => customNode);
    const { view } = addElement();
    expect(paper.getCellViewPortalNode(view)).toBe(customNode);
  });

  it('function selector returning a string looks up by name', () => {
    paper = createPaper(() => 'root');
    const { view } = addElement();
    const node = paper.getCellViewPortalNode(view);
    expect(node).toBeDefined();
    expect(node).toBeInstanceOf(Element);
  });

  it('function selector receives model/paper/graph context', () => {
    const spy = jest.fn(() => null);
    paper = createPaper(spy);
    const { view } = addElement();
    paper.getCellViewPortalNode(view);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        model: view.model,
        paper,
        graph: graphStore.graph,
      })
    );
  });

  describe('isElementReady early returns (via isLinkEndReady)', () => {
    it('treats link end with missing id as ready (point endpoint)', () => {
      const noPortalSelector: undefined = undefined;
      paper = createPaper(noPortalSelector);

      const sourceElement = new ElementModel({
        position: { x: 0, y: 0 },
        size: { width: 50, height: 50 },
      });
      const link = new shapes.standard.Link({
        source: { id: sourceElement.id },
        target: { x: 200, y: 100 },
      });
      graphStore.graph.addCells([sourceElement, link]);

      const linkView = paper.findViewByModel(link);
      expect(linkView).toBeDefined();
    });

    it('does not keep a link-to-link connection hidden', () => {
      const noPortalSelector: undefined = undefined;
      paper = createPaper(noPortalSelector);

      const a = new shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 50, height: 50 } });
      const b = new shapes.standard.Rectangle({ position: { x: 200, y: 0 }, size: { width: 50, height: 50 } });
      const flow = new shapes.standard.Link({ source: { id: a.id }, target: { id: b.id } });
      const commentLink = new shapes.standard.Link({ source: { x: 100, y: 100 }, target: { id: flow.id } });
      graphStore.graph.addCells([a, b, flow, commentLink]);

      const commentLinkView = paper.findViewByModel(commentLink)!;
      expect(commentLinkView.el.style.visibility).not.toBe('hidden');
    });

    it('does not hide a chain of link-to-link connections', () => {
      const noPortalSelector: undefined = undefined;
      paper = createPaper(noPortalSelector);

      const a = new shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 50, height: 50 } });
      const b = new shapes.standard.Rectangle({ position: { x: 200, y: 0 }, size: { width: 50, height: 50 } });
      const flow = new shapes.standard.Link({ source: { id: a.id }, target: { id: b.id } });
      const first = new shapes.standard.Link({ source: { x: 0, y: 100 }, target: { id: flow.id } });
      const second = new shapes.standard.Link({ source: { x: 0, y: 200 }, target: { id: first.id } });
      graphStore.graph.addCells([a, b, flow, first, second]);

      const firstView = paper.findViewByModel(first)!;
      const secondView = paper.findViewByModel(second)!;
      expect(firstView.el.style.visibility).not.toBe('hidden');
      expect(secondView.el.style.visibility).not.toBe('hidden');
    });

    it('does not hide links between portal-less elements', () => {
      const noPortalSelector: undefined = undefined;
      paper = createPaper(noPortalSelector);

      const a = new shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 50, height: 50 } });
      const link = new shapes.standard.Link({ source: { id: a.id }, target: { x: 200, y: 100 } });
      graphStore.graph.addCells([a, link]);

      const linkView = paper.findViewByModel(link)!;
      expect(linkView.el.style.visibility).not.toBe('hidden');
    });

    it('treats link end with no view as not ready (private isElementReady)', () => {
      const noPortalSelector: undefined = undefined;
      paper = createPaper(noPortalSelector);

      const isElementReady = (paper as unknown as {
        isElementReady: (id: string | undefined) => boolean;
      }).isElementReady.bind(paper);

      // line 116: !elementId branch
      const noElementId: undefined = undefined;
      expect(isElementReady(noElementId)).toBe(false);
      // line 118: elementView is undefined branch
      expect(isElementReady('nonexistent-id')).toBe(false);
    });
  });
});
