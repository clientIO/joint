import {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type DependencyList,
  type RefObject,
} from 'react';

/**
 * Return value from the onLoad callback.
 * @template Instance - The type of the instance being created
 */
interface OnLoadReturn<Instance> {
  /** The created instance */
  readonly instance: Instance;
  /** Cleanup function to call when the instance is destroyed */
  readonly cleanup: () => void;
}

/**
 * Options for the useImperativeApi hook.
 * @template Instance - The type of the instance being managed
 */
export interface UseImperativeApiOptions<Instance, InstanceSelector = Instance> {
  /**
   * Function called to create the instance.
   * Should return the instance and a cleanup function.
   */
  readonly onLoad: () => OnLoadReturn<Instance>;

  /**
   * Optional function called when dependencies change.
   * Can return a cleanup function that will be called before the next update.
   * @param instance - The current instance
   * @param reset - Function to reset the instance by calling onLoad again
   * @returns Optional cleanup function
   */
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  readonly onUpdate?: (instance: Instance, reset: () => void) => void | (() => void);
  /**
   * Optional callback called when the ready state changes.
   * @param isReady - Whether the instance is ready
   * @param instance - The instance (null if not ready)
   */
  readonly onReadyChange?: (isReady: boolean, instance: Instance | null) => void;
  /**
   * Whether the instance creation is disabled.
   * When true, the instance will be cleaned up and not created.
   */
  readonly isDisabled?: boolean;
  /**
   * Optional ref to forward the instance to.
   */
  readonly forwardedRef?: React.Ref<InstanceSelector>;
  readonly instanceSelector?: (instance: Instance) => InstanceSelector;
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
 * A hook that provides an imperative API for managing an instance lifecycle.
 *
 * This hook handles:
 * - Creating instances via onLoad callback
 * - Updating instances when dependencies change
 * - Cleaning up instances when unmounted or disabled
 * - Exposing instances via refs
 * - Tracking ready state
 *
 * Used internally by components like GraphProvider and Paper to manage their instances.
 * @template Instance - The type of the instance being managed
 * @param options - Configuration options including onLoad, onUpdate, and callbacks
 * @param dependencies - Dependencies array that triggers onUpdate when changed
 * @returns An object containing a ref to the instance and a readiness flag
 * @private
 * @group Hooks
 */
export function useImperativeApi<Instance, InstanceSelector = Instance>(
  options: UseImperativeApiOptions<Instance, InstanceSelector>,
  dependencies: DependencyList
): ImperativeStateResult<Instance> {
  const { onLoad, onUpdate, onReadyChange, instanceSelector, isDisabled, forwardedRef } = options;
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
  useLayoutEffect(() => {
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
  useImperativeHandle(
    forwardedRef,
    () =>
      instanceSelector
        ? instanceSelector(instanceRef.current!)
        : (instanceRef.current! as unknown as InstanceSelector),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [instanceRef, isReady]
  );

  return { ref: instanceRef, isReady } as ImperativeStateResult<Instance>;
}
