import { render, renderHook, waitFor } from '@testing-library/react';
import { graphProviderWrapper, paperRenderElementWrapper } from '../../utils/test-wrappers';
import { usePaperStore } from '../use-paper';

describe('use-paper-context', () => {
  const graphWrapper = graphProviderWrapper({
    elements: {},
    links: {},
  });

  const wrapper = paperRenderElementWrapper({
    graphProviderProps: {
      elements: {
        '1': {
          width: 100,
          height: 100,
        },
      },
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

  it('should throw error when used outside Paper and isNullable is false', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => usePaperStore(), {
        wrapper: graphWrapper,
      });
    }).toThrow('usePaperStore must be used within a Paper or RenderElement');
    consoleError.mockRestore();
  });

  it('should return null when used outside Paper and isNullable is true', () => {
    const { result } = renderHook(() => usePaperStore(true), { wrapper: graphWrapper });

    expect(result.current).toBeNull();
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
