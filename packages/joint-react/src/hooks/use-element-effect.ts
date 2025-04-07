/* eslint-disable react-hooks/exhaustive-deps */
import type { dia } from '@joint/core';
import { useCallback, useEffect } from 'react';
import { useGraph } from './use-graph';

const DEFAULT_DEPENDENCIES: unknown[] = [];

/**
 * Custom effect hook to trigger change for the elements based on the dependencies list. Similar how react useEffect works.
 * @experimental This may be removed or changed in the future as we are not sure if this is the best approach.
 * @group Hooks
 * @param idOrIds - The ID or array of IDs of the JointJS elements.
 * @param onChange - Callback function to execute when the element changes with `dia.Element` as a callback parameter.
 * @param dependencies - Array of dependencies for the useEffect hook - observe for the changes, same as `useEffect`.
 * @example
 * ```tsx
 * const [isPressed, setIsPressed] = useState(false);
   useElementEffect(
     id,
     (element) => {
       element.attr({
         rect: {
           fill: 'blue',
           stroke: isPressed ? 'red' : 'black',
           strokeWidth: 10,
         },
       });
     },
     [isPressed] // listen to react changes
   );
 * ```
 */
export function useElementEffect(
  idOrIds: dia.Cell.ID | dia.Cell.ID[] | undefined,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  onChange: (element: dia.Element) => (() => void) | void,
  dependencies: unknown[] = DEFAULT_DEPENDENCIES
) {
  const graph = useGraph();

  const resolve = useCallback(
    (id: dia.Cell.ID) => {
      const element = graph.getCell(id);
      if (!element) {
        return;
      }
      if (!element.isElement()) {
        return;
      }
      const cleanup = onChange(element);
      return cleanup;
    },
    [graph, onChange]
  );
  useEffect(() => {
    if (idOrIds === undefined) {
      return;
    }
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    const cleanups = ids.map(resolve);
    return () => {
      for (const cleanup of cleanups) {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      }
    };
  }, [graph, idOrIds, onChange, ...dependencies]);
}
