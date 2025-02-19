import { useCallback } from 'react'

/**
 * Merges multiple refs into a single callback ref.
 * It's used currently just internally by the library.
 */
export function useCombinedRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  return useCallback(
    (element: T) => {
      for (const ref of refs) {
        if (!ref) continue
        if (typeof ref === 'function') {
          ref(element)
        } else {
          // Assumes ref is a MutableRefObject
          ;(ref as React.RefObject<T | null>).current = element
        }
      }
    },
    // It is safe to disable exhaustive deps here if refs never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...refs]
  )
}
