import { render, renderHook, waitFor } from '@testing-library/react';
import { paperRenderElementWrapper } from '../../utils/test-wrappers';
import { usePaperStoreContext } from '../use-paper-context';

describe('use-paper-context', () => {
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
      renderElement: () => <rect />,
    },
  });

  it('should return paper context when used inside Paper', async () => {
    let capturedContext: ReturnType<typeof usePaperStoreContext> | null = null;
    const TestComponent = () => {
      const context = usePaperStoreContext();
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
    expect(capturedContext).toHaveProperty('renderPaper');
  });

  it('should throw error when used outside Paper and isNullable is false', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => usePaperStoreContext(false), {
        wrapper: ({ children }) => <>{children}</>,
      });
    }).toThrow('usePaperStoreContext must be used within a Paper or RenderElement');
    consoleError.mockRestore();
  });

  it('should return null when used outside Paper and isNullable is true', () => {
    const { result } = renderHook(() => usePaperStoreContext(true));

    expect(result.current).toBeNull();
  });
});
