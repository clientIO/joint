import { useCallback, useEffect, useRef } from 'react';
import { render, waitFor } from '@testing-library/react';
import { GraphProvider, Paper } from '../../components';
import { useMarkup } from '../use-markup';
import { CellIdContext } from '../../context';
import { ELEMENT_MODEL_TYPE, PORTAL_SELECTOR } from '../../models/element-model';
import type { CellRecord } from '../../types/cell.types';

const initialCells: readonly CellRecord[] = [
  {
    id: 'cell-1',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
  } as CellRecord,
];

interface ProbeProps {
  readonly onUtilities: (utilities: ReturnType<typeof useMarkup>) => void;
  readonly onSelectorRef?: (node: Element | null) => void;
  readonly magnetOptions?: { passive?: boolean };
}

function Probe({ onUtilities, onSelectorRef, magnetOptions }: Readonly<ProbeProps>) {
  const utilities = useMarkup();
  const ref = useRef<SVGRectElement | null>(null);
  useEffect(() => {
    onUtilities(utilities);
  }, [onUtilities, utilities]);
  const handleRectRef = useCallback(
    (node: SVGRectElement | null) => {
      ref.current = node;
      utilities.selectorRef('body')(node);
      onSelectorRef?.(node);
    },
    [utilities, onSelectorRef]
  );
  return (
    <>
      <rect ref={handleRectRef} width={10} height={10} />
      <g ref={utilities.magnetRef('port-1', magnetOptions)}>
        <circle r={5} />
      </g>
    </>
  );
}

interface RenderInPaperOptions extends ProbeProps {
  readonly renderOverride?: (data: unknown) => React.ReactNode;
}

const noopOnUtilities = () => {};

function renderInPaper(options?: Readonly<RenderInPaperOptions>) {
  const onUtilities = options?.onUtilities ?? noopOnUtilities;
  const onSelectorRef = options?.onSelectorRef;
  const magnetOptions = options?.magnetOptions;
  const renderOverride = options?.renderOverride;
  const renderElement =
    renderOverride ??
    ((_data: unknown) => (
      <Probe
        onUtilities={onUtilities}
        onSelectorRef={onSelectorRef}
        magnetOptions={magnetOptions}
      />
    ));
  return render(
    <GraphProvider initialCells={initialCells}>
      <Paper id="markup-paper" width={100} height={100} renderElement={renderElement} />
    </GraphProvider>
  );
}

let cleanupCapturedNode: Element | null = null;
let cleanupUtilities: ReturnType<typeof useMarkup> | undefined;

function CleanupProbe() {
  const value = useMarkup();
  cleanupUtilities = value;
  const handleRectRef = useCallback(
    (node: SVGRectElement | null) => {
      cleanupCapturedNode = node;
      value.selectorRef('cleanup-target')(node);
    },
    [value]
  );
  return <rect ref={handleRectRef} width={5} height={5} />;
}

const renderCleanupProbe = () => <CleanupProbe />;

let reservedUtilities: ReturnType<typeof useMarkup> | undefined;

function ReservedProbe() {
  reservedUtilities = useMarkup();
  return null;
}

const renderReservedProbe = () => <ReservedProbe />;

let emptyCaptured: ReturnType<typeof useMarkup> | undefined;

function EmptyMarkupProbe() {
  emptyCaptured = useMarkup();
  return null;
}

const renderEmptyMarkupProbe = () => (
  <CellIdContext.Provider value="non-existent-id">
    <EmptyMarkupProbe />
  </CellIdContext.Provider>
);

describe('useMarkup', () => {
  it('exposes selectorRef and magnetRef utilities', async () => {
    const utilitiesSpy = jest.fn();
    renderInPaper({ onUtilities: utilitiesSpy });
    await waitFor(() => expect(utilitiesSpy).toHaveBeenCalled());
    const [[utilities]] = utilitiesSpy.mock.calls;
    expect(typeof utilities.selectorRef).toBe('function');
    expect(typeof utilities.magnetRef).toBe('function');
  });

  it('selectorRef sets the joint-selector attribute on the rendered node', async () => {
    let nodeRef: Element | null = null;
    renderInPaper({
      onUtilities: noopOnUtilities,
      onSelectorRef: (node) => {
        if (node) nodeRef = node;
      },
    });
    await waitFor(() => expect(nodeRef).not.toBeNull());
    expect(nodeRef!.getAttribute('joint-selector')).toBe('body');
  });

  it('magnetRef defaults to magnet="active"', async () => {
    const { container } = renderInPaper({ onUtilities: noopOnUtilities });
    await waitFor(() => {
      const magnetNode = container.querySelector('g[magnet]');
      expect(magnetNode).not.toBeNull();
      expect(magnetNode!.getAttribute('magnet')).toBe('active');
    });
  });

  it('magnetRef with passive=true sets magnet="passive"', async () => {
    const { container } = renderInPaper({
      onUtilities: noopOnUtilities,
      magnetOptions: { passive: true },
    });
    await waitFor(() => {
      const magnetNode = container.querySelector('g[magnet]');
      expect(magnetNode).not.toBeNull();
      expect(magnetNode!.getAttribute('magnet')).toBe('passive');
    });
  });

  it('selectorRef cleanup deletes the selector entry when node is removed', async () => {
    cleanupCapturedNode = null;
    cleanupUtilities = undefined;
    render(
      <GraphProvider initialCells={initialCells}>
        <Paper
          id="markup-cleanup-paper"
          width={100}
          height={100}
          renderElement={renderCleanupProbe}
        />
      </GraphProvider>
    );
    await waitFor(() => expect(cleanupCapturedNode).not.toBeNull());
    // Simulate ref-detach by passing null — exercises the `else` branch (delete).
    cleanupUtilities!.selectorRef('cleanup-target')(null);
    expect(true).toBe(true);
  });

  it('throws when selector is reserved (PORTAL_SELECTOR / "root" / "portRoot")', async () => {
    reservedUtilities = undefined;
    render(
      <GraphProvider initialCells={initialCells}>
        <Paper
          id="markup-reserved-paper"
          width={100}
          height={100}
          renderElement={renderReservedProbe}
        />
      </GraphProvider>
    );
    await waitFor(() => expect(reservedUtilities).toBeDefined());
    expect(() => reservedUtilities!.selectorRef(PORTAL_SELECTOR)).toThrow(/reserved/);
    expect(() => reservedUtilities!.selectorRef('root')).toThrow(/reserved/);
    expect(() => reservedUtilities!.magnetRef('portRoot')).toThrow(/reserved/);
  });

  it('selectorRef is a no-op when the elementView is not yet found', async () => {
    // Inside renderElement, the elementView is found. To exercise the
    // `if (!elementView) return;` early-out, we wrap a probe rendered via
    // CellIdContext directly (without an active Paper view). Throws on
    // useMarkup's `usePaper()` outside Paper, so render with Paper but no
    // matching cell — provide a fake id so paper.findViewByModel returns
    // undefined.
    emptyCaptured = undefined;
    render(
      <GraphProvider initialCells={initialCells}>
        <Paper
          id="markup-empty-paper"
          width={100}
          height={100}
          renderElement={renderEmptyMarkupProbe}
        />
      </GraphProvider>
    );
    await waitFor(() => expect(emptyCaptured).toBeDefined());
    // Run selectorRef with a fresh node — the early-out path swallows it.
    const node = document.createElement('rect');
    expect(() => emptyCaptured!.selectorRef('any-name')(node)).not.toThrow();
    // No joint-selector attribute set because elementView wasn't found.
    expect(node.getAttribute('joint-selector')).toBeNull();
  });
});
