import { render, renderHook, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import type { dia } from '@joint/core';
import { GraphProvider, Paper } from '../../components';
import {
  graphProviderWrapper,
  paperRenderElementWrapper,
} from '../../utils/test-wrappers';
import { useResolvePaperId, usePaper } from '../use-paper';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import type { CellRecord } from '../../types/cell.types';

const EMPTY_CELLS: readonly CellRecord[] = [];

describe('useResolvePaperId', () => {
  it('returns null sentinel when target is undefined', () => {
    const wrapper = graphProviderWrapper({ initialCells: [] });
    const undefinedTarget: undefined = undefined;
    const { result } = renderHook(() => useResolvePaperId(undefinedTarget), { wrapper });
    // OPTIONAL sentinel `{ optional: true }` is returned for unresolved targets.
    expect(typeof result.current).toBe('object');
  });

  it('returns the id directly when target is a string', () => {
    const wrapper = graphProviderWrapper({ initialCells: [] });
    const { result } = renderHook(() => useResolvePaperId('paper-id'), { wrapper });
    expect(result.current).toBe('paper-id');
  });

  it('resolves a `dia.Paper` instance synchronously', async () => {
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        initialCells: [
          {
            id: '1',
            type: ELEMENT_MODEL_TYPE,
            size: { width: 50, height: 50 },
          } as CellRecord,
        ],
      },
      paperProps: { id: 'instance-paper' },
    });
    let captured: dia.Paper | null = null;
    const { result } = renderHook(
      () => {
        const { paper } = usePaper('instance-paper');
        if (paper && !captured) captured = paper;
        return useResolvePaperId(captured ?? undefined);
      },
      { wrapper }
    );
    await waitFor(() => expect(captured).not.toBeNull());
    await waitFor(() => expect(result.current).toBe('instance-paper'));
  });

  it('resolves a ref-based target via the layout effect when ref attaches mid-mount (lines 33–35)', async () => {
    // Render <Paper ref={paperRef} /> together with a Probe that calls
    // `useResolvePaperId(paperRef)`. On the first render, `paperRef.current`
    // is still null (Paper's `useImperativeHandle` populates it AFTER child
    // effects run). The Probe's `useResolvePaperId` therefore returns the
    // null sentinel during render, but its layout effect runs *after* Paper
    // has attached to the ref — the layout effect re-resolves successfully
    // and forces a re-render via `forceRender()`, hitting lines 33–35.
    let resolvedId: string | { optional: true } | null = null;
    function Probe({ paperRef }: { readonly paperRef: React.RefObject<dia.Paper | null> }) {
      resolvedId = useResolvePaperId(paperRef);
      return null;
    }
    function Host() {
      const paperRef = useRef<dia.Paper | null>(null);
      return (
        <>
          <Paper ref={paperRef} id="late-ref-paper" width={10} height={10} />
          <Probe paperRef={paperRef} />
        </>
      );
    }
    render(
      <GraphProvider initialCells={EMPTY_CELLS}>
        <Host />
      </GraphProvider>
    );
    await waitFor(() => expect(resolvedId).toBe('late-ref-paper'));
  });
});

describe('usePaper', () => {
  it('returns { paper: dia.Paper } from context', async () => {
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        initialCells: [
          {
            id: '1',
            type: ELEMENT_MODEL_TYPE,
            size: { width: 50, height: 50 },
          } as CellRecord,
        ],
      },
      paperProps: { id: 'context-paper' },
    });
    const { result } = renderHook(() => usePaper(), { wrapper });
    await waitFor(() => expect(result.current.paper).not.toBeNull());
  });

  it('returns { paper: null } with optional: true outside Paper context', () => {
    const wrapper = graphProviderWrapper({ initialCells: [] });
    const { result } = renderHook(() => usePaper({ optional: true }), { wrapper });
    expect(result.current.paper).toBeNull();
  });

  it('looks up paper by id', async () => {
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        initialCells: [
          {
            id: '1',
            type: ELEMENT_MODEL_TYPE,
            size: { width: 50, height: 50 },
          } as CellRecord,
        ],
      },
      paperProps: { id: 'by-id-paper' },
    });
    const { result } = renderHook(() => usePaper('by-id-paper'), { wrapper });
    await waitFor(() => expect(result.current.paper).not.toBeNull());
  });
});
