/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { render, waitFor } from '@testing-library/react';
import { HTMLHost } from '../html-host';
import { paperRenderElementWrapper } from '../../utils/test-wrappers';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import type { CellRecord } from '../../types/cell.types';

const SIZED_CELLS: readonly CellRecord[] = [
  {
    id: '1',
    type: ELEMENT_MODEL_TYPE,
    size: { width: 120, height: 60 },
  } as CellRecord,
];

describe('HTMLHost', () => {
  it('renders the measured frame by default', async () => {
    const { container } = render(<HTMLHost>measured</HTMLHost>, {
      wrapper: paperRenderElementWrapper({
        graphProviderProps: { initialCells: SIZED_CELLS },
      }),
    });

    await waitFor(() => {
      const foreignObject = container.querySelector('foreignObject');
      expect(foreignObject).toBeTruthy();
      const div = foreignObject?.querySelector('div');
      expect(div?.textContent).toBe('measured');
      expect(div?.style.position).toBe('static');
    });
  });

  it('uses element size from the model when useModelGeometry is true', async () => {
    const { container } = render(<HTMLHost useModelGeometry>static</HTMLHost>, {
      wrapper: paperRenderElementWrapper({
        graphProviderProps: { initialCells: SIZED_CELLS },
      }),
    });

    await waitFor(() => {
      const foreignObject = container.querySelector('foreignObject');
      expect(foreignObject?.getAttribute('width')).toBe('120');
      expect(foreignObject?.getAttribute('height')).toBe('60');
      const div = foreignObject?.querySelector('div') as HTMLDivElement | null;
      expect(div?.style.width).toBe('120px');
      expect(div?.style.height).toBe('60px');
    });
  });

  it('forwards extra div props (className, data-attrs) to the inner div', async () => {
    const { container } = render(
      <HTMLHost className="my-host" data-testid="inner">
        forwarded
      </HTMLHost>,
      {
        wrapper: paperRenderElementWrapper({
          graphProviderProps: { initialCells: SIZED_CELLS },
        }),
      }
    );

    await waitFor(() => {
      const div = container.querySelector('div.my-host') as HTMLDivElement | null;
      expect(div?.dataset.testid).toBe('inner');
    });
  });

  it('merges a user-supplied style with the static-position override (measured mode)', async () => {
    const userStyle = { color: 'green' };
    const { container } = render(<HTMLHost style={userStyle}>styled</HTMLHost>, {
      wrapper: paperRenderElementWrapper({
        graphProviderProps: { initialCells: SIZED_CELLS },
      }),
    });
    await waitFor(() => {
      const div = container.querySelector('foreignObject div') as HTMLDivElement | null;
      expect(div?.style.color).toBe('green');
      expect(div?.style.position).toBe('static');
    });
  });

  it('merges a user-supplied style when useModelGeometry is true', async () => {
    const userStyle = { color: 'blue' };
    const { container } = render(
      <HTMLHost useModelGeometry style={userStyle}>
        styled-static
      </HTMLHost>,
      {
        wrapper: paperRenderElementWrapper({
          graphProviderProps: { initialCells: SIZED_CELLS },
        }),
      }
    );
    await waitFor(() => {
      const div = container.querySelector('foreignObject div') as HTMLDivElement | null;
      expect(div?.style.color).toBe('blue');
      expect(div?.style.position).toBe('static');
    });
  });
});
