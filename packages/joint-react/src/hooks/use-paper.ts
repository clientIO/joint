import type { dia } from '@joint/core';
import { usePaperStoreById, usePaperStoreContext } from './use-paper-context';

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

/**
 * Return JointJS `dia.Paper` instance from a specific `Paper` context by id.
 * @see https://docs.jointjs.com/learn/quickstart/paper
 * @group Hooks
 * @param id - The id of the Paper context to access.
 * @returns - The jointjs paper instance or null if not found.
 * @example
 * ```tsx
 * import { usePaperById } from '@joint/react';
 *
 * function MyComponent() {
 *   const paper = usePaperById('my-paper-id');
 *   // Use paper instance to interact with the JointJS paper
 *   return null;
 * }
 * ```
 */
export function usePaperById(id: string): dia.Paper | null {
  const paperStoreById = usePaperStoreById(id);
  return paperStoreById?.paper ?? null;
}
