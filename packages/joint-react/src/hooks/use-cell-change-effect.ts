import type { dia } from '@joint/core';
import { useLayoutEffect } from 'react';
import { useGraphStore } from './use-graph-store';
import type { OnChangeOptions } from '../utils/cell/listen-to-cell-change';

const EMPTY_ARRAY: React.DependencyList = [];
interface Options {
  readonly graph: dia.Graph;
  readonly change?: OnChangeOptions;
}

const NOOP_CLEANUP = (): void => {
  // No-op cleanup function
};

/**
 * Hook to handle cell change effects with cleanup support.
 * @param callback - The callback function that receives options and optionally returns a cleanup function.
 * @param dependencies - The dependency array for the effect.
 */
export function useCellChangeEffect(
  callback: (options: Options) => (() => void) | undefined,
  dependencies: React.DependencyList = EMPTY_ARRAY
) {
  const { subscribeToCellChange, graph } = useGraphStore();
  useLayoutEffect(() => {
    const initialCleanup = callback({ graph });
    let cleanup: () => void = typeof initialCleanup === 'function' ? initialCleanup : NOOP_CLEANUP;

    const unsubscribe = subscribeToCellChange?.((change: OnChangeOptions) => {
      cleanup();
      const nextCleanup = callback({ graph, change });
      cleanup = typeof nextCleanup === 'function' ? nextCleanup : NOOP_CLEANUP;
      return NOOP_CLEANUP;
    });

    return () => {
      unsubscribe?.();
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependencies]);
}
