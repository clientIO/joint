import { useEffect, useState, type RefObject } from 'react';
const MAX_REF_LOAD_CHECKS = 2;
/**
 * A hook that monitors a ref and updates state when the ref's current value is set.
 * It repeatedly checks the ref's current value using requestAnimationFrame until it is set
 * or until a maximum number of checks is reached.
 * We retry max 2 times, most of the time the ref is set on the first or second frame.
 * But for example in our case for paper, or graph, it may take a bit longer.
 * @param ref - The ref to monitor.
 * @returns The current value of the ref once it is set, or undefined if not set within the limit.
 * @private
 * @group Hooks
 */
export function useRefValue<T>(ref: RefObject<T> | undefined): T | undefined {
  const [refValue, setRefValue] = useState<T | undefined>(() => ref?.current ?? undefined);

  useEffect(() => {
    let loadCounts = 0;
    /**
     * Check the ref value and update state when available
     */
    function checkRef() {
      if (!ref?.current) {
        if (loadCounts > MAX_REF_LOAD_CHECKS) {
          return;
        }
        requestAnimationFrame(() => {
          loadCounts += 1;
          checkRef();
        });
        return;
      }
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setRefValue((previous) => {
        if (previous !== ref.current) {
          return ref.current;
        }
        return previous;
      });
    }
    checkRef();
  }, [ref]);

  return refValue;
}
