import {
  selectElementPosition,
  selectElementSize,
  selectElementAngle,
  selectElementData,
  selectCellId,
  selectCellType,
  selectCellParent,
} from '../cell-selectors';
import type {
  CellRecord,
  Computed,
  ElementRecord,
} from '../../types/cell.types';

describe('cell-selectors', () => {
  const element: Computed<ElementRecord<{ label: string }>> = {
    id: 'el-1',
    type: 'element',
    position: { x: 10, y: 20 },
    size: { width: 30, height: 40 },
    angle: 90,
    data: { label: 'hello' },
  };

  it('selectElementPosition returns position slice', () => {
    expect(selectElementPosition(element)).toBe(element.position);
  });

  it('selectElementSize returns size slice', () => {
    expect(selectElementSize(element)).toBe(element.size);
  });

  it('selectElementAngle returns angle slice', () => {
    expect(selectElementAngle(element)).toBe(90);
  });

  it('selectElementData returns typed data slice', () => {
    const data = selectElementData<{ label: string }>(element);
    expect(data).toEqual({ label: 'hello' });
  });

  it('selectCellId returns id', () => {
    expect(selectCellId(element)).toBe('el-1');
  });

  it('selectCellType returns type', () => {
    expect(selectCellType(element)).toBe('element');
  });

  it('selectCellParent returns parent (string)', () => {
    const child = {
      ...element,
      parent: 'parent-1',
    } as Computed<CellRecord> & { parent: string };
    expect(selectCellParent(child)).toBe('parent-1');
  });

  it('selectCellParent returns undefined when no parent', () => {
    expect(selectCellParent(element)).toBeUndefined();
  });
});
