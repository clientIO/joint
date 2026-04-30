/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { render, waitFor } from '@testing-library/react';
import { HTMLBox } from '../html-box';
import { paperRenderElementWrapper } from '../../utils/test-wrappers';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import type { CellRecord } from '../../types/cell.types';

const CELLS: readonly CellRecord[] = [
  {
    id: '1',
    type: ELEMENT_MODEL_TYPE,
    size: { width: 80, height: 40 },
  } as CellRecord,
];

describe('HTMLBox', () => {
  it('renders with default styles and jj-box class (measured mode)', async () => {
    const { container } = render(<HTMLBox>hello</HTMLBox>, {
      wrapper: paperRenderElementWrapper({
        graphProviderProps: { initialCells: CELLS },
      }),
    });
    await waitFor(() => {
      const div = container.querySelector('div.jj-box');
      expect(div).toBeTruthy();
      expect(div?.textContent).toBe('hello');
    });
  });

  it('merges a user-supplied className with the jj-box class', async () => {
    const { container } = render(<HTMLBox className="extra">hi</HTMLBox>, {
      wrapper: paperRenderElementWrapper({
        graphProviderProps: { initialCells: CELLS },
      }),
    });
    await waitFor(() => {
      expect(container.querySelector('div.jj-box.extra')).toBeTruthy();
    });
  });

  it('uses model geometry styles when useModelGeometry is true', async () => {
    const { container } = render(<HTMLBox useModelGeometry>model</HTMLBox>, {
      wrapper: paperRenderElementWrapper({
        graphProviderProps: { initialCells: CELLS },
      }),
    });
    await waitFor(() => {
      const div = container.querySelector('div.jj-box') as HTMLDivElement | null;
      expect(div).toBeTruthy();
      expect(div?.style.minWidth).toBe('');
    });
  });

  it('merges a user-supplied style object with defaults', async () => {
    const userStyle = { color: 'red' };
    const { container } = render(<HTMLBox style={userStyle}>style</HTMLBox>, {
      wrapper: paperRenderElementWrapper({
        graphProviderProps: { initialCells: CELLS },
      }),
    });
    await waitFor(() => {
      const div = container.querySelector('div.jj-box') as HTMLDivElement | null;
      expect(div?.style.color).toBe('red');
    });
  });
});
