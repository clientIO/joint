import type { dia } from '@joint/core';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GraphProvider, Paper } from '../../components';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { usePaper } from '../use-paper';

const EMPTY_ELEMENTS = {};
const EMPTY_LINKS = {};

function renderTestElement() {
  return <rect width={10} height={10} />;
}

function createPaperWrapper(paperId = 'paper-under-test') {
  return ({ children }: { children: ReactNode }) => (
    <GraphProvider elements={EMPTY_ELEMENTS} links={EMPTY_LINKS}>
      <Paper id={paperId} width={100} height={100} renderElement={renderTestElement}>
        {children}
      </Paper>
    </GraphProvider>
  );
}

describe('use-paper', () => {
  const graphWrapper = graphProviderWrapper({
    elements: EMPTY_ELEMENTS,
    links: EMPTY_LINKS,
  });

  it('returns paper instance from Paper context', async () => {
    const wrapper = createPaperWrapper('paper-context');
    const { result } = renderHook(() => usePaper({ isNullable: true }), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current).toHaveProperty('trigger');
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
      expect(result.current).not.toBeNull();
      expect(result.current).toHaveProperty('trigger');
    });
  });

  it('returns null when paper id is not found', async () => {
    const wrapper = createPaperWrapper('existing-paper');
    const { result } = renderHook(() => usePaper('missing-paper'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });

  it('returns stable paper instance for the same id across rerenders', async () => {
    const wrapper = createPaperWrapper('paper-stable');
    const { result, rerender } = renderHook(() => usePaper('paper-stable'), { wrapper });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    const firstPaper = result.current as dia.Paper;
    rerender();

    await waitFor(() => {
      expect(result.current).toBe(firstPaper);
    });
  });

  it('returns null when usePaper({ isNullable: true }) is used outside Paper context', () => {
    const { result } = renderHook(() => usePaper({ isNullable: true }), { wrapper: graphWrapper });

    expect(result.current).toBeNull();
  });

  it('throws when usePaper(id) is used outside GraphProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => usePaper('paper-by-id'));
    }).toThrow('useGraphStore must be used within a GraphProvider');

    consoleError.mockRestore();
  });
});
