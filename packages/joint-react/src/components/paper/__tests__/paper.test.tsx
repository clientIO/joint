/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { useEffect, useRef } from 'react';
import { render, waitFor } from '@testing-library/react';
import type { dia } from '@joint/core';
import { Paper } from '../paper';
import { GraphProvider } from '../../graph/graph-provider';
import { ELEMENT_MODEL_TYPE } from '../../../mvc/element-model';
import type { CellRecord } from '../../../types/cell.types';

const CELLS: readonly CellRecord[] = [
  {
    id: '1',
    type: ELEMENT_MODEL_TYPE,
    size: { width: 50, height: 50 },
  } as CellRecord,
];

const renderRectElement = () => <rect />;

describe('Paper', () => {
  it('falls back to style.width / style.height when width / height props are omitted', async () => {
    const { container } = render(
      <GraphProvider initialCells={CELLS}>
        <Paper style={{ width: 200, height: 150 }} renderElement={renderRectElement} />
      </GraphProvider>
    );
    // Paper host div should exist with applied style.
    await waitFor(() => {
      const host = container.querySelector('div') as HTMLDivElement | null;
      expect(host).toBeTruthy();
      // svg child rendered → paper successfully created with resolved dims
      expect(container.querySelector('svg')).toBeTruthy();
    });
  });

  it('renders paper without explicit width/height (style undefined branch)', async () => {
    const { container } = render(
      <GraphProvider initialCells={CELLS}>
        <Paper renderElement={renderRectElement} />
      </GraphProvider>
    );
    await waitFor(() => {
      expect(container.querySelector('svg')).toBeTruthy();
    });
  });

  it('forwards the paper instance through ref via useImperativeHandle', async () => {
    const refHolder: { current: dia.Paper | null } = { current: null };
    function App() {
      const ref = useRef<dia.Paper | null>(null);
      // Push the ref value into a sentinel state so waitFor can poll a re-render.
      useEffect(() => {
        if (ref.current && !refHolder.current) {
          refHolder.current = ref.current;
        }
      });
      return (
        <GraphProvider initialCells={CELLS}>
          <Paper style={{ width: 100, height: 100 }} ref={ref} renderElement={renderRectElement} />
        </GraphProvider>
      );
    }
    const { rerender } = render(<App />);
    // Trigger a re-render after the paper is ready so the effect captures it.
    await waitFor(() => {
      rerender(<App />);
      expect(refHolder.current).not.toBeNull();
    });
  });

  it('keeps joint classes on paper.el when the className prop changes', async () => {
    // paper.el IS the React-rendered host div: dia.Paper imperatively adds
    // `jj-paper` to it after mount. A className prop change must not clobber
    // it — React replacing the whole class attribute silently kills every
    // class-based consumer (theme CSS, and any paper `guard` walking up to
    // `.jj-paper`, which breaks wheel zoom/pan after e.g. an
    // infinite→sheets mode switch).
    function App({ mode }: Readonly<{ mode: string }>) {
      return (
        <GraphProvider initialCells={CELLS}>
          <Paper
            className={mode}
            style={{ width: 100, height: 100 }}
            renderElement={renderRectElement}
          />
        </GraphProvider>
      );
    }
    const { container, rerender } = render(<App mode="mode-a" />);
    await waitFor(() => {
      const element = container.querySelector('.jj-paper');
      expect(element).toBeTruthy();
      expect(element!.classList.contains('mode-a')).toBe(true);
    });

    rerender(<App mode="mode-b" />);

    await waitFor(() => {
      const element = container.querySelector('.mode-b');
      expect(element).toBeTruthy();
      expect(element!.classList.contains('mode-a')).toBe(false);
      // The imperative joint class survives the React className update.
      expect(element!.classList.contains('jj-paper')).toBe(true);
    });
  });

  it('throws when cellVisibility is set via the options escape hatch', () => {
    // `PaperOptions` excludes `cellVisibility` at the type level; cast around
    // it to simulate a plain-JS caller and assert the runtime guard.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <GraphProvider initialCells={CELLS}>
          <Paper
            style={{ width: 100, height: 100 }}
            renderElement={renderRectElement}
            options={{ cellVisibility: () => true } as never}
          />
        </GraphProvider>
      )
    ).toThrow(/cellVisibility.*escape hatch/);
    spy.mockRestore();
  });
});
