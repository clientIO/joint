import { CellMap } from '../cell-map';

describe('cell-map', () => {
  it('should test cell map and wrapping back to array', () => {
    const cellMap = new CellMap();
    cellMap.set(0, { id: 0 });
    cellMap.set(1, { id: 1 });
    expect(cellMap.get(0)).toEqual({ id: 0 });
    expect(cellMap.get(1)).toEqual({ id: 1 });
    const cellArray = cellMap.map((items) => items);
    expect(cellArray).toHaveLength(2);
    expect(cellArray[0]).toEqual({ id: 0 });
    expect(cellArray[1]).toEqual({ id: 1 });
  });
  it('should test cell map and wrapping back to array with constructor', () => {
    const cellMap = new CellMap([
      [0, { id: 0 }],
      [1, { id: 1 }],
    ]);
    expect(cellMap.get(0)).toEqual({ id: 0 });
    expect(cellMap.get(1)).toEqual({ id: 1 });
    const cellArray = cellMap.map((items) => items);
    expect(cellArray).toHaveLength(2);
    expect(cellArray[0]).toEqual({ id: 0 });
    expect(cellArray[1]).toEqual({ id: 1 });
  });
});
