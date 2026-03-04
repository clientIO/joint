import type { dia } from '@joint/core';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GraphProvider, Paper } from '../../components';
import { usePaper, usePaperById } from '../use-paper';

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
  it('returns paper instance from Paper context', async () => {
    const wrapper = createPaperWrapper('paper-context');
    const { result } = renderHook(() => usePaper(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current).toHaveProperty('trigger');
    });
  });

  it('throws when used outside Paper context', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => usePaper());
    }).toThrow('usePaperStoreContext must be used within a Paper or RenderElement');

    consoleError.mockRestore();
  });

  it('returns paper by id from GraphProvider', async () => {
    const wrapper = createPaperWrapper('paper-by-id');
    const { result } = renderHook(() => usePaperById('paper-by-id'), { wrapper });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current).toHaveProperty('trigger');
    });
  });

  it('returns null when paper id is not found', async () => {
    const wrapper = createPaperWrapper('existing-paper');
    const { result } = renderHook(() => usePaperById('missing-paper'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });

  it('returns stable paper instance for the same id across rerenders', async () => {
    const wrapper = createPaperWrapper('paper-stable');
    const { result, rerender } = renderHook(() => usePaperById('paper-stable'), { wrapper });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    const firstPaper = result.current as dia.Paper;
    rerender();

    await waitFor(() => {
      expect(result.current).toBe(firstPaper);
    });
  });

  it('throws when usePaperById is used outside GraphProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => usePaperById('paper-by-id'));
    }).toThrow('useGraphStore must be used within a GraphProvider');

    consoleError.mockRestore();
  });
});
