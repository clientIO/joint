/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { useCallback, useState } from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { mvc, type dia } from '@joint/core';
import { Paper } from '../paper';
import { GraphProvider } from '../../graph/graph-provider';
import { ELEMENT_MODEL_TYPE } from '../../../models/element-model';
import type { CellRecord } from '../../../types/cell.types';

const CELLS: readonly CellRecord[] = [
  {
    id: '1',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
  } as CellRecord,
];

const renderRectElement = () => <rect />;
const fakeEvent = {} as dia.Event;

interface HarnessProps {
  readonly setRef: (paper: dia.Paper | null) => void;
}

/**
 * Mounts a paper and resolves once the `dia.Paper` instance is available.
 * @param ui - Factory receiving a ref callback; returns the tree under test.
 * @returns The created paper.
 */
async function mountPaper(
  ui: (ref: (paper: dia.Paper | null) => void) => React.ReactElement
): Promise<{ paper: dia.Paper }> {
  let current: dia.Paper | null = null;
  const setRef = (paper: dia.Paper | null) => {
    if (paper) current = paper;
  };
  render(<GraphProvider initialCells={CELLS}>{ui(setRef)}</GraphProvider>);
  await waitFor(() => {
    expect(current).not.toBeNull();
  });
  return { paper: current as unknown as dia.Paper };
}

const clickTestId = (testId: string) =>
  act(() => {
    (document.querySelector(`[data-testid="${testId}"]`) as HTMLButtonElement).click();
  });

describe('Paper normalized event props', () => {
  it('fires a normalized handler with a context object', async () => {
    const onBlankContextMenu = jest.fn();
    const { paper } = await mountPaper((ref) => (
      <Paper
        ref={ref}
        style={{ width: 100, height: 100 }}
        renderElement={renderRectElement}
        onBlankContextMenu={onBlankContextMenu}
      />
    ));

    act(() => {
      paper.trigger('blank:contextmenu', fakeEvent, 10, 20);
    });

    expect(onBlankContextMenu).toHaveBeenCalledTimes(1);
    expect(onBlankContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({ paper, graph: paper.model, event: fakeEvent, x: 10, y: 20 })
    );
  });

  it('does NOT re-subscribe across unrelated re-renders when handlers are stable refs', async () => {
    const listenToSpy = jest.spyOn(mvc.Listener.prototype, 'listenTo');
    const bindCount = (eventName: string) =>
      listenToSpy.mock.calls.filter((call) => String(call[1]) === eventName).length;

    const handler = jest.fn();
    function Harness({ setRef }: Readonly<HarnessProps>) {
      const [, force] = useState(0);
      // eslint-disable-next-line sonarjs/no-nested-functions
      const rerender = () => force((n) => n + 1);
      // Stable reference across renders — this is the documented contract.
      const onBlankContextMenu = useCallback(handler, []);
      return (
        <>
          <button type="button" data-testid="rerender" onClick={rerender} />
          <Paper
            ref={setRef}
            style={{ width: 100, height: 100 }}
            renderElement={renderRectElement}
            onBlankContextMenu={onBlankContextMenu}
          />
        </>
      );
    }

    const { paper } = await mountPaper((ref) => <Harness setRef={ref} />);
    expect(bindCount('blank:contextmenu')).toBe(1);

    for (let index = 0; index < 3; index++) clickTestId('rerender');

    // Stable ref → no re-subscribe across unrelated re-renders.
    expect(bindCount('blank:contextmenu')).toBe(1);

    act(() => {
      paper.trigger('blank:contextmenu', fakeEvent, 0, 0);
    });
    expect(handler).toHaveBeenCalledTimes(1);

    listenToSpy.mockRestore();
  });

  it('re-subscribes and invokes the new handler when its reference changes', async () => {
    const first = jest.fn();
    const second = jest.fn();

    function Harness({ setRef }: Readonly<HarnessProps>) {
      const [useSecond, setUseSecond] = useState(false);
      const swap = () => setUseSecond(true);
      // Two distinct stable references; swapping changes the dependency.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const handler = useCallback(useSecond ? second : first, [useSecond]);
      return (
        <>
          <button type="button" data-testid="swap" onClick={swap} />
          <Paper
            ref={setRef}
            style={{ width: 100, height: 100 }}
            renderElement={renderRectElement}
            onBlankContextMenu={handler}
          />
        </>
      );
    }

    const { paper } = await mountPaper((ref) => <Harness setRef={ref} />);

    clickTestId('swap');
    act(() => {
      paper.trigger('blank:contextmenu', fakeEvent, 0, 0);
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('re-subscribes when a new handler key is added', async () => {
    const listenToSpy = jest.spyOn(mvc.Listener.prototype, 'listenTo');
    const bindCount = (eventName: string) =>
      listenToSpy.mock.calls.filter((call) => String(call[1]) === eventName).length;

    const ctxHandler = jest.fn();
    const clickHandler = jest.fn();
    function Harness({ setRef }: Readonly<HarnessProps>) {
      const [withExtra, setWithExtra] = useState(false);
      const addKey = () => setWithExtra(true);
      const onBlankContextMenu = useCallback(ctxHandler, []);
      const onBlankPointerClick = useCallback(clickHandler, []);
      return (
        <>
          <button type="button" data-testid="add-key" onClick={addKey} />
          <Paper
            ref={setRef}
            style={{ width: 100, height: 100 }}
            renderElement={renderRectElement}
            onBlankContextMenu={onBlankContextMenu}
            onBlankPointerClick={withExtra ? onBlankPointerClick : undefined}
          />
        </>
      );
    }

    await mountPaper((ref) => <Harness setRef={ref} />);
    expect(bindCount('blank:pointerclick')).toBe(0);

    clickTestId('add-key');

    // The added key activates → the subscription re-runs and binds it.
    expect(bindCount('blank:pointerclick')).toBe(1);
    listenToSpy.mockRestore();
  });

  it('documents the contract: a new inline handler re-subscribes every render', async () => {
    const listenToSpy = jest.spyOn(mvc.Listener.prototype, 'listenTo');
    const bindCount = (eventName: string) =>
      listenToSpy.mock.calls.filter((call) => String(call[1]) === eventName).length;

    function Harness({ setRef }: Readonly<HarnessProps>) {
      const [, force] = useState(0);
      // eslint-disable-next-line sonarjs/no-nested-functions
      const rerender = () => force((n) => n + 1);
      return (
        <>
          <button type="button" data-testid="rerender" onClick={rerender} />
          <Paper
            ref={setRef}
            style={{ width: 100, height: 100 }}
            renderElement={renderRectElement}
            // New reference every render → re-subscribes every render (by design).
            onBlankContextMenu={() => {}}
          />
        </>
      );
    }

    await mountPaper((ref) => <Harness setRef={ref} />);
    const afterMount = bindCount('blank:contextmenu');

    clickTestId('rerender');

    // Inline handler changed identity → one more bind. Stable refs avoid this.
    expect(bindCount('blank:contextmenu')).toBe(afterMount + 1);
    listenToSpy.mockRestore();
  });

  it('does NOT re-subscribe when only a non-event prop changes', async () => {
    const listenToSpy = jest.spyOn(mvc.Listener.prototype, 'listenTo');
    const bindCount = (eventName: string) =>
      listenToSpy.mock.calls.filter((call) => String(call[1]) === eventName).length;

    const handler = jest.fn();
    function Harness({ setRef }: Readonly<HarnessProps>) {
      const [grid, setGrid] = useState(5);
      // eslint-disable-next-line sonarjs/no-nested-functions
      const bumpGrid = () => setGrid((g) => g + 1);
      const onBlankContextMenu = useCallback(handler, []);
      return (
        <>
          <button type="button" data-testid="bump" onClick={bumpGrid} />
          <Paper
            ref={setRef}
            style={{ width: 100, height: 100 }}
            renderElement={renderRectElement}
            gridSize={grid}
            onBlankContextMenu={onBlankContextMenu}
          />
        </>
      );
    }

    await mountPaper((ref) => <Harness setRef={ref} />);
    expect(bindCount('blank:contextmenu')).toBe(1);

    clickTestId('bump');

    // A non-event prop (gridSize) changed → events must not re-subscribe.
    expect(bindCount('blank:contextmenu')).toBe(1);
    listenToSpy.mockRestore();
  });
});

/**
 * Resolves the `dia.ElementView` for the seeded cell once it is rendered.
 * @param paper - The paper instance.
 * @returns The element view for cell `'1'`.
 */
const elementView = (paper: dia.Paper): dia.ElementView => {
  const model = paper.model.getCell('1');
  return paper.findViewByModel(model) as dia.ElementView;
};

describe('Paper event context shapes', () => {
  it('delivers element pointer context (id, model, view, coords)', async () => {
    const onElementPointerClick = jest.fn();
    const { paper } = await mountPaper((ref) => (
      <Paper
        ref={ref}
        style={{ width: 100, height: 100 }}
        renderElement={renderRectElement}
        onElementPointerClick={onElementPointerClick}
      />
    ));
    const view = elementView(paper);

    act(() => {
      paper.trigger('element:pointerclick', view, fakeEvent, 5, 6);
    });

    expect(onElementPointerClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        model: view.model,
        view,
        paper,
        graph: paper.model,
        event: fakeEvent,
        x: 5,
        y: 6,
      })
    );
  });

  it('delivers cell-level pointer context for an element', async () => {
    const onCellPointerClick = jest.fn();
    const { paper } = await mountPaper((ref) => (
      <Paper
        ref={ref}
        style={{ width: 100, height: 100 }}
        renderElement={renderRectElement}
        onCellPointerClick={onCellPointerClick}
      />
    ));
    const view = elementView(paper);

    act(() => {
      paper.trigger('cell:pointerclick', view, fakeEvent, 1, 2);
    });

    expect(onCellPointerClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', model: view.model, view, x: 1, y: 2 })
    );
  });

  it('delivers hover context with event but no coords', async () => {
    const onElementMouseEnter = jest.fn();
    const { paper } = await mountPaper((ref) => (
      <Paper
        ref={ref}
        style={{ width: 100, height: 100 }}
        renderElement={renderRectElement}
        onElementMouseEnter={onElementMouseEnter}
      />
    ));
    const view = elementView(paper);

    act(() => {
      paper.trigger('element:mouseenter', view, fakeEvent);
    });

    const [[ctx]] = onElementMouseEnter.mock.calls;
    expect(ctx).toMatchObject({ id: '1', view, event: fakeEvent });
    expect(ctx).not.toHaveProperty('x');
  });

  it('delivers blank wheel context with delta', async () => {
    const onBlankMouseWheel = jest.fn();
    const { paper } = await mountPaper((ref) => (
      <Paper
        ref={ref}
        style={{ width: 100, height: 100 }}
        renderElement={renderRectElement}
        onBlankMouseWheel={onBlankMouseWheel}
      />
    ));

    act(() => {
      paper.trigger('blank:mousewheel', fakeEvent, 1, 2, 3);
    });

    expect(onBlankMouseWheel).toHaveBeenCalledWith(
      expect.objectContaining({ event: fakeEvent, x: 1, y: 2, delta: 3, paper, graph: paper.model })
    );
  });

  it('delivers paper-level resize context from raw native args', async () => {
    const onResize = jest.fn();
    const options = { source: 'test' };
    const { paper } = await mountPaper((ref) => (
      <Paper
        ref={ref}
        style={{ width: 100, height: 100 }}
        renderElement={renderRectElement}
        onResize={onResize}
      />
    ));

    act(() => {
      paper.trigger('resize', 800, 600, options);
    });

    expect(onResize).toHaveBeenCalledWith(
      expect.objectContaining({ width: 800, height: 600, options, paper, graph: paper.model })
    );
  });
});
