import {
  useEffect,
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
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  readonly onUpdate?: (instance: Instance) => void | (() => void);
  readonly isDisabled?: boolean;
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
  const { onLoad, onUpdate, isDisabled } = options;
  const [isReady, setIsReady] = useState(false);
  const instanceRef = useRef<Instance | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const hasMounted = useRef(false); // Track initial render

  // Load and cleanup
  useLayoutEffect(() => {
    if (isDisabled) {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      if (instanceRef.current) {
        instanceRef.current = null;
      }
      setIsReady(false); // Explicitly set isReady to false
      return;
    }
    const { instance, cleanup } = onLoad();
    instanceRef.current = instance;
    cleanupRef.current = cleanup;
    setIsReady(true);
    return () => {
      cleanup();
    };
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
    const cleanup = onUpdate(instance);
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { ref: instanceRef, isReady } as ImperativeStateResult<Instance>;
}
