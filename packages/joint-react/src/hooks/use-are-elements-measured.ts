import { useContext } from 'react';
import { GraphAreElementsMeasuredContext } from '../context';
/**
 * useAreElementMeasured is a custom hook that returns information if nodes are properly measured - they have defined size.
 * It is used to determine if the elements in the graph have been measured.
 * @returns - The value of the GraphAreElementsMeasuredContext.
 */
export function useAreElementMeasured() {
  return useContext(GraphAreElementsMeasuredContext);
}
