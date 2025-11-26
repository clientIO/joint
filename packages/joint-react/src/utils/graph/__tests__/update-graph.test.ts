import { dia, shapes } from '@joint/core';
import { updateCell, updateGraph } from '../update-graph';

describe('update-graph', () => {
  let graph: dia.Graph;

  beforeEach(() => {
    graph = new dia.Graph({}, { cellNamespace: shapes });
  });

  describe('updateCell', () => {
    it('should add new cell to graph', () => {
      const newCell = {
        id: '1',
        type: 'standard.Rectangle',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      };

      updateCell({ graph, newCell });

      const cell = graph.getCell('1');
      expect(cell).toBeDefined();
      expect(cell?.get('position')).toEqual({ x: 10, y: 20 });
      expect(cell?.get('size')).toEqual({ width: 100, height: 50 });
    });

    it('should update existing cell', () => {
      const element = new shapes.standard.Rectangle({
        id: '1',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });
      graph.addCell(element);

      const newCell = {
        id: '1',
        type: 'standard.Rectangle',
        position: { x: 30, y: 40 },
        size: { width: 200, height: 100 },
      };

      updateCell({ graph, newCell });

      const cell = graph.getCell('1');
      expect(cell?.get('position')).toEqual({ x: 30, y: 40 });
      expect(cell?.get('size')).toEqual({ width: 200, height: 100 });
    });

    it('should update link source and target', () => {
      const link = new shapes.standard.Link({
        id: 'link-1',
        source: { id: 'a' },
        target: { id: 'b' },
      });
      graph.addCell(link);

      const newLink = {
        id: 'link-1',
        type: 'standard.Link',
        source: { id: 'c' },
        target: { id: 'd' },
      };

      updateCell({ graph, newCell: newLink });

      const updatedLink = graph.getCell('link-1') as dia.Link;
      expect(updatedLink.source().id).toBe('c');
      expect(updatedLink.target().id).toBe('d');
    });

    it('should replace cell when type changes', () => {
      const element = new shapes.standard.Rectangle({
        id: '1',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });
      graph.addCell(element);

      const newCell = {
        id: '1',
        type: 'standard.Circle',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 100 },
      };

      updateCell({ graph, newCell });

      const cell = graph.getCell('1');
      expect(cell?.get('type')).toBe('standard.Circle');
    });

    it('should not update if id is missing', () => {
      const newCell = {
        type: 'standard.Rectangle',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      } as unknown as dia.Cell.JSON;

      updateCell({ graph, newCell });

      expect(graph.getCells().length).toBe(0);
    });
  });

  describe('updateGraph', () => {
    it('should add new elements to graph', () => {
      const cells = [
        {
          id: '1',
          type: 'standard.Rectangle',
          position: { x: 10, y: 20 },
          size: { width: 100, height: 50 },
        },
        {
          id: '2',
          type: 'standard.Circle',
          position: { x: 50, y: 60 },
          size: { width: 80, height: 80 },
        },
      ];

      updateGraph({ graph, cells, isLink: false });

      expect(graph.getElements().length).toBe(2);
      expect(graph.getCell('1')).toBeDefined();
      expect(graph.getCell('2')).toBeDefined();
    });

    it('should remove elements not in new cells', () => {
      const element1 = new shapes.standard.Rectangle({
        id: '1',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });
      const element2 = new shapes.standard.Rectangle({
        id: '2',
        position: { x: 50, y: 60 },
        size: { width: 100, height: 50 },
      });
      graph.addCell([element1, element2]);

      const cells = [
        {
          id: '1',
          type: 'standard.Rectangle',
          position: { x: 10, y: 20 },
          size: { width: 100, height: 50 },
        },
      ];

      updateGraph({ graph, cells, isLink: false });

      expect(graph.getElements().length).toBe(1);
      expect(graph.getCell('1')).toBeDefined();
      expect(graph.getCell('2')).toBeUndefined();
    });

    it('should update existing elements', () => {
      const element = new shapes.standard.Rectangle({
        id: '1',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });
      graph.addCell(element);

      const cells = [
        {
          id: '1',
          type: 'standard.Rectangle',
          position: { x: 30, y: 40 },
          size: { width: 200, height: 100 },
        },
      ];

      updateGraph({ graph, cells, isLink: false });

      const updated = graph.getCell('1');
      expect(updated?.get('position')).toEqual({ x: 30, y: 40 });
      expect(updated?.get('size')).toEqual({ width: 200, height: 100 });
    });

    it('should handle links', () => {
      const cells = [
        {
          id: 'link-1',
          type: 'standard.Link',
          source: { id: 'a' },
          target: { id: 'b' },
        },
      ];

      updateGraph({ graph, cells, isLink: true });

      expect(graph.getLinks().length).toBe(1);
      const link = graph.getCell('link-1') as dia.Link;
      expect(link.source().id).toBe('a');
      expect(link.target().id).toBe('b');
    });

    it('should remove links not in new cells', () => {
      const link1 = new shapes.standard.Link({
        id: 'link-1',
        source: { id: 'a' },
        target: { id: 'b' },
      });
      const link2 = new shapes.standard.Link({
        id: 'link-2',
        source: { id: 'c' },
        target: { id: 'd' },
      });
      graph.addCell([link1, link2]);

      const cells = [
        {
          id: 'link-1',
          type: 'standard.Link',
          source: { id: 'a' },
          target: { id: 'b' },
        },
      ];

      updateGraph({ graph, cells, isLink: true });

      expect(graph.getLinks().length).toBe(1);
      expect(graph.getCell('link-1')).toBeDefined();
      expect(graph.getCell('link-2')).toBeUndefined();
    });
  });
});
