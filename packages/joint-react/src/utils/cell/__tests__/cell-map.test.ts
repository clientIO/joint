import { dia } from '@joint/core';
import { GraphData } from '../cell-map';

describe('cell-map.ts', () => {
  it('should test cell map', () => {
    const graph = new dia.Graph();
    const element = new dia.Element({ type: 'element' });
    graph.addCell(element);

    const cellMap = new GraphData(graph);
    for (const [id, value] of cellMap) {
      console.log(value);
    }
  });
});
