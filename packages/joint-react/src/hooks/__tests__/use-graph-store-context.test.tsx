import { render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { GraphProvider } from '../../components';
import { useGraphStore, useGraphStoreContext } from '../../hooks';
import type { GraphStoreContextId } from '../../store';

interface AccessComponentProps {
  readonly contextId: GraphStoreContextId;
  readonly testId: string;
}

interface CreateContextComponentProps {
  readonly contextId: GraphStoreContextId;
  readonly value: string;
}

interface RegistrationTestCaseProps {
  readonly isRegistered: boolean;
  readonly value: string;
}

interface MountedTestCaseProps {
  readonly isMounted: boolean;
}

function AccessComponent({ contextId, testId }: Readonly<AccessComponentProps>) {
  const value = useGraphStoreContext<string>(contextId);
  return <div data-testid={testId}>{value ?? 'null'}</div>;
}

function CreateContextComponent({ contextId, value }: Readonly<CreateContextComponentProps>) {
  const store = useGraphStore();

  useEffect(() => {
    store.setContext(contextId, value);
    return () => {
      store.removeContext(contextId);
    };
  }, [contextId, store, value]);

  return null;
}

describe('use-graph-store-context', () => {
  it('should update a consumer that renders before the context is registered', async () => {
    const contextId = 'late-context';

    function TestCase({ isRegistered, value }: Readonly<RegistrationTestCaseProps>) {
      return (
        <GraphProvider>
          <AccessComponent contextId={contextId} testId="access-value" />
          {isRegistered ? <CreateContextComponent contextId={contextId} value={value} /> : null}
        </GraphProvider>
      );
    }

    const { rerender } = render(<TestCase isRegistered={false} value="first-value" />);

    expect(document.querySelector('[data-testid="access-value"]')?.textContent).toBe('null');

    rerender(<TestCase isRegistered value="first-value" />);

    await waitFor(() => {
      expect(document.querySelector('[data-testid="access-value"]')?.textContent).toBe('first-value');
    });

    rerender(<TestCase isRegistered value="second-value" />);

    await waitFor(() => {
      expect(document.querySelector('[data-testid="access-value"]')?.textContent).toBe('second-value');
    });

    rerender(<TestCase isRegistered={false} value="second-value" />);

    await waitFor(() => {
      expect(document.querySelector('[data-testid="access-value"]')?.textContent).toBe('null');
    });
  });

  it('should keep number, string, and symbol ids isolated inside one GraphProvider', async () => {
    const stringId = '1';
    const numberId = 1;
    const symbolId = Symbol('context');

    function TestCase() {
      return (
        <GraphProvider>
          <AccessComponent contextId={stringId} testId="string-value" />
          <AccessComponent contextId={numberId} testId="number-value" />
          <AccessComponent contextId={symbolId} testId="symbol-value" />
          <CreateContextComponent contextId={stringId} value="string-value" />
          <CreateContextComponent contextId={numberId} value="number-value" />
          <CreateContextComponent contextId={symbolId} value="symbol-value" />
        </GraphProvider>
      );
    }

    render(<TestCase />);

    await waitFor(() => {
      expect(document.querySelector('[data-testid="string-value"]')?.textContent).toBe('string-value');
      expect(document.querySelector('[data-testid="number-value"]')?.textContent).toBe('number-value');
      expect(document.querySelector('[data-testid="symbol-value"]')?.textContent).toBe('symbol-value');
    });
  });

  it('should reset to null after a creator removes its context', async () => {
    const contextId = 'removable-context';

    function TestCase({ isMounted }: Readonly<MountedTestCaseProps>) {
      return (
        <GraphProvider>
          <AccessComponent contextId={contextId} testId="removable-value" />
          {isMounted ? <CreateContextComponent contextId={contextId} value="mounted-value" /> : null}
        </GraphProvider>
      );
    }

    const { rerender } = render(<TestCase isMounted />);

    await waitFor(() => {
      expect(document.querySelector('[data-testid="removable-value"]')?.textContent).toBe('mounted-value');
    });

    rerender(<TestCase isMounted={false} />);

    await waitFor(() => {
      expect(document.querySelector('[data-testid="removable-value"]')?.textContent).toBe('null');
    });
  });
});
