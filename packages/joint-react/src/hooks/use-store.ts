import { useMemo, useRef } from 'react';

export interface Store {
  readonly subscribe: (onStoreChange: () => void) => () => void;
  readonly notifySubscribers: () => void;
}

/**
 * Hook to create a store instance.
 * @internal
 * @returns The store instance.
 */
export function useStore(onChange?: () => void): Store {
  const isScheduled = useRef(false);
  const subscribers = useRef(new Set<() => void>());

  return useMemo(
    (): Store => ({
      subscribe: (onStoreChange: () => void) => {
        subscribers.current.add(onStoreChange);
        return () => {
          subscribers.current.delete(onStoreChange);
        };
      },
      notifySubscribers: () => {
        if (!isScheduled.current) {
          isScheduled.current = true;
          requestAnimationFrame(() => {
            for (const subscriber of subscribers.current) {
              subscriber();
            }
            onChange?.();
            isScheduled.current = false;
          });
        }
      },
    }),
    [onChange]
  );
}
