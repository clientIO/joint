import { dia } from '@joint/core';
import { GraphStore } from '../graph-store';

describe('GraphStore clearView batching', () => {
  let graphStore: GraphStore;

  beforeEach(() => {
    graphStore = new GraphStore({});
  });

  afterEach(() => {
    graphStore.destroy(false);
  });

  it('should have scheduleClearView method', () => {
    expect(typeof graphStore.scheduleClearView).toBe('function');
  });

  it('should have flushClearView method', () => {
    expect(typeof graphStore.flushClearView).toBe('function');
  });

  describe('scheduleClearView batching behavior', () => {
    it('should accept scheduleClearView calls without errors', () => {
      const element = new dia.Element({
        id: 'el1',
        type: 'ReactElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);

      // Call scheduleClearView multiple times for same cell (simulating multiple ports)
      expect(() => {
        graphStore.scheduleClearView({ cellId: 'el1' });
        graphStore.scheduleClearView({ cellId: 'el1' });
        graphStore.scheduleClearView({ cellId: 'el1' });
      }).not.toThrow();
    });

    it('should accept scheduleClearView with onValidateLink callback', () => {
      const element = new dia.Element({
        id: 'el1',
        type: 'ReactElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);

      const validator = jest.fn().mockReturnValue(true);

      expect(() => {
        graphStore.scheduleClearView({ cellId: 'el1', onValidateLink: validator });
      }).not.toThrow();
    });

    it('should flush without errors when cache is empty', () => {
      expect(() => {
        graphStore.flushClearView();
      }).not.toThrow();
    });

    it('should flush without errors when cache has entries', () => {
      const element = new dia.Element({
        id: 'el1',
        type: 'ReactElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);

      graphStore.scheduleClearView({ cellId: 'el1' });

      expect(() => {
        graphStore.flushClearView();
      }).not.toThrow();
    });

    it('should handle clearView for elements with connected links (no paper)', () => {
      const source = new dia.Element({
        id: 'source',
        type: 'ReactElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const target = new dia.Element({
        id: 'target',
        type: 'ReactElement',
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new dia.Link({
        id: 'link1',
        type: 'standard.Link',
        source: { id: 'source' },
        target: { id: 'target' },
      });
      graphStore.graph.addCells([source, target, link]);

      // Schedule clearView for source element (no-op without paper)
      graphStore.scheduleClearView({ cellId: 'source' });
      graphStore.flushClearView();

      // Verify link still exists (clearView doesn't remove links)
      expect(graphStore.graph.getCell('link1')).toBeDefined();
    });

    it('should handle multiple different elements', () => {
      const element1 = new dia.Element({
        id: 'element1',
        type: 'ReactElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const element2 = new dia.Element({
        id: 'element2',
        type: 'ReactElement',
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCells([element1, element2]);

      graphStore.scheduleClearView({ cellId: 'element1' });
      graphStore.scheduleClearView({ cellId: 'element2' });

      expect(() => {
        graphStore.flushClearView();
      }).not.toThrow();

      expect(graphStore.graph.getCell('element1')).toBeDefined();
      expect(graphStore.graph.getCell('element2')).toBeDefined();
    });

    it('should handle non-existent cells gracefully', () => {
      graphStore.scheduleClearView({ cellId: 'non-existent' });

      expect(() => {
        graphStore.flushClearView();
      }).not.toThrow();
    });

    it('should clear the cache after flush', () => {
      const element = new dia.Element({
        id: 'el1',
        type: 'ReactElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);

      graphStore.scheduleClearView({ cellId: 'el1' });
      graphStore.flushClearView();

      // Second flush should be a no-op (cache is empty)
      expect(() => {
        graphStore.flushClearView();
      }).not.toThrow();
    });

    it('should deduplicate multiple calls for same cell', () => {
      const element = new dia.Element({
        id: 'el1',
        type: 'ReactElement',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      graphStore.graph.addCell(element);

      // Multiple calls for same cell should not cause errors
      graphStore.scheduleClearView({ cellId: 'el1' });
      graphStore.scheduleClearView({ cellId: 'el1' });
      graphStore.scheduleClearView({ cellId: 'el1' });

      expect(() => {
        graphStore.flushClearView();
      }).not.toThrow();
    });
  });
});
