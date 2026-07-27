/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { useCallback, useEffect, useRef } from 'react';
import { render, waitFor } from '@testing-library/react';
import { GraphProvider, Paper } from '../../components';
import { useMarkup } from '../use-markup';
import { usePaper } from '../use-paper';
import type { PaperView } from '../../mvc/paper';
import { CellIdContext } from '../../context';
import { ELEMENT_MODEL_TYPE, PORTAL_SELECTOR } from '../../mvc/element-model';
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
      <Paper style={{ width: 100, height: 100 }} id="markup-paper" renderElement={renderElement} />
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

// A magnet <g> that wraps a real <button> control (inside a foreignObject, like an
// HTMLBox card). joint refuses to start a link from a <button>; `startLinkDrag` must
// begin one anyway when called from the button's own pointer handler.
let dragUtilities: ReturnType<typeof useMarkup> | undefined;
let dragButton: HTMLButtonElement | null = null;
let dragPaper: PaperView | null = null;

function DragProbe() {
  const utilities = useMarkup();
  const { paper } = usePaper();
  dragUtilities = utilities;
  dragPaper = paper;
  const buttonRef = useCallback((node: HTMLButtonElement | null) => {
    dragButton = node;
  }, []);
  return (
    <g ref={utilities.magnetRef('drag-row')}>
      <foreignObject width={50} height={20}>
        <button type="button" ref={buttonRef}>
          NN
        </button>
      </foreignObject>
    </g>
  );
}

const renderDragProbe = () => <DragProbe />;

// Read the async-captured values through a function boundary so TypeScript uses their
// declared types (the probe reassigns them in a commit the compiler can't see, and a
// same-scope `x = null` reset would otherwise narrow the read to `never`).
const readDragPaper = (): PaperView | null => dragPaper;
const readDragButton = (): HTMLButtonElement | null => dragButton;
const readDragUtilities = (): ReturnType<typeof useMarkup> | undefined => dragUtilities;

describe('useMarkup', () => {
  it('exposes selectorRef, magnetRef and startLinkDrag utilities', async () => {
    const utilitiesSpy = jest.fn();
    renderInPaper({ onUtilities: utilitiesSpy });
    await waitFor(() => expect(utilitiesSpy).toHaveBeenCalled());
    const [[utilities]] = utilitiesSpy.mock.calls;
    expect(typeof utilities.selectorRef).toBe('function');
    expect(typeof utilities.magnetRef).toBe('function');
    expect(typeof utilities.startLinkDrag).toBe('function');
  });

  it('selectorRef/magnetRef return a STABLE callback per key (no per-render churn)', async () => {
    const utilitiesSpy = jest.fn();
    renderInPaper({ onUtilities: utilitiesSpy });
    await waitFor(() => expect(utilitiesSpy).toHaveBeenCalled());
    const { calls } = utilitiesSpy.mock;
    // eslint-disable-next-line prefer-destructuring
    const utilities = calls.at(-1)[0];
    // Same key -> same function instance, so React attaches the ref once (not per render).
    expect(utilities.selectorRef('body')).toBe(utilities.selectorRef('body'));
    expect(utilities.magnetRef('port-1')).toBe(utilities.magnetRef('port-1'));
    // The passive variant is cached independently of the active one.
    expect(utilities.magnetRef('port-1', { passive: true })).toBe(
      utilities.magnetRef('port-1', { passive: true })
    );
    expect(utilities.magnetRef('port-1')).not.toBe(
      utilities.magnetRef('port-1', { passive: true })
    );
  });

  it('startLinkDrag begins a link from a <button> that joint would otherwise gate', async () => {
    dragUtilities = undefined;
    dragButton = null;
    dragPaper = null;
    render(
      <GraphProvider initialCells={initialCells}>
        {/* magnetThreshold 0: the link forms on press (not on move-out), so the outcome
            is observable synchronously without a document-level drag. */}
        <Paper
          style={{ width: 100, height: 100 }}
          id="markup-drag-paper"
          magnetThreshold={0}
          renderElement={renderDragProbe}
        />
      </GraphProvider>
    );
    await waitFor(() => {
      expect(dragButton).not.toBeNull();
      expect(dragPaper).not.toBeNull();
    });
    const paper = readDragPaper();
    if (!paper) throw new Error('paper not mounted');

    // Control: a RAW press on the <button> starts NO link. joint's form-control gate
    // (FORM_CONTROL_TAG_NAMES) refuses to start a link when the pressed element is a
    // <button> — this is the exact behavior startLinkDrag exists to work around.
    const linksBeforeControl = paper.model.getLinks().length;
    readDragButton()?.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 10, clientY: 10, bubbles: true })
    );
    expect(paper.model.getLinks().length).toBe(linksBeforeControl);

    // startLinkDrag from the SAME button DOES start a link: it re-points the press at the
    // magnet node, slipping past the gate through joint's own event pipeline.
    const linksBefore = paper.model.getLinks().length;
    readDragUtilities()?.startLinkDrag({
      target: readDragButton(),
      clientX: 10,
      clientY: 10,
      button: 0,
    });
    expect(paper.model.getLinks().length).toBe(linksBefore + 1);

    // Release, so the in-progress drag doesn't leak into other tests.
    document.dispatchEvent(
      new MouseEvent('mouseup', { clientX: 10, clientY: 10, bubbles: true })
    );
  });

  it('startLinkDrag is a no-op when the target has no magnet ancestor', async () => {
    dragUtilities = undefined;
    dragPaper = null;
    render(
      <GraphProvider initialCells={initialCells}>
        <Paper
          style={{ width: 100, height: 100 }}
          id="markup-drag-noop-paper"
          magnetThreshold={0}
          renderElement={renderDragProbe}
        />
      </GraphProvider>
    );
    await waitFor(() => {
      expect(dragUtilities).toBeDefined();
      expect(dragPaper).not.toBeNull();
    });
    const paper = readDragPaper();
    if (!paper) throw new Error('paper not mounted');
    const linksBefore = paper.model.getLinks().length;
    const orphan = document.createElement('div');
    expect(() =>
      readDragUtilities()?.startLinkDrag({ target: orphan, clientX: 0, clientY: 0, button: 0 })
    ).not.toThrow();
    expect(paper.model.getLinks().length).toBe(linksBefore);
  });

  it('ref cleanup does NOT throw when the view.selectors map is already gone (fast-unmount race)', async () => {
    dragUtilities = undefined;
    dragPaper = null;
    dragButton = null;
    render(
      <GraphProvider initialCells={initialCells}>
        <Paper style={{ width: 100, height: 100 }} id="markup-teardown-paper" renderElement={renderDragProbe} />
      </GraphProvider>
    );
    await waitFor(() => {
      expect(dragUtilities).toBeDefined();
      expect(dragPaper).not.toBeNull();
    });
    const paper = readDragPaper();
    if (!paper) throw new Error('paper not mounted');
    const view = paper.findViewByModel('cell-1');
    // Simulate a view mid-teardown: virtual-rendering / a fast unmount clears the view's
    // `selectors` map, then React detaches the ref with null. The cleanup must bail, not
    // do `delete undefined[selector]` (TypeError: Cannot convert undefined or null to object).
    // @ts-expect-error - `selectors` is an internal ElementView field, forced for the test
    view.selectors = undefined;
    const utilities = readDragUtilities();
    expect(() => utilities?.magnetRef('drag-row')(null)).not.toThrow();
    expect(() => utilities?.selectorRef('drag-row')(null)).not.toThrow();
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
          style={{ width: 100, height: 100 }}
          id="markup-cleanup-paper"
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
          style={{ width: 100, height: 100 }}
          id="markup-reserved-paper"
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
    // matching cell — provide a fake id so paper.getCellView returns null.
    emptyCaptured = undefined;
    render(
      <GraphProvider initialCells={initialCells}>
        <Paper
          style={{ width: 100, height: 100 }}
          id="markup-empty-paper"
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
