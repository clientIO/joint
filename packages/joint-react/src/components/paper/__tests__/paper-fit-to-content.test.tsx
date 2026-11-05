/* eslint-disable react-perf/jsx-no-new-function-as-prop -- test-only ref callbacks. */
import { act, render, waitFor } from '@testing-library/react';
import { dia } from '@joint/core';
import { Paper } from '../paper';
import type { PaperProps } from '../paper.types';
import { GraphProvider } from '../../graph/graph-provider';
import { ELEMENT_MODEL_TYPE } from '../../../mvc/element-model';
import type { CellRecord } from '../../../types/cell.types';

const CELLS: readonly CellRecord[] = [
  { id: 'a', type: ELEMENT_MODEL_TYPE, position: { x: 0, y: 0 }, size: { width: 50, height: 50 } } as CellRecord,
];

const DEFAULT_FIT = { useModelGeometry: true, horizontalAlign: 'middle', verticalAlign: 'middle' };

// Nothing measures it, so the element settles once the paper rendered it.
const renderRect = () => <rect />;

const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

async function mountPaper(props: PaperProps) {
  let current: dia.Paper | null = null;
  const tree = (paperProps: PaperProps) => (
    <GraphProvider initialCells={CELLS}>
      <Paper
        ref={(paper) => {
          if (paper) current = paper;
        }}
        renderElement={renderRect}
        {...paperProps}
      />
    </GraphProvider>
  );
  const { rerender } = render(tree(props));
  await waitFor(() => expect(current).not.toBeNull());
  await settle();
  return {
    paper: current as unknown as dia.Paper,
    update: async (nextProps: PaperProps) => {
      rerender(tree(nextProps));
      await settle();
    },
  };
}

describe('<Paper fitToContent />', () => {
  let fit: jest.SpyInstance;

  beforeEach(() => {
    fit = jest.spyOn(dia.Paper.prototype, 'transformToFitContent');
  });

  afterEach(() => {
    fit.mockRestore();
  });

  it('does not fit without the prop', async () => {
    await mountPaper({});
    expect(fit).not.toHaveBeenCalled();
  });

  it('fits centered on model geometry after the first measurement', async () => {
    await mountPaper({ fitToContent: true });
    await waitFor(() => expect(fit).toHaveBeenCalled());
    expect(fit.mock.calls[0][0]).toMatchObject(DEFAULT_FIT);
  });

  it('merges the options over the defaults', async () => {
    await mountPaper({ fitToContent: { padding: 40, verticalAlign: 'top' } });
    await waitFor(() => expect(fit).toHaveBeenCalled());
    expect(fit.mock.calls[0][0]).toMatchObject({
      ...DEFAULT_FIT,
      padding: 40,
      verticalAlign: 'top',
    });
  });

  it('does not re-fit on a re-render with an equal inline object', async () => {
    const { update } = await mountPaper({ fitToContent: { padding: 40 } });
    await waitFor(() => expect(fit).toHaveBeenCalled());
    fit.mockClear();
    await update({ fitToContent: { padding: 40 } });
    expect(fit).not.toHaveBeenCalled();
  });

  it('does not re-fit when an element moves', async () => {
    const { paper } = await mountPaper({ fitToContent: true });
    await waitFor(() => expect(fit).toHaveBeenCalled());
    fit.mockClear();
    act(() => {
      (paper.model.getCell('a') as dia.Element).position(500, 500);
    });
    await settle();
    expect(fit).not.toHaveBeenCalled();
  });

  it('fits when the prop is turned on after mount', async () => {
    const { update } = await mountPaper({});
    expect(fit).not.toHaveBeenCalled();
    await update({ fitToContent: true });
    await waitFor(() => expect(fit).toHaveBeenCalled());
  });

  it('fits again after a graph reset', async () => {
    const { paper } = await mountPaper({ fitToContent: true });
    await waitFor(() => expect(fit).toHaveBeenCalled());
    fit.mockClear();
    act(() => {
      paper.model.resetCells([
        { id: 'b', type: ELEMENT_MODEL_TYPE, position: { x: 10, y: 10 }, size: { width: 20, height: 20 } },
      ]);
    });
    await waitFor(() => expect(fit).toHaveBeenCalled());
  });

  it('leaves the viewport to `transform` when both are set', async () => {
    await mountPaper({ fitToContent: true, transform: 'scale(0.5)' });
    expect(fit).not.toHaveBeenCalled();
  });

  it('does not forward the prop to the paper options', async () => {
    const { paper } = await mountPaper({ fitToContent: true });
    expect(paper.options).not.toHaveProperty('fitToContent');
  });
});
