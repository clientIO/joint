import { dia } from '@joint/core';
import { GraphStore } from '../graph-store';

describe('GraphStore clearView scheduling', () => {
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

  it('should accept repeated scheduleClearView calls without errors', () => {
    const element = new dia.Element({
      id: 'el1',
      type: 'ReactElement',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
    });
    graphStore.graph.addCell(element);

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

    graphStore.scheduleClearView({ cellId: 'source' });

    expect(graphStore.graph.getCell('link1')).toBeDefined();
  });

  it('should handle non-existent cells gracefully', () => {
    expect(() => {
      graphStore.scheduleClearView({ cellId: 'non-existent' });
    }).not.toThrow();
  });
});
