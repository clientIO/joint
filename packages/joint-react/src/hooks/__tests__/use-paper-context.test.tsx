import { render, renderHook, waitFor } from '@testing-library/react';
import { paperRenderElementWrapper } from '../../utils/test-wrappers';
import { usePaperContext } from '../use-paper-context';

describe('use-paper-context', () => {
  const wrapper = paperRenderElementWrapper({
    graphProviderProps: {
      elements: [
        {
          id: '1',
          width: 100,
          height: 100,
        },
      ],
    },
    paperProps: {
      renderElement: () => <rect />,
    },
  });

  it('should return paper context when used inside Paper', async () => {
    let capturedContext: ReturnType<typeof usePaperContext> | null = null;
    const TestComponent = () => {
      const context = usePaperContext();
      capturedContext = context;
      return null;
    };

    render(<TestComponent />, { wrapper });

    await waitFor(() => {
      expect(capturedContext).not.toBeNull();
      expect(capturedContext).toBeDefined();
    });

    expect(capturedContext).toHaveProperty('paper');
    expect(capturedContext).toHaveProperty('id');
    expect(capturedContext).toHaveProperty('portsStore');
    expect(capturedContext).toHaveProperty('elementViews');
  });

  it('should throw error when used outside Paper and isNullable is false', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => usePaperContext(false), {
        wrapper: ({ children }) => <>{children}</>,
      });
    }).toThrow('usePaperContext must be used within a Paper or RenderElement');
    consoleError.mockRestore();
  });

  it('should return null when used outside Paper and isNullable is true', () => {
    const { result } = renderHook(() => usePaperContext(true));

    expect(result.current).toBeNull();
  });
});
