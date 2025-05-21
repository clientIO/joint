import { useContext } from 'react';
import { PaperContext } from '../context/paper-context';
import type { dia } from '@joint/core';
export const EMPTY_ARRAY = [] as const;
/**
 * Return jointjs paper instance from the paper context.
 * @see https://docs.jointjs.com/learn/quickstart/paper
 * @group Hooks
 * ```tsx
 * import { usePaper } from '@joint/react';
 * const paper = usePaper();
 * ```
 * @returns - The jointjs paper instance.
 * @throws - If the hook is not used inside the paper context.
 */
export function usePaper(): dia.Paper {
  const [paperCtx] = useContext(PaperContext) ?? EMPTY_ARRAY;
  if (!paperCtx) {
    throw new Error('usePaper must be used within a `PaperProvider` or `Paper` component');
  }
  return paperCtx.paper;
}
