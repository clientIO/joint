import { dia } from '@joint/core';
import { createStoreData } from '../create-store-data';

describe('create-store-data', () => {
  it('should handle proper data insertion', () => {
    const graph = new dia.Graph();
    const storeData = createStoreData();
    const element = new dia.Element({
      type: 'standard.Rectangle',
      id: 'element1',
      x: 10,
    });
    graph.addCell(element);
    expect(storeData.dataRef.elements.length).toBe(0);
    storeData.updateStore(graph);
    expect(storeData.dataRef.elements.length).toBe(1);
  });
  it('should handle proper data update', () => {
    const graph = new dia.Graph();
    const storeData = createStoreData();
    const element = new dia.Element({
      type: 'standard.Rectangle',
      id: 'element1',
      position: { x: 10, y: 20 },
    });
    graph.addCell(element);
    expect(storeData.dataRef.elements.length).toBe(0);
    storeData.updateStore(graph);
    expect(storeData.dataRef.elements.length).toBe(1);
    expect(storeData.dataRef.elements.find((element_) => element_.id === 'element1')?.x).toBe(10);

    const updatedElement = new dia.Element({
      type: 'standard.Rectangle',
      id: 'element1',
      position: { x: 30, y: 40 },
    });

    graph.resetCells([updatedElement]);
    expect(storeData.dataRef.elements.length).toBe(1);
    storeData.updateStore(graph);
    expect(storeData.dataRef.elements.find((element_) => element_.id === 'element1')?.x).toBe(30);
  });
  it('should handle proper data deletion', () => {
    const graph = new dia.Graph();
    const storeData = createStoreData();
    const element = new dia.Element({
      type: 'standard.Rectangle',
      id: 'element1',
      x: 10,
    });
    graph.addCell(element);
    expect(storeData.dataRef.elements.length).toBe(0);
    storeData.updateStore(graph);
    expect(storeData.dataRef.elements.length).toBe(1);
    graph.removeCells([element]);
    expect(storeData.dataRef.elements.length).toBe(1);
    storeData.updateStore(graph);
    expect(storeData.dataRef.elements.length).toBe(0);
  });
});
