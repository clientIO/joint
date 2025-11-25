import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type DependencyList,
  type RefObject,
} from 'react';

interface OnLoadReturn<Instance> {
  readonly instance: Instance;
  readonly cleanup: () => void;
}

export interface UseImperativeApiOptions<Instance> {
  readonly onLoad: () => OnLoadReturn<Instance>;

  /**
   *
   * @param instance
   * @param reset - reset will call the onLoad function again to reset the instance
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  readonly onUpdate?: (instance: Instance, reset: () => void) => void | (() => void);
  readonly onReadyChange?: (isReady: boolean, instance: Instance | null) => void;
  readonly isDisabled?: boolean;
  readonly forwardedRef?: React.Ref<Instance>;
}

interface ResultBase<Instance> {
  readonly ref: RefObject<Instance | null>;
  readonly isReady: boolean;
}

interface ResultReady<Instance> extends ResultBase<Instance> {
  readonly ref: RefObject<Instance>;
  readonly isReady: true;
}

interface ResultNotReady<Instance> extends ResultBase<Instance> {
  readonly ref: RefObject<null>;
  readonly isReady: false;
}

export type ImperativeStateResult<Instance> = ResultReady<Instance> | ResultNotReady<Instance>;

/**
 * A hook that provides an imperative API for managing an instance of anything.
 * It supports two modes: 'ref' and 'state'.
 * In 'ref' mode, it returns a ref object that holds the instance.
 * In 'state' mode, it returns the instance as state.
 * @param options - The options for the hook, including onLoad, onUpdate, and type.
 * @param dependencies - The dependencies array for the onUpdate effect. Only applied for `onUpdate`.
 * @returns An object containing either a ref or state instance and a readiness flag.
 * @private
 * @group Hooks
 */
export function useImperativeApi<Instance>(
  options: UseImperativeApiOptions<Instance>,
  dependencies: DependencyList
): ImperativeStateResult<Instance> {
  const { onLoad, onUpdate, onReadyChange, isDisabled, forwardedRef } = options;
  const [isReady, setIsReady] = useState(false);
  const instanceRef = useRef<Instance | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const hasMounted = useRef(false); // Track initial render

  const onLoadCallback = useCallback(() => {
    if (isDisabled) {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      if (instanceRef.current) {
        instanceRef.current = null;
      }
      setIsReady(false); // Explicitly set isReady to false
      onReadyChange?.(false, null);
      return;
    }
    const { instance, cleanup } = onLoad();
    instanceRef.current = instance;
    cleanupRef.current = cleanup;
    setIsReady(true);
    onReadyChange?.(true, instance);
    return () => {
      cleanup();
    };
    // we update cache only by dependencies change and isDisabled
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDisabled, ...dependencies]);

  // Load and cleanup
  useLayoutEffect(() => {
    const cleanup = onLoadCallback();
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
    // this is called only when disabled - disabled mean, we remove the instance and cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDisabled]);

  // Update
  useEffect(() => {
    if (!onUpdate || !hasMounted.current) {
      hasMounted.current = true; // Skip first render
      return;
    }
    const { current: instance } = instanceRef;
    if (!instance) {
      return;
    }
    const cleanup = onUpdate(instance, onLoadCallback);
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
    // we update cache only by dependencies change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  // Expose the instance via the forwarded ref, if there is one
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useImperativeHandle(forwardedRef, () => instanceRef.current!, [instanceRef, isReady]);

  return { ref: instanceRef, isReady } as ImperativeStateResult<Instance>;
}
