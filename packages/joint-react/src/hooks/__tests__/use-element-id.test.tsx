import { renderHook, waitFor } from '@testing-library/react';
import { paperRenderElementWrapper } from '../../utils/test-wrappers';
import { useElementId } from '../use-element-id';

describe('use-element-id', () => {
  it('should return element id when used inside renderElement', async () => {
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        elements: {
          'test-cell-id': {
            width: 100,
            height: 100,
          },
        },
      },
      paperProps: {
        renderElement: () => <rect />,
      },
    });

    const { result } = renderHook(() => useElementId(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current).toBe('test-cell-id');
    });
  });

  it('should throw error when used outside renderElement', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useElementId(), {
        wrapper: ({ children }) => <>{children}</>,
      });
    }).toThrow('useElementId must be used inside Paper renderElement');
    consoleError.mockRestore();
  });
});
