import { createContext, useContext } from 'react';
import type { ControlledPaper } from '../../models/controlled-paper';

/**
 * React context for ReactPaper component.
 * Provides access to the ControlledPaper instance.
 * @experimental
 */
export const ReactPaperContext = createContext<ControlledPaper | null>(null);

/**
 * Hook to access the ControlledPaper instance from ReactPaper context.
 *
 * Must be used within a ReactPaper component.
 * @returns The ControlledPaper instance, or null if not yet initialized
 * @group Hooks
 * @experimental
 * @example
 * ```tsx
 * function MyComponent() {
 *   const paper = useReactPaper();
 *
 *   // Use paper instance for interactions
 *   return <div>...</div>;
 * }
 * ```
 */
export function useReactPaper(): ControlledPaper | null {
  return useContext(ReactPaperContext);
}
