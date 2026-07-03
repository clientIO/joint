import { renderHook } from '@testing-library/react';
import { CellIdContext } from '../../context';
import { useCellId } from '../use-cell-id';

describe('useCellId', () => {
  it('returns the id when wrapped in CellIdContext', () => {
    const { result } = renderHook(() => useCellId(), {
      wrapper: ({ children }) => (
        <CellIdContext.Provider value="my-cell">{children}</CellIdContext.Provider>
      ),
    });
    expect(result.current).toBe('my-cell');
  });

  it('throws when used outside CellIdContext', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useCellId())).toThrow(
      'useCellId() must be used inside renderElement or renderLink'
    );
    consoleError.mockRestore();
  });
});
