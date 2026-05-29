import { render, renderHook, waitFor } from '@testing-library/react';
import { graphProviderWrapper, paperRenderElementWrapper } from '../../utils/test-wrappers';
import { usePaperStore } from '../use-paper';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import type { CellRecord } from '../../types/cell.types';

describe('use-paper-context', () => {
  const graphWrapper = graphProviderWrapper({
    initialCells: [],
  });

  const wrapper = paperRenderElementWrapper({
    graphProviderProps: {
      initialCells: [
        {
          id: '1',
          type: ELEMENT_MODEL_TYPE,
          size: { width: 100, height: 100 },
        } as CellRecord,
      ],
    },
    paperProps: {
      id: 'paper-store-under-test',
      renderElement: () => <rect />,
    },
  });

  it('should return paper context when used inside Paper', async () => {
    let capturedContext: ReturnType<typeof usePaperStore> | null = null;
    const TestComponent = () => {
      const context = usePaperStore();
      capturedContext = context;
      return null;
    };

    render(<TestComponent />, { wrapper });

    await waitFor(() => {
      expect(capturedContext).not.toBeNull();
      expect(capturedContext).toBeDefined();
    });

    expect(capturedContext).toHaveProperty('paper');
    expect(capturedContext).toHaveProperty('paperId');
  });

  it('should return undefined when used outside Paper (no default paper mounted)', () => {
    const { result } = renderHook(() => usePaperStore(), {
      wrapper: graphWrapper,
    });

    expect(result.current).toBeUndefined();
  });

  it('should return paper store by id from GraphProvider', async () => {
    const { result } = renderHook(() => usePaperStore('paper-store-under-test'), { wrapper });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current).toHaveProperty('paper');
      expect(result.current).toHaveProperty('paperId');
    });
  });
});
