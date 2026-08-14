/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { render, act, waitFor } from '@testing-library/react';
import type { dia } from '@joint/core';
import { GraphProvider } from '../../components';
import { Paper } from '../../components/paper/paper';
import type { PaperProps } from '../../components/paper/paper.types';
import type { CellRecord } from '../../types/cell.types';

const EMPTY_CELLS: readonly CellRecord[] = [];

function touchPanEvent(): dia.Event {
  return { type: 'touchmove' } as unknown as dia.Event;
}

function wheelPanEvent(): dia.Event {
  return { type: 'wheel' } as unknown as dia.Event;
}

// jsdom's mocked SVG matrix degenerates real transform math (all-zero CTM), so
// the paper's transform API is stubbed and the assertions target what the hook
// owns: clamping, yielding, and event filtering.
function stubPaperTransforms(paper: dia.Paper) {
  const state = { scale: 1, tx: 0, ty: 0 };
  // The getter/setter overloads defeat direct mock typing — cast the whole
  // implementation to the method type instead.
  jest
    .spyOn(paper, 'scale')
    .mockImplementation(
      (() => ({ sx: state.scale, sy: state.scale })) as unknown as dia.Paper['scale']
    );
  const scaleUniformAtPoint = jest
    .spyOn(paper, 'scaleUniformAtPoint')
    .mockImplementation((nextScale: number) => {
      state.scale = nextScale;
      return paper;
    });
  const translate = jest.spyOn(paper, 'translate').mockImplementation(
    ((tx?: number, ty?: number) => {
      if (tx === undefined || ty === undefined) return { tx: state.tx, ty: state.ty };
      state.tx = tx;
      state.ty = ty;
      return paper;
    }) as unknown as dia.Paper['translate']
  );
  return { state, scaleUniformAtPoint, translate };
}

async function renderPaper(props: Partial<PaperProps> = {}) {
  const paperRef: { current: dia.Paper | null } = { current: null };
  render(
    <GraphProvider initialCells={EMPTY_CELLS}>
      <Paper
        ref={(paper: dia.Paper | null) => {
          paperRef.current = paper;
        }}
        {...props}
      />
    </GraphProvider>
  );
  await waitFor(() => expect(paperRef.current).toBeTruthy());
  const paper = paperRef.current;
  if (!paper) throw new Error('Paper was not created.');
  return { paper, ...stubPaperTransforms(paper) };
}

describe('usePinchZoom (Paper zoomOnPinch)', () => {
  it('applies pinch samples as a clamped uniform scale by default', async () => {
    const { paper, state, scaleUniformAtPoint } = await renderPaper();

    act(() => paper.trigger('paper:pinch', touchPanEvent(), 10, 20, 2));
    expect(scaleUniformAtPoint).toHaveBeenCalledWith(2, { x: 10, y: 20 });
    expect(state.scale).toBe(2);

    act(() => paper.trigger('paper:pinch', touchPanEvent(), 10, 20, 2));
    expect(state.scale).toBe(4);

    // 4 × 2 = 8 exceeds the default upper bound of 5.
    act(() => paper.trigger('paper:pinch', touchPanEvent(), 10, 20, 2));
    expect(state.scale).toBe(5);
  });

  it('respects custom bounds', async () => {
    const { paper, state } = await renderPaper({ zoomOnPinch: { min: 0.5, max: 2 } });

    act(() => paper.trigger('paper:pinch', touchPanEvent(), 0, 0, 4));
    expect(state.scale).toBe(2);

    act(() => paper.trigger('paper:pinch', touchPanEvent(), 0, 0, 0.1));
    expect(state.scale).toBe(0.5);
  });

  it('is disabled with zoomOnPinch={false}', async () => {
    const { paper, scaleUniformAtPoint } = await renderPaper({ zoomOnPinch: false });

    act(() => paper.trigger('paper:pinch', touchPanEvent(), 10, 10, 2));
    expect(scaleUniformAtPoint).not.toHaveBeenCalled();
  });

  it('yields to an external paper:pinch subscriber', async () => {
    const { paper, state, scaleUniformAtPoint } = await renderPaper();
    const external = jest.fn();
    paper.on('paper:pinch', external);

    act(() => paper.trigger('paper:pinch', touchPanEvent(), 10, 10, 2));
    expect(external).toHaveBeenCalledTimes(1);
    expect(scaleUniformAtPoint).not.toHaveBeenCalled(); // the external handler owns zooming

    // Once the external subscriber is gone, the built-in takes over again.
    paper.off('paper:pinch', external);
    act(() => paper.trigger('paper:pinch', touchPanEvent(), 10, 10, 2));
    expect(state.scale).toBe(2);
  });

  it('yields to the onPaperPinch prop', async () => {
    const onPaperPinch = jest.fn();
    const { paper, scaleUniformAtPoint } = await renderPaper({ onPaperPinch });

    act(() => paper.trigger('paper:pinch', touchPanEvent(), 10, 10, 2));
    expect(onPaperPinch).toHaveBeenCalledTimes(1);
    expect(scaleUniformAtPoint).not.toHaveBeenCalled();
  });

  it('applies touch-sourced pan samples as a translation', async () => {
    const { paper, state } = await renderPaper();

    act(() => paper.trigger('paper:pan', touchPanEvent(), 10, 20));
    expect(state).toMatchObject({ tx: -10, ty: -20 });
  });

  it('ignores wheel-sourced pan events', async () => {
    const { paper, translate } = await renderPaper();

    act(() => paper.trigger('paper:pan', wheelPanEvent(), 10, 20));
    expect(translate).not.toHaveBeenCalled();
  });

  it('yields to an external paper:pan subscriber', async () => {
    const { paper, translate } = await renderPaper();
    const external = jest.fn();
    paper.on('paper:pan', external);

    act(() => paper.trigger('paper:pan', touchPanEvent(), 10, 20));
    expect(external).toHaveBeenCalledTimes(1);
    expect(translate).not.toHaveBeenCalled();
  });
});
