import { useRef, useEffect, type RefObject, type ForwardedRef } from 'react';

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

  useEffect(() => {
    if (!ref) return;

    if (typeof ref === 'function') {
      ref(innerRef.current);
    } else if ('current' in ref) {
      (ref as React.MutableRefObject<T | null>).current = innerRef.current;
    }
  }, [ref]);

  return innerRef;
}
