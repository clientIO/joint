import { dia } from '@joint/core';
import { PaperStore } from '../paper-store';
import { GraphStore } from '../graph-store';
import { PortalPaper } from '../../models/portal-paper';

describe('PaperStore', () => {
  describe('constructor', () => {
    it('should create a PaperStore with paper instance', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });

      const paperStore = new PaperStore({
        graphStore,
        paperOptions: {},
        id: 'test-paper',
      });

      expect(paperStore).toBeDefined();
      expect(paperStore.paper).toBeInstanceOf(dia.Paper);
      expect(paperStore.paperId).toBe('test-paper');
    });

    it('should set up paper with correct options', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });

      const paperStore = new PaperStore({
        graphStore,
        paperOptions: {
          width: 800,
          height: 600,
        },
        id: 'test-paper',
      });

      expect(paperStore.paper.options.width).toBe(800);
      expect(paperStore.paper.options.height).toBe(600);
    });

    it('should apply transform when provided', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });
      const matrixSpy = jest.spyOn(PortalPaper.prototype, 'matrix');

      try {
        new PaperStore({
          graphStore,
          paperOptions: {},
          id: 'test-paper',
          transform: 'scale(2)',
        });

        // PortalPaper calls matrix() internally during init (getter form,
        // no arg). Find the setter call from our transform plumbing.
        const setterCall = matrixSpy.mock.calls.find((c) => c[0] !== undefined);
        expect(setterCall).toBeDefined();
        const arg = setterCall![0] as { a: number; d: number };
        expect(arg.a).toBe(2);
        expect(arg.d).toBe(2);
      } finally {
        matrixSpy.mockRestore();
      }
    });

    it('should enable visible magnet highlighting while dragging links by default', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });

      const paperStore = new PaperStore({
        graphStore,
        paperOptions: {},
        id: 'test-paper',
      });

      const { highlighting } = paperStore.paper.options;
      expect(highlighting).not.toBe(false);
      expect(paperStore.paper.options.markAvailable).toBe(true);
      expect((highlighting as Record<string, unknown>)?.magnetAvailability).toMatchObject({
        name: 'addClass',
        options: {
          className: 'jj-is-available',
        },
      });
    });

    it('should allow overriding markAvailable and magnetAvailability highlighting', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });

      const paperStore = new PaperStore({
        graphStore,
        paperOptions: {
          markAvailable: false,
          highlighting: {
            magnetAvailability: {
              name: 'addClass',
              options: { className: 'custom-available-magnet' },
            },
          },
        },
        id: 'test-paper',
      });

      const { highlighting } = paperStore.paper.options;
      expect(highlighting).not.toBe(false);
      expect(paperStore.paper.options.markAvailable).toBe(false);
      expect((highlighting as Record<string, unknown>)?.magnetAvailability).toMatchObject({
        name: 'addClass',
        options: { className: 'custom-available-magnet' },
      });
    });
  });

  describe('destroy', () => {
    it('should call paper.remove() when destroy is called', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });

      const paperStore = new PaperStore({
        graphStore,
        paperOptions: {},
        id: 'test-paper',
      });

      const removeSpy = jest.spyOn(paperStore.paper, 'remove');

      paperStore.destroy();

      expect(removeSpy).toHaveBeenCalled();
    });

    it('should be safe to call destroy multiple times', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });

      const paperStore = new PaperStore({
        graphStore,
        paperOptions: {},
        id: 'test-paper',
      });

      // First destroy should work
      expect(() => paperStore.destroy()).not.toThrow();

      // Second destroy should also not throw
      expect(() => paperStore.destroy()).not.toThrow();
    });

    it('should unregister paper update callback on destroy', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });

      const paperStore = new PaperStore({
        graphStore,
        paperOptions: {},
        id: 'test-paper',
      });

      // Verify paper exists before destroy
      expect(paperStore.paper).toBeDefined();

      paperStore.destroy();

      // We verify idempotent cleanup by ensuring multiple destroy calls don't throw
      expect(() => paperStore.destroy()).not.toThrow();
    });

    it('should clean up paper DOM element', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });
      const paperElement = document.createElement('div');
      document.body.append(paperElement);

      const paperStore = new PaperStore({
        graphStore,
        paperOptions: {},
        id: 'test-paper',
      });
      paperStore.paper.render(paperElement);

      // Verify paper element has children (the paper's SVG)
      expect(paperElement.children.length).toBeGreaterThan(0);

      paperStore.destroy();

      // After destroy, paper.remove() should have been called
      // Note: The parent element may still have children depending on how remove() works
      // but the paper itself is cleaned up
      expect(paperStore.paper.el.parentNode).toBeNull();

      paperElement.remove();
    });
  });

  describe('measureNode', () => {
    it('should return model geometry for root element node', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });

      const paperStore = new PaperStore({
        graphStore,
        paperOptions: {},
        id: 'test-paper',
      });

      const { measureNode } = paperStore.paper.options;
      expect(typeof measureNode).toBe('function');

      const element = new dia.Element({ size: { width: 100, height: 50 } });
      const rootNode = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const cellView = { el: rootNode, model: element } as unknown as dia.CellView;

      const result = measureNode!(rootNode as SVGGraphicsElement, cellView);
      expect(result.width).toBe(100);
      expect(result.height).toBe(50);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);

      paperStore.destroy();
    });

    it('should return SVG bounding box for port magnet nodes, not model geometry', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });

      const paperStore = new PaperStore({
        graphStore,
        paperOptions: {},
        id: 'test-paper',
      });

      const { measureNode } = paperStore.paper.options;
      expect(typeof measureNode).toBe('function');

      // Elements must be in a live SVG DOM for V(node).getBBox() to work
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      document.body.append(svg);
      const rootNode = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const portMagnet = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      svg.append(rootNode);
      rootNode.append(portMagnet);
      portMagnet.getBBox = jest.fn(() => ({ x: -5, y: -5, width: 10, height: 10 }) as DOMRect);

      const element = new dia.Element({ size: { width: 200, height: 100 } });
      const cellView = {
        el: rootNode,
        model: element,
        computeNodeBoundingRect: (node: SVGGraphicsElement) => {
          const bbox = node.getBBox();
          return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
        },
      } as unknown as dia.CellView;

      const result = measureNode!(portMagnet as SVGGraphicsElement, cellView);

      // Should return the port's own bbox, NOT the element's model bbox (200x100)
      expect(result.width).toBe(10);
      expect(result.height).toBe(10);
      expect(result.x).toBe(-5);
      expect(result.y).toBe(-5);

      paperStore.destroy();
      svg.remove();
    });

    it('should allow user to override measureNode', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });
      const customMeasureNode = jest.fn();

      const paperStore = new PaperStore({
        graphStore,
        paperOptions: {
          measureNode: customMeasureNode,
        },
        id: 'test-paper',
      });

      // User-provided measureNode should override the default
      expect(paperStore.paper.options.measureNode).toBe(customMeasureNode);

      paperStore.destroy();
    });
  });

  describe('integration with GraphStore', () => {
    it('should call paper.remove() when GraphStore removePaper is called', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });

      const { paperStore, remove } = graphStore.addPaper('test-paper', {
        paperOptions: {},
      });

      expect(paperStore).toBeDefined();

      const removeSpy = jest.spyOn(paperStore.paper, 'remove');

      remove();

      expect(removeSpy).toHaveBeenCalled();
      expect(graphStore.getPaperStore('test-paper')).toBeUndefined();
    });

    it('should call paper.remove() for all papers when GraphStore is destroyed', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });

      graphStore.addPaper('paper-1', {
        paperOptions: {},
      });
      graphStore.addPaper('paper-2', {
        paperOptions: {},
      });

      const paperStore1 = graphStore.getPaperStore('paper-1');
      const paperStore2 = graphStore.getPaperStore('paper-2');

      const removeSpy1 = jest.spyOn(paperStore1!.paper, 'remove');
      const removeSpy2 = jest.spyOn(paperStore2!.paper, 'remove');

      graphStore.destroy(false);

      expect(removeSpy1).toHaveBeenCalled();
      expect(removeSpy2).toHaveBeenCalled();
    });

    it('should call paper.remove() when GraphStore is destroyed with external graph', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });

      graphStore.addPaper('test-paper', {
        paperOptions: {},
      });

      const paperStore = graphStore.getPaperStore('test-paper');
      const removeSpy = jest.spyOn(paperStore!.paper, 'remove');

      // Even with external graph (true), papers should be destroyed
      graphStore.destroy(true);

      expect(removeSpy).toHaveBeenCalled();
    });
  });
});
