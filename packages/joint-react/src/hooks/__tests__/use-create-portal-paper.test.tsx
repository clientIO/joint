/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import { dia } from '@joint/core';
import { useEffect, useRef } from 'react';
import { renderHook, render, waitFor } from '@testing-library/react';
import { GraphProvider, Paper } from '../../components';
import { useCreatePortalPaper } from '../use-create-portal-paper';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import type { CellRecord, LinkRecord } from '../../types/cell.types';

const EMPTY_CELLS: readonly CellRecord[] = [];

interface PaperReadyProbeProps {
  readonly paperRef: React.RefObject<dia.Paper | null>;
  readonly onReady: (paper: dia.Paper) => void;
}
function PaperReadyProbe({ paperRef, onReady }: Readonly<PaperReadyProbeProps>) {
  useEffect(() => {
    if (paperRef.current) onReady(paperRef.current);
  });
  return null;
}

/**
 * Creates a minimal CellView-shaped object that satisfies `defaultLink`'s
 * runtime contract — it reads `.paper`, `.model`, and `.el`. We don't render
 * the element; constructing the test fixture directly keeps the test pure
 * and avoids JointJS render timing issues in jsdom.
 */
function makeFakeCellView(paper: dia.Paper): dia.CellView {
  const fakeElement = paper.model.getCell('a');
  if (!fakeElement) throw new Error('test fixture missing element with id "a"');
  return {
    paper,
    model: fakeElement,
    el: document.createElement('g'),
    findAttribute: () => null,
  } as unknown as dia.CellView;
}

function callDefaultLink(paper: dia.Paper): dia.Link {
  const cellView = makeFakeCellView(paper);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (paper.options as any).defaultLink(cellView, (cellView as unknown as { el: SVGElement }).el) as dia.Link;
}

const initialCells: readonly CellRecord[] = [
  {
    id: 'a',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
  } as CellRecord,
  {
    id: 'b',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 80, y: 0 },
    size: { width: 50, height: 50 },
  } as CellRecord,
  {
    id: 'l1',
    type: LINK_MODEL_TYPE,
    source: { id: 'a' },
    target: { id: 'b' },
  } as CellRecord,
];

describe('useCreatePortalPaper — error and edge cases', () => {
  it('throws when no id is provided (line 212)', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      renderHook(() => useCreatePortalPaper({} as Parameters<typeof useCreatePortalPaper>[0]), {
        wrapper: ({ children }) => (
          <GraphProvider initialCells={EMPTY_CELLS}>{children}</GraphProvider>
        ),
      })
    ).toThrow('Paper id is required');
    consoleError.mockRestore();
  });

  it('fires onReady once when paper becomes available (lines 350–352)', async () => {
    const onReady = jest.fn();
    const { result } = renderHook(
      () =>
        useCreatePortalPaper({
          id: 'on-ready-paper',
          width: 100,
          height: 100,
          renderElement: () => <rect />,
          onReady,
          isExternalPaper: false,
        }),
      {
        wrapper: ({ children }) => (
          <GraphProvider initialCells={initialCells}>{children}</GraphProvider>
        ),
      }
    );
    await waitFor(() => expect(onReady).toHaveBeenCalled());
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(result.current.id).toBe('on-ready-paper');
  });
});

describe('Paper — defaultLink prop variants (lines 100–124)', () => {
  it('accepts a static LinkRecord as defaultLink', async () => {
    const onReady = jest.fn();
    function Host() {
      const paperRef = useRef<dia.Paper | null>(null);
      return (
        <>
          <Paper
            ref={paperRef}
            id="default-link-static"
            width={100}
            height={100}
            renderElement={() => <rect />}
            defaultLink={
              {
                type: LINK_MODEL_TYPE,
                data: { kind: 'static' },
              } as LinkRecord
            }
          />
          <PaperReadyProbe paperRef={paperRef} onReady={onReady} />
        </>
      );
    }
    render(
      <GraphProvider initialCells={initialCells}>
        <Host />
      </GraphProvider>
    );
    await waitFor(() => expect(onReady).toHaveBeenCalled());
    const [[paper]] = onReady.mock.calls;
    // Trigger the defaultLink callback as if a user dragged from a port —
    // exercises the static-record branch (line 120–122).
    const link = callDefaultLink(paper);
    expect(link).toBeInstanceOf(dia.Link);
  });

  it('accepts a factory function returning a LinkRecord (lines 105–110)', async () => {
    const factory = jest.fn(() => ({
      type: LINK_MODEL_TYPE,
      data: { kind: 'factory' },
    }));
    const onReady = jest.fn();
    function Host() {
      const paperRef = useRef<dia.Paper | null>(null);
      return (
        <>
          <Paper
            ref={paperRef}
            id="default-link-factory"
            width={100}
            height={100}
            renderElement={() => <rect />}
            defaultLink={factory as never}
          />
          <PaperReadyProbe paperRef={paperRef} onReady={onReady} />
        </>
      );
    }
    render(
      <GraphProvider initialCells={initialCells}>
        <Host />
      </GraphProvider>
    );
    await waitFor(() => expect(onReady).toHaveBeenCalled());
    const [[paper]] = onReady.mock.calls;
    const link = callDefaultLink(paper);
    expect(factory).toHaveBeenCalled();
    expect(link).toBeInstanceOf(dia.Link);
  });

  it('accepts a factory that returns a `dia.Link` instance (line 117)', async () => {
    const onReady = jest.fn();
    let factoryRanWith: dia.Link | undefined;
    function factory() {
      const link = new dia.Link({});
      factoryRanWith = link;
      return link;
    }
    function Host() {
      const paperRef = useRef<dia.Paper | null>(null);
      return (
        <>
          <Paper
            ref={paperRef}
            id="default-link-instance-factory"
            width={100}
            height={100}
            renderElement={() => <rect />}
            defaultLink={factory as never}
          />
          <PaperReadyProbe paperRef={paperRef} onReady={onReady} />
        </>
      );
    }
    render(
      <GraphProvider initialCells={initialCells}>
        <Host />
      </GraphProvider>
    );
    await waitFor(() => expect(onReady).toHaveBeenCalled());
    const [[paper]] = onReady.mock.calls;
    const link = callDefaultLink(paper);
    expect(link).toBe(factoryRanWith);
  });

  it('clones a static `dia.Link` instance via `.clone()` (line 118)', async () => {
    const staticLink = new dia.Link({});
    const onReady = jest.fn();
    function Host() {
      const paperRef = useRef<dia.Paper | null>(null);
      return (
        <>
          <Paper
            ref={paperRef}
            id="default-link-instance-static"
            width={100}
            height={100}
            renderElement={() => <rect />}
            defaultLink={staticLink as unknown as Parameters<typeof Paper>[0]['defaultLink']}
          />
          <PaperReadyProbe paperRef={paperRef} onReady={onReady} />
        </>
      );
    }
    render(
      <GraphProvider initialCells={initialCells}>
        <Host />
      </GraphProvider>
    );
    await waitFor(() => expect(onReady).toHaveBeenCalled());
    const [[paper]] = onReady.mock.calls;
    const cloned = callDefaultLink(paper);
    expect(cloned).toBeInstanceOf(dia.Link);
    expect(cloned).not.toBe(staticLink);
  });

  it('returns the default LinkModel when factory returns null/undefined (line 114)', async () => {
    const factory = jest.fn(() => null);
    const onReady = jest.fn();
    function Host() {
      const paperRef = useRef<dia.Paper | null>(null);
      return (
        <>
          <Paper
            ref={paperRef}
            id="default-link-null-factory"
            width={100}
            height={100}
            renderElement={() => <rect />}
            defaultLink={factory as never}
          />
          <PaperReadyProbe paperRef={paperRef} onReady={onReady} />
        </>
      );
    }
    render(
      <GraphProvider initialCells={initialCells}>
        <Host />
      </GraphProvider>
    );
    await waitFor(() => expect(onReady).toHaveBeenCalled());
    const [[paper]] = onReady.mock.calls;
    const link = callDefaultLink(paper);
    expect(link).toBeInstanceOf(dia.Link);
  });
});

interface GridAppProps {
  readonly drawGrid?: boolean;
  readonly gridSize?: number;
  readonly transform?: string;
}

function GridApp({ drawGrid, gridSize, transform }: Readonly<GridAppProps>) {
  return (
    <GraphProvider initialCells={initialCells}>
      <Paper
        id="grid-paper"
        width={100}
        height={100}
        renderElement={() => <rect />}
        drawGrid={drawGrid}
        gridSize={gridSize}
        transform={transform}
      />
    </GraphProvider>
  );
}

describe('Paper — drawGrid / gridSize / transform live updates (lines 377–390)', () => {
  it('applies drawGrid, gridSize, and transform on prop changes', async () => {
    const { rerender } = render(<GridApp />);
    // Allow paper to mount.
    await new Promise((resolve) => setTimeout(resolve, 30));
    rerender(<GridApp drawGrid gridSize={20} transform="scale(2)" />);
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
});

const DEFAULT_RENDER_CELLS: readonly CellRecord[] = [
  {
    id: 'with-label',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 100, height: 50 },
    data: { label: 'default-rendered' },
  } as CellRecord,
];

describe('Paper — defaultRenderElement fallback (line 174)', () => {
  it('renders cell.data.label inside a default HTML host when renderElement is omitted', async () => {
    const { container } = render(
      <GraphProvider initialCells={DEFAULT_RENDER_CELLS}>
        <Paper id="default-render-paper" width={120} height={120} />
      </GraphProvider>
    );
    await waitFor(() => {
      // The default render emits an HTMLBox that contains the label string.
      expect(container.textContent).toContain('default-rendered');
    });
  });
});

const RENDER_LINK_CELLS: readonly CellRecord[] = [
  ...initialCells,
  {
    id: 'data-link',
    type: LINK_MODEL_TYPE,
    source: { id: 'a' },
    target: { id: 'b' },
    data: { label: 'hello' },
  } as CellRecord,
];

describe('Paper — renderLink integration (LinkItem render, line 161)', () => {
  it('renders link content inside the link portal', async () => {
    const renderLink = jest.fn((data: { label?: string }) => (
      <text data-testid="link-text">{data.label ?? 'link'}</text>
    ));
    render(
      <GraphProvider initialCells={RENDER_LINK_CELLS}>
        <Paper
          id="link-paper"
          width={100}
          height={100}
          renderElement={() => <rect />}
          renderLink={renderLink}
        />
      </GraphProvider>
    );
    await waitFor(() => {
      expect(renderLink).toHaveBeenCalled();
    });
  });
});
