import { dia } from '@joint/core';
import { mapCellToAttributes } from '../cell-mapper';
import { ELEMENT_MODEL_TYPE } from '../../../models/element-model';
import { LINK_MODEL_TYPE } from '../../../models/link-model';
import { DEFAULT_CELL_NAMESPACE } from '../../../store/graph-store';
import type { DiaElementAttributes, DiaLinkAttributes } from '../../../types/cell.types';

function createGraph() {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

describe('mapCellToAttributes', () => {
  it('routes element-typed cells through element mapper and preserves id', () => {
    const graph = createGraph();
    const result = mapCellToAttributes(
      {
        id: 'el-1',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 1, y: 2 },
        size: { width: 5, height: 6 },
      } as DiaElementAttributes,
      graph,
    );

    expect(result.id).toBe('el-1');
    expect(result.type).toBe(ELEMENT_MODEL_TYPE);
  });

  it('routes link-typed cells through link mapper and preserves id', () => {
    const graph = createGraph();
    const result = mapCellToAttributes(
      {
        id: 'link-1',
        type: LINK_MODEL_TYPE,
        source: { id: 'a' },
        target: { id: 'b' },
      } as DiaLinkAttributes,
      graph,
    );

    expect(result.id).toBe('link-1');
    expect(result.type).toBe(LINK_MODEL_TYPE);
  });

  it('passes unrecognized cell types through verbatim (fallback)', () => {
    const graph = createGraph();
    const result = mapCellToAttributes(
      {
        id: 'custom-1',
        type: 'totally.Unknown.Type',
        foo: 'bar',
      } as unknown as DiaElementAttributes,
      graph,
    );

    expect(result).toEqual({
      id: 'custom-1',
      type: 'totally.Unknown.Type',
      foo: 'bar',
    });
  });

  it('passes cells without id through verbatim when type is unknown', () => {
    const graph = createGraph();
    const result = mapCellToAttributes(
      { type: 'totally.Unknown.Type' } as unknown as DiaElementAttributes,
      graph,
    );
    expect(result).toEqual({ type: 'totally.Unknown.Type' });
  });

  it('routes element-typed cells without id through element mapper', () => {
    const graph = createGraph();
    const result = mapCellToAttributes(
      {
        type: ELEMENT_MODEL_TYPE,
        position: { x: 0, y: 0 },
        size: { width: 1, height: 1 },
      } as DiaElementAttributes,
      graph,
    );
    expect(result.type).toBe(ELEMENT_MODEL_TYPE);
    expect(result.id).toBeUndefined();
  });

  it('routes link-typed cells without id through link mapper', () => {
    const graph = createGraph();
    const result = mapCellToAttributes(
      {
        type: LINK_MODEL_TYPE,
        source: { id: 'a' },
        target: { id: 'b' },
      } as DiaLinkAttributes,
      graph,
    );
    expect(result.type).toBe(LINK_MODEL_TYPE);
    expect(result.id).toBeUndefined();
  });
});
