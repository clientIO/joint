import { render, waitFor } from '@testing-library/react';
import { GraphProvider } from '../graph-provider';
import { GraphStore } from '../../../store';

describe('GraphProvider — store integration', () => {
  it('does not destroy the store on unmount when an external store is supplied (cleanup early-return branch)', async () => {
    const externalStore = new GraphStore({});
    const destroySpy = jest.spyOn(externalStore, 'destroy');
    const { unmount } = render(
      <GraphProvider store={externalStore}>
        <span>child</span>
      </GraphProvider>
    );
    await waitFor(() => {
      // ensure we mounted
      expect(externalStore.graph).toBeDefined();
    });
    unmount();
    expect(destroySpy).not.toHaveBeenCalled();
    // Clean up the external store ourselves
    externalStore.destroy(false);
  });
});
