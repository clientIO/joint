import { renderHook } from '@testing-library/react';
import { useGraphStore } from '../use-graph-store';

describe('useGraphStore (error path)', () => {
  it('throws when used outside GraphProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useGraphStore())).toThrow(
      'useGraphStore must be used within a GraphProvider'
    );
    consoleError.mockRestore();
  });
});
