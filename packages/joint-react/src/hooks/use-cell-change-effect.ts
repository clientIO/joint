import type { dia } from '@joint/core';
import { useLayoutEffect } from 'react';
import { useGraphStore } from './use-graph-store';
import type { OnChangeOptions } from '../utils/cell/listen-to-cell-change';

const EMPTY_ARRAY: React.DependencyList = [];
interface Options {
  readonly graph: dia.Graph;
  readonly change?: OnChangeOptions;
}

export function useCellChangeEffect(
  callback: ((options: Options) => void) | ((options: Options) => () => void),
  dependencies: React.DependencyList = EMPTY_ARRAY
) {
  const { subscribeToCellChange, graph } = useGraphStore();
  useLayoutEffect(() => {
    let cleanup = callback({ graph });
    const unsubscribe = subscribeToCellChange?.((change) => {
      cleanup?.();
      cleanup = callback({ graph, change });
    });
    return () => {
      unsubscribe?.();
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependencies]);
}
