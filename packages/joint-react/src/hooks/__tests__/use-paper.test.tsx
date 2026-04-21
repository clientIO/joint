/* eslint-disable unicorn/no-useless-undefined */
import type { dia } from '@joint/core';
import { render, renderHook, waitFor } from '@testing-library/react';
import { useRef, type ReactNode } from 'react';
import { GraphProvider, Paper } from '../../components';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { usePaper, usePaperStore, useResolvePaperId } from '../use-paper';
import type { Optional } from '../../types';

const EMPTY_ELEMENTS = {};
const EMPTY_LINKS = {};

function renderTestElement() {
  return <rect width={10} height={10} />;
}

function createPaperWrapper(paperId = 'paper-under-test') {
  return ({ children }: { children: ReactNode }) => (
    <GraphProvider initialElements={EMPTY_ELEMENTS} initialLinks={EMPTY_LINKS}>
      <Paper id={paperId} width={100} height={100} renderElement={renderTestElement}>
        {children}
      </Paper>
    </GraphProvider>
  );
}

describe('use-paper', () => {
  const graphWrapper = graphProviderWrapper({
    initialElements: EMPTY_ELEMENTS,
    initialLinks: EMPTY_LINKS,
  });

  it('returns paper instance from Paper context', async () => {
    const wrapper = createPaperWrapper('paper-context');
    const { result } = renderHook(() => usePaper({ optional: true }), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.paper).toHaveProperty('trigger');
    });
  });

  it('throws when used outside Paper context', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => usePaper(), { wrapper: graphWrapper });
    }).toThrow('usePaperStore must be used within a Paper or RenderElement');

    consoleError.mockRestore();
  });

  it('returns paper by id from GraphProvider', async () => {
    const wrapper = createPaperWrapper('paper-by-id');
    const { result } = renderHook(() => usePaper('paper-by-id'), { wrapper });

    await waitFor(() => {
      expect(result.current.paper).not.toBeNull();
      expect(result.current.paper).toHaveProperty('trigger');
    });
  });

  it('returns null paper when paper id is not found', async () => {
    const wrapper = createPaperWrapper('existing-paper');
    const { result } = renderHook(() => usePaper('missing-paper'), { wrapper });

    await waitFor(() => {
      expect(result.current.paper).toBeNull();
    });
  });

  it('returns stable paper instance for the same id across rerenders', async () => {
    const wrapper = createPaperWrapper('paper-stable');
    const { result, rerender } = renderHook(() => usePaper('paper-stable'), { wrapper });

    await waitFor(() => {
      expect(result.current.paper).not.toBeNull();
    });

    const firstPaper = result.current.paper as dia.Paper;
    rerender();

    await waitFor(() => {
      expect(result.current.paper).toBe(firstPaper);
    });
  });

  it('returns null paper when usePaper({ optional: true }) is used outside Paper context', () => {
    const { result } = renderHook(() => usePaper({ optional: true }), { wrapper: graphWrapper });

    expect(result.current.paper).toBeNull();
  });

  it('throws when usePaper(id) is used outside GraphProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => usePaper('paper-by-id'));
    }).toThrow('useGraphStore must be used within a GraphProvider');

    consoleError.mockRestore();
  });
});

describe('useResolvePaperId', () => {
  it('resolves a string paper id directly', () => {
    const wrapper = createPaperWrapper('paper-resolve-str');
    const { result } = renderHook(() => useResolvePaperId('paper-resolve-str'), { wrapper });
    expect(result.current).toBe('paper-resolve-str');
  });

  it('returns NULLABLE when target is undefined', () => {
    const wrapper = createPaperWrapper('paper-resolve-undef');
    const { result } = renderHook(() => useResolvePaperId(undefined), { wrapper });
    expect(result.current).toEqual({ optional: true });
  });

  it('resolves paper id from a ref after Paper mounts', async () => {
    let resolvedId: string | Optional | null = null;

    function TestComponent() {
      const paperRef = useRef<dia.Paper>(null);
      const id = useResolvePaperId(paperRef);
      resolvedId = id;
      return (
        <Paper
          ref={paperRef}
          id="paper-resolve-ref"
          width={100}
          height={100}
          renderElement={renderTestElement}
        />
      );
    }

    render(
      <GraphProvider initialElements={EMPTY_ELEMENTS} initialLinks={EMPTY_LINKS}>
        <TestComponent />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(resolvedId).toBe('paper-resolve-ref');
    });
  });

  it('resolved id can be passed to usePaperStore to get the store', async () => {
    let store: ReturnType<typeof usePaperStore> | null = null;

    function TestComponent() {
      const paperRef = useRef<dia.Paper>(null);
      const id = useResolvePaperId(paperRef);
      store = usePaperStore(id);
      return (
        <Paper
          ref={paperRef}
          id="paper-resolve-store"
          width={100}
          height={100}
          renderElement={renderTestElement}
        />
      );
    }

    render(
      <GraphProvider initialElements={EMPTY_ELEMENTS} initialLinks={EMPTY_LINKS}>
        <TestComponent />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(store).not.toBeNull();
      expect(store!.paperId).toBe('paper-resolve-store');
    });
  });
});
