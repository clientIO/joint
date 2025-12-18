import type { dia } from '@joint/core';
import { usePaperStoreContext } from './use-paper-context';

/**
 * Return JointJS `dia.Paper` instance from the current `Paper` context.
 * @see https://docs.jointjs.com/learn/quickstart/paper
 * @group Hooks
 * @returns - The jointjs paper instance.
 * @example
 * ```tsx
 * import { usePaper } from '@joint/react';
 *
 * function MyComponent() {
 *   const paper = usePaper();
 *   // Use paper instance to interact with the JointJS paper
 *   return null;
 * }
 * ```
 */
export function usePaper(): dia.Paper {
  const paperStore = usePaperStoreContext();
  return paperStore.paper;
}
