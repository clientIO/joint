import type { dia } from '@joint/core';
import { usePaperContext } from './use-paper-context';

/**
 * Return JointJS `dia.Paper` instance from the current `Paper` context.
 * @see https://docs.jointjs.com/learn/quickstart/paper
 * @group Hooks
 * ```tsx
 * import { usePaper } from '@joint/react';
 * const paper = usePaper();
 * ```
 * @returns - The jointjs paper instance.
 */
export function usePaper(): dia.Paper | undefined {
  const viewConfig = usePaperContext();
  return viewConfig?.paper;
}
