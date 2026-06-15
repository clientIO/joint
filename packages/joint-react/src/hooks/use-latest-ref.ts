import { useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * Returns a ref that always holds the latest `value`, updated in the commit
 * phase (render-phase ref writes are unsafe under the React Compiler).
 *
 * Read `ref.current` inside event handlers or subscription dispatchers to get
 * always-fresh values without listing them as effect dependencies — the
 * `useEffectEvent` pattern (not usable directly while React 18 is supported).
 * @param value - Value to keep current; may change every render.
 * @returns Stable ref whose `current` tracks the last committed `value`.
 * @group Hooks
 * @internal
 */
export function useLatestRef<Value>(value: Value): RefObject<Value> {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
