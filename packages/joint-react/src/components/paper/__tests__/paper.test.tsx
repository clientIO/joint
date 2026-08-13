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
    // paper.el IS the React-rendered host div: `mvc.View` adds `jj-paper`
    // to it imperatively after mount. A className prop change must not
    // clobber it — React replaces the whole `class` attribute, so the
    // imperatively-added class has to be re-applied by the Paper wrapper.
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

  it('keeps inline style authoritative over className (same as an HTML div)', async () => {
    // Report: `<Paper style={{ width: 1000 }} className="w-10" />` should let the
    // inline width win over the class, like any HTML element. The host div IS
    // `paper.el`; the inline `style` must land on it (present in the `style`
    // attribute) so the CSS cascade — inline beats class, there is no
    // `!important` in paper.css — resolves in the user's favour. `_setDimensions`
    // (which runs with width/height forced to `undefined`) must not wipe it.
    const { container } = render(
      <GraphProvider initialCells={CELLS}>
        <Paper
          style={{ width: 1000, height: 500 }}
          className="w-10"
          renderElement={renderRectElement}
        />
      </GraphProvider>
    );
    await waitFor(() => expect(container.querySelector('svg')).toBeTruthy());
    const host = container.querySelector('.jj-paper');
    if (!(host instanceof HTMLElement)) throw new Error('paper host div not found');
    // Inline style survived on paper.el → wins over the class in a real browser.
    expect(host.style.width).toBe('1000px');
    expect(host.style.height).toBe('500px');
    // The class is applied too (alongside the framework's jj-paper).
    expect(host.classList.contains('w-10')).toBe(true);
    expect(host.classList.contains('jj-paper')).toBe(true);
  });

  it('redraws the visual grid when drawGridSize changes reactively', async () => {
    // Regression: the visual grid only redrew via the top-level `drawGrid`
    // prop; `drawGridSize` changes updated snapping (gridSize) but left the
    // rendered grid pattern stale.
    const refHolder: { current: dia.Paper | null } = { current: null };
    function App({ drawGridSize }: Readonly<{ drawGridSize: number }>) {
      const ref = useRef<dia.Paper | null>(null);
      useEffect(() => {
        if (ref.current) refHolder.current = ref.current;
      });
      return (
        <GraphProvider initialCells={CELLS}>
          <Paper
            ref={ref}
            renderElement={renderRectElement}
            style={{ width: 300, height: 200 }}
            gridSize={10}
            drawGridSize={drawGridSize}
          />
        </GraphProvider>
      );
    }
    const patternWidth = () =>
      refHolder.current?.el.querySelector('pattern')?.getAttribute('width') ?? null;

    const { rerender } = render(<App drawGridSize={20} />);
    await waitFor(() => {
      rerender(<App drawGridSize={20} />);
      expect(patternWidth()).toBe('20');
    });

    rerender(<App drawGridSize={60} />);
    await waitFor(() => expect(patternWidth()).toBe('60'));
  });
});
