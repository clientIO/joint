import { dia } from '@joint/core';
import { PaperStore } from '../paper-store';
import { GraphStore } from '../graph-store';

describe('PaperStore', () => {
  describe('constructor', () => {
    it('should create a PaperStore with paper instance', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });
      const paperElement = document.createElement('div');

      const paperStore = new PaperStore({
        graphStore,
        paperElement,
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
      const paperElement = document.createElement('div');

      const paperStore = new PaperStore({
        graphStore,
        paperElement,
        paperOptions: {
          width: 800,
          height: 600,
        },
        id: 'test-paper',
      });

      expect(paperStore.paper.options.width).toBe(800);
      expect(paperStore.paper.options.height).toBe(600);
    });

    it('should apply scale when provided', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });
      const paperElement = document.createElement('div');

      const paperStore = new PaperStore({
        graphStore,
        paperElement,
        paperOptions: {},
        id: 'test-paper',
        scale: 2,
      });

      const currentScale = paperStore.paper.scale();
      expect(currentScale.sx).toBe(2);
      expect(currentScale.sy).toBe(2);
    });
  });

  describe('destroy', () => {
    it('should call paper.remove() when destroy is called', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });
      const paperElement = document.createElement('div');

      const paperStore = new PaperStore({
        graphStore,
        paperElement,
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
      const paperElement = document.createElement('div');

      const paperStore = new PaperStore({
        graphStore,
        paperElement,
        paperOptions: {},
        id: 'test-paper',
      });

      // First destroy should work
      expect(() => paperStore.destroy()).not.toThrow();

      // Second destroy should also not throw (unregisterPaperUpdate is undefined now)
      expect(() => paperStore.destroy()).not.toThrow();
    });

    it('should unregister paper update callback on destroy', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });
      const paperElement = document.createElement('div');

      const paperStore = new PaperStore({
        graphStore,
        paperElement,
        paperOptions: {},
        id: 'test-paper',
      });

      // Verify paper exists before destroy
      expect(paperStore.paper).toBeDefined();

      paperStore.destroy();

      // The unregisterPaperUpdate is set to undefined after calling
      // We verify this by ensuring multiple destroy calls don't throw
      expect(() => paperStore.destroy()).not.toThrow();
    });

    it('should clean up paper DOM element', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });
      const paperElement = document.createElement('div');
      document.body.append(paperElement);

      const paperStore = new PaperStore({
        graphStore,
        paperElement,
        paperOptions: {},
        id: 'test-paper',
      });

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

  describe('getPortId', () => {
    it('should generate unique port ID from cell and port IDs', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });
      const paperElement = document.createElement('div');

      const paperStore = new PaperStore({
        graphStore,
        paperElement,
        paperOptions: {},
        id: 'test-paper',
      });

      const portId = paperStore.getPortId('cell-1', 'port-a');
      expect(portId).toBe('cell-1-port-a');
    });
  });

  describe('getLinkLabelId', () => {
    it('should generate unique link label ID from link ID and index', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });
      const paperElement = document.createElement('div');

      const paperStore = new PaperStore({
        graphStore,
        paperElement,
        paperOptions: {},
        id: 'test-paper',
      });

      const labelId = paperStore.getLinkLabelId('link-1', 0);
      expect(labelId).toBe('link-1-label-0');

      const labelId2 = paperStore.getLinkLabelId('link-1', 2);
      expect(labelId2).toBe('link-1-label-2');
    });
  });

  describe('integration with GraphStore', () => {
    it('should call paper.remove() when GraphStore removePaper is called', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });
      const paperElement = document.createElement('div');

      const cleanup = graphStore.addPaper('test-paper', {
        paperElement,
        paperOptions: {},
      });

      const paperStore = graphStore.getPaperStore('test-paper');
      expect(paperStore).toBeDefined();

      const removeSpy = jest.spyOn(paperStore!.paper, 'remove');

      cleanup();

      expect(removeSpy).toHaveBeenCalled();
      expect(graphStore.getPaperStore('test-paper')).toBeUndefined();
    });

    it('should call paper.remove() for all papers when GraphStore is destroyed', () => {
      const graph = new dia.Graph();
      const graphStore = new GraphStore({ graph });
      const paperElement1 = document.createElement('div');
      const paperElement2 = document.createElement('div');

      graphStore.addPaper('paper-1', {
        paperElement: paperElement1,
        paperOptions: {},
      });
      graphStore.addPaper('paper-2', {
        paperElement: paperElement2,
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
      const paperElement = document.createElement('div');

      graphStore.addPaper('test-paper', {
        paperElement,
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
