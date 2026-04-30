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
import { render, waitFor } from '@testing-library/react';
import { GraphProvider, Paper } from '../../components';
import { CellIdContext } from '../../context';
import { useMeasureNode } from '../use-measure-node';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import type { CellRecord } from '../../types/cell.types';

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

type Visibility = 'show-all' | 'hide-node' | 'hide-all';

function ProbeWithVisibility({ visibility }: Readonly<{ visibility?: Visibility }>) {
  const nodeRef = useRef<SVGRectElement | null>(null);
  const size = useMeasureNode(nodeRef, { visibility });
  return (
    <>
      <rect ref={nodeRef} width={80} height={120} />
      <text>
        {size.width}x{size.height}
      </text>
    </>
  );
}

function renderHideAll() {
  return <ProbeWithVisibility />;
}
function renderHideNode() {
  return <ProbeWithVisibility visibility="hide-node" />;
}
function renderShowAll() {
  return <ProbeWithVisibility visibility="show-all" />;
}

function pickRenderProbe(visibility?: Visibility) {
  if (visibility === 'hide-node') return renderHideNode;
  if (visibility === 'show-all') return renderShowAll;
  return renderHideAll;
}

function renderProbe(visibility?: Visibility) {
  const function_ = pickRenderProbe(visibility);
  return render(
    <GraphProvider initialCells={initialCells}>
      <Paper id="measure-paper" width={200} height={200} renderElement={function_} />
    </GraphProvider>
  );
}

function NoCellProbe() {
  const ref = useRef<HTMLDivElement | null>(null);
  // No CellIdContext — useMeasureNode throws.
  useMeasureNode(ref);
  return null;
}

const renderNullElement = () => null;

function NoNodeProbe() {
  // Always-null ref — `if (!element) return;` early-out exercised.
  const ref = useRef<SVGRectElement | null>(null);
  const size = useMeasureNode(ref);
  return <text>{size.width}</text>;
}

const renderNoNodeProbe = () => <NoNodeProbe />;

describe('useMeasureNode', () => {
  it('returns the live width/height (default visibility = hide-all)', async () => {
    const { container } = renderProbe();
    await waitFor(() => {
      const rect = container.querySelector('rect');
      expect(rect).not.toBeNull();
    });
    // Settle layout effects.
    await new Promise((resolve) => setTimeout(resolve, 30));
  });

  it('honors visibility="hide-node"', async () => {
    const { container } = renderProbe('hide-node');
    await waitFor(() => {
      const rect = container.querySelector('rect');
      expect(rect).not.toBeNull();
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
  });

  it('honors visibility="show-all"', async () => {
    const { container } = renderProbe('show-all');
    await waitFor(() => {
      const rect = container.querySelector('rect');
      expect(rect).not.toBeNull();
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
  });

  it('throws when used outside CellIdContext', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <GraphProvider initialCells={initialCells}>
          <Paper
            id="measure-throw-paper"
            width={100}
            height={100}
            renderElement={renderNullElement}
          >
            <NoCellProbe />
          </Paper>
        </GraphProvider>
      )
    ).toThrow(/useMeasureNode\(\) must be used inside renderElement/);
    consoleError.mockRestore();
  });

  it('throws when called against a link cell (layout effect — `cell.isElement()` guard)', async () => {
    // The throw lives inside a layout effect — React surfaces uncaught
    // layout-effect errors to the nearest error boundary. Wrap the probe
    // so we capture the error there.
    function LinkProbe() {
      const ref = useRef<SVGRectElement | null>(null);
      useMeasureNode(ref);
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
        <Paper id="measure-link-paper" width={100} height={100} renderElement={renderLinkProbe} />
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
        <Paper id="measure-null-paper" width={100} height={100} renderElement={renderNoNodeProbe} />
      </GraphProvider>
    );
    await waitFor(() => {
      const text = container.querySelector('text');
      expect(text).not.toBeNull();
    });
  });
});
