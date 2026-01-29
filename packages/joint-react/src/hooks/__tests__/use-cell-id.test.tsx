import { renderHook, waitFor } from '@testing-library/react';
import { paperRenderElementWrapper } from '../../utils/test-wrappers';
import { useCellId } from '../use-cell-id';

describe('use-cell-id', () => {
  it('should return cell id when used inside renderElement', async () => {
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        elements: {
          'test-cell-id': {
            id: 'test-cell-id',
            width: 100,
            height: 100,
          },
        },
      },
      paperProps: {
        renderElement: () => <rect />,
      },
    });

    // useCellId can only be used inside renderElement callback
    // But we can test it by using renderHook with the wrapper
    // The wrapper provides the CellIdContext through the Paper component
    const { result } = renderHook(() => useCellId(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current).toBe('test-cell-id');
    });
  });

  it('should throw error when used outside renderElement', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useCellId(), {
        wrapper: ({ children }) => <>{children}</>,
      });
    }).toThrow('useCellId must be used inside Paper renderElement');
    consoleError.mockRestore();
  });
});
