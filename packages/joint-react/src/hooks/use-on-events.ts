import { useLayoutEffect } from 'react';
import type { mvc } from '@joint/core';
import { useLatestRef } from './use-latest-ref';

// NUL never appears in event names (keys may contain spaces — mvc supports
// space-delimited multi-event keys like 'render:done render:idle'), so the
// joined signature cannot collide.
const KEY_SIGNATURE_SEPARATOR = '\u0000';

/**
 * Builds the sorted, joined signature of the **active** event names (keys whose
 * handler is currently defined). The subscription re-runs only when this string
 * changes, handler identity never does.
 * @param handlers - Handler map; entries with an `undefined` value are inactive.
 * @returns Stable signature string for the active event-name set.
 */
function getActiveEventSignature(handlers: Partial<mvc.EventMap>): string {
  return Object.keys(handlers)
    .filter((eventName) => handlers[eventName] != null)
    .toSorted((a, b) => a.localeCompare(b))
    .join(KEY_SIGNATURE_SEPARATOR);
}

/**
 * Base of the `useOn*Events` hook family (`useOnPaperEvents`,
 * `useOnGraphEvents`, plugin hooks like `useOnKeyboardEvents`).
 *
 * Subscribes `handlers` on `target` with **always-latest** handler semantics
 * (the `useEffectEvent` pattern): the subscription is established once and
 * dispatch reads the current handler from a ref at event time. Consumers can
 * pass inline handler maps, no `useCallback`/`useMemo` needed, no stale
 * closures, no re-subscription churn when a handler's identity changes.
 *
 * Re-subscribes only when `target` changes or the **set of active event names**
 * changes, i.e. a handler is added or removed (toggled to/from `undefined`),
 * mirroring how `onClick={undefined}` binds no listener. A handler swapped for
 * another function under the same key is picked up live, without re-subscribing.
 * @param target - Object to subscribe on; `null`/`undefined` skips subscription.
 * @param handlers - Map of event names to handlers; may be a fresh object every render.
 * @param subscribe - Stable adapter wiring the map onto the target; returns a cleanup callback.
 * @group Hooks
 * @internal
 */
export function useOnEvents<Target, HandlerMap extends Partial<mvc.EventMap>>(
  target: Target | null | undefined,
  handlers: HandlerMap,
  subscribe: (target: Target, handlers: HandlerMap) => () => void
): void {
  const handlersRef = useLatestRef(handlers);

  const activeEventSignature = getActiveEventSignature(handlers);

  useLayoutEffect(() => {
    if (!target) return;
    const liveHandlers: Partial<mvc.EventMap> = {};
    for (const eventName of Object.keys(handlersRef.current)) {
      if (handlersRef.current[eventName] == null) continue;
      liveHandlers[eventName] = (...args: Parameters<mvc.EventHandler>) => {
        handlersRef.current[eventName]?.(...args);
      };
    }
    return subscribe(target, liveHandlers as HandlerMap);
    // `activeEventSignature` stands in for `handlers`: handler identity must NOT
    // re-subscribe — only the active event-name set (and target) does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, subscribe, activeEventSignature]);
}
