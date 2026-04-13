/* eslint-disable unicorn/no-useless-undefined */
import { dia } from '@joint/core';
import { GraphStore } from '../graph-store';

describe('GraphStore clearView scheduling', () => {
  let graphStore: GraphStore;
  let mockPaper: dia.Paper;

  beforeEach(() => {
    graphStore = new GraphStore({});
    // Create a minimal mock paper — clearViewForElementAndLinks calls paper.findViewByModel
    // which returns undefined when no real paper views exist, causing early return
    mockPaper = {
      findViewByModel: () => undefined,
    } as unknown as dia.Paper;
  });

  afterEach(() => {
    graphStore.destroy(false);
  });

  it('should have clearViewForElementAndLinks method', () => {
    expect(typeof graphStore.clearViewForElementAndLinks).toBe('function');
  });

  it('should accept repeated clearViewForElementAndLinks calls without errors', () => {
    const element = new dia.Element({
      id: 'el1',
      type: 'ElementModel',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
    });
    graphStore.graph.addCell(element);

    expect(() => {
      graphStore.clearViewForElementAndLinks({ cellId: 'el1', paper: mockPaper });
      graphStore.clearViewForElementAndLinks({ cellId: 'el1', paper: mockPaper });
      graphStore.clearViewForElementAndLinks({ cellId: 'el1', paper: mockPaper });
    }).not.toThrow();
  });

  it('should accept clearViewForElementAndLinks with onValidateLink callback', () => {
    const element = new dia.Element({
      id: 'el1',
      type: 'ElementModel',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
    });
    graphStore.graph.addCell(element);

    const validator = jest.fn().mockReturnValue(true);

    expect(() => {
      graphStore.clearViewForElementAndLinks({
        cellId: 'el1',
        onValidateLink: validator,
        paper: mockPaper,
      });
    }).not.toThrow();
  });

  it('should handle clearView for elements with connected links', () => {
    const source = new dia.Element({
      id: 'source',
      type: 'ElementModel',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
    });
    const target = new dia.Element({
      id: 'target',
      type: 'ElementModel',
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

    graphStore.clearViewForElementAndLinks({ cellId: 'source', paper: mockPaper });

    expect(graphStore.graph.getCell('link1')).toBeDefined();
  });

  it('should handle non-existent cells gracefully', () => {
    expect(() => {
      graphStore.clearViewForElementAndLinks({ cellId: 'non-existent', paper: mockPaper });
    }).not.toThrow();
  });
});
