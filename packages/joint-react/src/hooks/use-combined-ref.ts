import { useRef, useMemo, type RefObject, type ForwardedRef } from 'react';

/**
 * Sets the value of a forwarded ref, handling both function refs and object refs.
 * @param ref - The forwarded ref to set.
 * @param value - The value to set on the ref.
 * @private
 */
export function setForwardRef<T>(ref: ForwardedRef<T> | undefined, value: T | null) {
  if (!ref) return;

  if (typeof ref === 'function') {
    ref(value);
  } else if ('current' in ref) {
    ref.current = value;
  }
}
/**
 * Custom hook to combine a forwarded ref with an internal ref.
 * This is useful when you want to pass a ref to a component while also keeping a reference to the element internally.
 * @private
 * @param ref - The forwarded ref to combine with the internal ref.
 * @returns A ref object that combines the forwarded ref and the internal ref.
 * @example
 * const MyComponent = forwardRef((props, ref) => {
 *   const combinedRef = useCombinedRef(ref);
 *   return <div ref={combinedRef}>Hello</div>;
 * });
 */
export function useCombinedRef<T>(ref?: ForwardedRef<T>): RefObject<T | null> {
  const innerRef = useRef<T>(null);

  // Assign the forwarded ref DURING COMMIT — when React writes to this object's
  // `current` — not in a passive effect. React attaches refs before layout effects
  // run, and consumers rely on that: a parent that reads the forwarded ref in its own
  // `useLayoutEffect` would see `null` if the assignment were deferred to a passive
  // effect (parent layout effects run first). `useMeasureElement` is exactly such a
  // consumer — it bails on a null node and never re-registers, leaving the element
  // 0x0 in production (StrictMode's remount masks it in dev/tests). A proxy whose
  // setter forwards keeps the `RefObject` read interface (`.current`) callers depend
  // on, which a plain callback ref could not. Keyed on `ref` so a changed forwarded
  // ref re-attaches and receives the current node.
  return useMemo<RefObject<T | null>>(
    () => ({
      get current() {
        return innerRef.current;
      },
      set current(value: T | null) {
        innerRef.current = value;
        setForwardRef(ref, value);
      },
    }),
    [ref]
  );
}
