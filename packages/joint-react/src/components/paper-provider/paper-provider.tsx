import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { PaperOptions } from '../../utils/create-paper';
import { createPaper } from '../../utils/create-paper';
import { PaperContext } from '../../context/paper-context';
import type { dia } from '@joint/core';
import { useGraphStore } from '../../hooks/use-graph-store';

export interface PaperProviderProps extends PaperOptions {
  readonly children: ReactNode;
}

/**
 * Paper provider creates a paper instance and provides it to its children.
 * It extends the paper options from the createPaper function.
 * For more information about paper, see the JointJS documentation.
 * @see https://docs.jointjs.com/api/dia/Paper
 * @group Components
 *
 * @example
 * Using provider:
 * ```tsx
 * import { PaperProvider } from '@joint/react'
 *
 * function App() {
 * return (
 * <PaperProvider>
 *    <MyApp />
 * </PaperProvider>
 * )
 * ```
 */
export function PaperProvider({ children, ...paperOptions }: PaperProviderProps) {
  const graphStore = useGraphStore();
  if (!graphStore) {
    throw new Error('PaperProvider must be used within a GraphProvider');
  }

  const [paper] = useState<dia.Paper>(() => createPaper(graphStore.graph, paperOptions));

  // Remove the paper when the component is unmounted.
  useEffect(() => {
    return () => {
      paper.remove();
    };
  }, [paper]);
  return <PaperContext value={paper}>{children}</PaperContext>;
}
