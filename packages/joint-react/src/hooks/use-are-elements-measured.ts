import { useContext } from 'react';
import { GraphAreElementsMeasuredContext } from '../context';
/**
 * useAreElementMeasured is a custom hook that returns information if nodes are properly measured - they have defined size.
 * It is used to determine if the elements in the graph have been measured.
 * @returns - The value of the GraphAreElementsMeasuredContext.
 * @group Hooks
 * @example
 * ```tsx
 * import { useAreElementMeasured } from '@joint/react';
 *
 * function MyComponent() {
 *   const areMeasured = useAreElementMeasured();
 *   if (!areMeasured) {
 *     return <div>Loading...</div>;
 *   }
 *   return <div>Elements are ready</div>;
 * }
 * ```
 */
export function useAreElementMeasured() {
  return useContext(GraphAreElementsMeasuredContext);
}
