import { ReactElement } from '../../../models/react-element';
import { createElements } from '../../create';
import { setElements } from '../cell-utilities';
import { dia } from '@joint/core';

// Mocks

describe('cell-utilities', () => {
  it('set elements', () => {
    const graph = new dia.Graph({}, { cellNamespace: { ReactElement } });
    const elements = createElements([{ id: '1' }, { id: '2' }]);
    setElements({ graph, elements });
    expect(graph.getElements().length).toBe(2);
    setElements({ graph, elements: [] });
    expect(graph.getElements().length).toBe(0);
    // add new again
    setElements({ graph, elements });
    expect(graph.getElements().length).toBe(2);

    // update

    const updatedElements = createElements([
      { id: '1', color: 'red' },
      { id: '2', color: 'blue' },
    ]);
    setElements({ graph, elements: updatedElements });
    expect(graph.getElements().length).toBe(2);
    expect(graph.getCell('1').get('color')).toBe('red');
    expect(graph.getCell('2').get('color')).toBe('blue');
  });
});
