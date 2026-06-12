/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { Component, useRef, type ReactNode } from 'react';

class CatchErrorBoundary extends Component<
  Readonly<{ onCatch: (error: Error) => void; children: ReactNode }>,
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    this.props.onCatch(error);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}
import { act, render, waitFor } from '@testing-library/react';
import type { dia } from '@joint/core';
import { GraphProvider, Paper } from '../../components';
import { CellIdContext } from '../../context';
import { useMeasureElement } from '../use-measure-element';
import { useGraphStore } from '../use-graph-store';
import { usePaper } from '../use-paper';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import { LINK_MODEL_TYPE } from '../../mvc/link-model';
import type { CellRecord } from '../../types/cell.types';

let capturedGraph: dia.Graph | null = null;
let capturedPaper: dia.Paper | undefined;

const initialCells: readonly CellRecord[] = [
  {
    id: 'el',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
  } as CellRecord,
  {
    id: 'el-2',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 80, y: 0 },
    size: { width: 50, height: 50 },
  } as CellRecord,
  {
    id: 'lnk',
    type: LINK_MODEL_TYPE,
    source: { id: 'el' },
    target: { id: 'el-2' },
  } as CellRecord,
];

function Probe() {
  const nodeRef = useRef<SVGRectElement | null>(null);
  const { graph } = useGraphStore();
  const { paper } = usePaper();
  capturedGraph = graph;
  capturedPaper = paper;
  const size = useMeasureElement(nodeRef);
  return (
    <>
      <rect ref={nodeRef} width={80} height={120} />
      <text>
        {size.width}x{size.height}
      </text>
    </>
  );
}

function renderProbeElement() {
  return <Probe />;
}

function renderProbe() {
  return render(
    <GraphProvider initialCells={initialCells}>
      <Paper
        style={{ width: 200, height: 200 }}
        id="measure-paper"
        renderElement={renderProbeElement}
      />
    </GraphProvider>
  );
}

function NoCellProbe() {
  const ref = useRef<HTMLDivElement | null>(null);
  // No CellIdContext — useMeasureElement throws.
  useMeasureElement(ref);
  return null;
}

const renderNullElement = () => null;

function NoNodeProbe() {
  // Always-null ref — `if (!element) return;` early-out exercised.
  const ref = useRef<SVGRectElement | null>(null);
  const size = useMeasureElement(ref);
  return <text>{size.width}</text>;
}

const renderNoNodeProbe = () => <NoNodeProbe />;

describe('useMeasureElement', () => {
  it('adds .jj-is-measuring on mount and removes it on the next paper render:done', async () => {
    capturedGraph = null;
    capturedPaper = undefined;
    const { container } = renderProbe();
    // Class is applied by useMeasureElement in a layout effect; wait until it lands.
    await waitFor(() => {
      const elementView = container.querySelector('.joint-cell.joint-element');
      expect(elementView).not.toBeNull();
      expect(elementView?.classList.contains('jj-is-measuring')).toBe(true);
    });
    // Listen for the next render:done before triggering it. In production
    // this fires after the ResizeObserver-driven size write; here we
    // simulate that with a direct model mutation since the jsdom
    // ResizeObserver mock doesn't deliver entries.
    const rendered = new Promise<void>((resolve) => {
      capturedPaper?.once('render:done', () => resolve());
    });
    act(() => {
      capturedGraph?.getCell('el').set('position', { x: 1, y: 1 });
    });
    await act(async () => {
      await rendered;
    });
    const elementView = container.querySelector('.joint-cell.joint-element');
    expect(elementView?.classList.contains('jj-is-measuring')).toBe(false);
  });

  it('throws when used outside CellIdContext', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <GraphProvider initialCells={initialCells}>
          <Paper style={{ width: 100, height: 100 }}
            id="measure-throw-paper"
            renderElement={renderNullElement}
          >
            <NoCellProbe />
          </Paper>
        </GraphProvider>
      )
    ).toThrow(/useMeasureElement\(\) must be used inside renderElement/);
    consoleError.mockRestore();
  });

  it('throws when called against a link cell (layout effect — `cell.isElement()` guard)', async () => {
    // The throw lives inside a layout effect — React surfaces uncaught
    // layout-effect errors to the nearest error boundary. Wrap the probe
    // so we capture the error there.
    function LinkProbe() {
      const ref = useRef<SVGRectElement | null>(null);
      useMeasureElement(ref);
      return <rect ref={ref} width={1} height={1} />;
    }
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    let caught: Error | null = null;
    function captureError(error: Error) {
      caught = error;
    }
    function renderLinkProbe() {
      return (
        <CellIdContext.Provider value="lnk">
          <CatchErrorBoundary onCatch={captureError}>
            <LinkProbe />
          </CatchErrorBoundary>
        </CellIdContext.Provider>
      );
    }
    render(
      <GraphProvider initialCells={initialCells}>
        <Paper style={{ width: 100, height: 100 }} id="measure-link-paper" renderElement={renderLinkProbe} />
      </GraphProvider>
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(caught).not.toBeNull();
    expect((caught as unknown as Error).message).toMatch(/can only be used with elements/);
    consoleError.mockRestore();
  });

  it('returns size record without registering when ref.current is null at mount', async () => {
    const { container } = render(
      <GraphProvider initialCells={initialCells}>
        <Paper style={{ width: 100, height: 100 }} id="measure-null-paper" renderElement={renderNoNodeProbe} />
      </GraphProvider>
    );
    await waitFor(() => {
      const text = container.querySelector('text');
      expect(text).not.toBeNull();
    });
  });

  describe('with a real ResizeObserver mock', () => {
    // Local ResizeObserver mock so we can deliver entries — the package-level
    // setup in `__mocks__/jest-setup.ts` installs a stub that never fires.
    const mockObserverInstances: TestResizeObserver[] = [];

    class TestResizeObserver {
      private callback: ResizeObserverCallback;
      private observed = new Set<Element>();
      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        mockObserverInstances.push(this);
      }
      observe(target: Element) {
        this.observed.add(target);
      }
      unobserve(target: Element) {
        this.observed.delete(target);
      }
      disconnect() {
        this.observed.clear();
      }
      triggerResize(target: Element, width: number, height: number) {
        const entry = {
          target,
          contentRect: {
            width,
            height,
            top: 0,
            left: 0,
            bottom: height,
            right: width,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          },
          borderBoxSize: [{ inlineSize: width, blockSize: height }],
          contentBoxSize: [{ inlineSize: width, blockSize: height }],
          devicePixelContentBoxSize: [{ inlineSize: width, blockSize: height }],
        } as ResizeObserverEntry;
        this.callback([entry], this as unknown as ResizeObserver);
      }
    }

    beforeEach(() => {
      mockObserverInstances.length = 0;
      globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;
    });

    const sameSizeCells: readonly CellRecord[] = [
      {
        id: 'el-same',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 0, y: 0 },
        size: { width: 80, height: 120 },
      } as CellRecord,
    ];

    function SameSizeProbe() {
      const nodeRef = useRef<SVGRectElement | null>(null);
      useMeasureElement(nodeRef);
      return <rect ref={nodeRef} width={80} height={120} />;
    }

    const renderSameSize = () => <SameSizeProbe />;

    it('removes .jj-is-measuring even when measured size matches the model', async () => {
      const { container } = render(
        <GraphProvider initialCells={sameSizeCells}>
          <Paper
            style={{ width: 200, height: 200 }}
            id="measure-same-size-paper"
            renderElement={renderSameSize}
          />
        </GraphProvider>
      );

      await waitFor(() => {
        const elementView = container.querySelector('.joint-cell.joint-element');
        expect(elementView?.classList.contains('jj-is-measuring')).toBe(true);
      });

      const rect = container.querySelector('rect');
      expect(rect).not.toBeNull();

      act(() => {
        mockObserverInstances.at(-1)!.triggerResize(rect!, 80, 120);
      });

      await waitFor(() => {
        const elementView = container.querySelector('.joint-cell.joint-element');
        expect(elementView?.classList.contains('jj-is-measuring')).toBe(false);
      });
    });
  });
});
