import { use } from 'react';
import { PaperContext } from '../context/paper-context';

/**
 * Return jointjs paper instance from the paper context.
 * @see https://docs.jointjs.com/learn/quickstart/paper
 * @group Hooks
 * ```tsx
 * import { usePaper } from '@joint/react';
 * const paper = usePaper();
 * ```
 */
export function usePaper(): PaperContext {
  const paper = use(PaperContext);
  if (!paper) {
    throw new Error('usePaper must be used within a `PaperProvider` or `Paper` component');
  }
  return paper;
}
