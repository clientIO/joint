import { useCallback } from 'react';

/**
 * Merges multiple refs into a single callback ref.
 * It's used currently just internally by the library.
 * @param refs
 * @group Hooks
 * @internal
 * @description
 * This function is used to merge multiple refs into a single callback ref.
 * @returns A callback ref that can be used to set multiple refs.
 * @private
 * @example
 * ```ts
 * const ref1 = useRef(null);
 * const ref2 = useRef(null);
 * const combinedRef = useCombinedRefs(ref1, ref2);
 * <div ref={combinedRef} />
 * ```
 */
export function useCombinedRefs<AnyT>(
  ...refs: Array<React.Ref<AnyT> | undefined>
): React.RefCallback<AnyT> {
  return useCallback(
    (element: AnyT) => {
      for (const ref of refs) {
        if (!ref) continue;
        if (typeof ref === 'function') {
          ref(element);
        } else {
          // Assumes ref is a MutableRefObject
          (ref as React.RefObject<AnyT | null>).current = element;
        }
      }
    },
    // It is safe to disable exhaustive deps here if refs never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...refs]
  );
}
