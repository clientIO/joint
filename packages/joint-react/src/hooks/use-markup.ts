import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { usePaper } from './use-paper';
import { useCellId } from './use-cell-id';
import { PORTAL_SELECTOR } from '../mvc/element-model';

/**
 * Options for {@link MarkupApi}'s `magnetRef`.
 * @expand
 * @group Types
 */
export interface MagnetRefOptions {
  /**
   * When `true`, the magnet is passive: a valid connection target but not a
   * source. When `false`, it is active and links can also start from it.
   * @default false
   */
  readonly passive?: boolean;
}

/**
 * The pointer/mouse event accepted by {@link MarkupApi.startLinkDrag}. Both a React
 * synthetic event (from e.g. `onPointerDown`) and a native DOM `PointerEvent`/`MouseEvent`
 * satisfy this shape.
 * @expand
 * @group Types
 */
export interface StartLinkDragEvent {
  readonly clientX: number;
  readonly clientY: number;
  readonly button: number;
  readonly target: EventTarget | null;
}

/**
 * Markup utilities returned by {@link useMarkup}.
 * @expand
 * @group Types
 */
export interface MarkupApi {
  /**
   * Returns a React ref callback that registers the node under the given selector
   * name so links and tools can target it by name.
   *
   * The returned callback is STABLE per selector name for the life of the component
   * (memoized), so React attaches it once on mount and cleans up once on unmount —
   * it does not re-register on every render.
   * @param selector - Unique selector name within the element (e.g. `'body'`, `'item-0'`).
   * @throws If `selector` is one of the reserved names (`__portal__`, `root`, `portRoot`).
   */
  readonly selectorRef: (selector: string) => (node: Element | null) => void;
  /**
   * Returns a React ref callback that registers the node under the given selector name
   * AND marks it as a JointJS magnet, a valid endpoint for link connections.
   *
   * The returned callback is STABLE per `(selector, passive)` pair for the life of the
   * component (memoized), so it registers once on mount and cleans up once on unmount.
   * @param selector - Unique selector name within the element (e.g. `'port-in'`, `'row-0'`).
   * @param options - Magnet behavior options.
   * @throws If `selector` is one of the reserved names (`__portal__`, `root`, `portRoot`).
   */
  readonly magnetRef: (
    selector: string,
    options?: MagnetRefOptions
  ) => (node: Element | null) => void;
  /**
   * Imperatively start dragging a new link from a magnet, in response to a pointer
   * event on a control INSIDE that magnet.
   *
   * JointJS refuses to start a magnet link-drag when the pressed element is a form
   * control (`<button>`, `<input>`, `<select>`, `<textarea>`, `<option>`) so that
   * clicking those controls keeps working. That also means a link can never START by
   * dragging from such a control. Call `startLinkDrag` from the control's own
   * `onPointerDown` to begin the link anyway: it re-dispatches the press onto the magnet
   * node itself (which is not a form control), so joint's own event pipeline arms the
   * drag. A plain click still fires the control's `onClick` (with
   * `magnetThreshold: 'onleave'` the link only forms once the pointer leaves the magnet),
   * so click and drag-to-connect coexist on the same control.
   *
   * The magnet is located from `event.target` (the nearest ancestor carrying a
   * `magnet` attribute), or pass an explicit `selector` registered via `magnetRef`.
   * @param event - The pointer/mouse event that began the gesture (React synthetic or native).
   * @param selector - Optional magnet selector name; if omitted, the nearest `[magnet]` ancestor of the event target is used.
   * @example
   * ```tsx
   * const { magnetRef, startLinkDrag } = useMarkup();
   * // the row is the magnet; every control inside it can also start a link on drag
   * <div ref={magnetRef('row-0', { active: true })}>
   *   <button onPointerDown={startLinkDrag} onClick={toggle}>NN</button>
   * </div>
   * ```
   */
  readonly startLinkDrag: (event: StartLinkDragEvent, selector?: string) => void;
}

/**
 * Register SVG sub-elements as JointJS selectors (and optionally magnets) on
 * the current element view, so links and tools can target named parts of a
 * React-rendered element. Must be used inside `renderElement`.
 * @group Hooks
 * @returns The {@link MarkupApi}: a `selectorRef` factory that tags an SVG node
 * under a named selector so links and tools can target it, a `magnetRef` factory
 * that does the same and also marks the node as a connectable magnet, and a
 * `startLinkDrag` handler that begins a link from a control inside a magnet.
 * @example
 * ```tsx
 * import { useMarkup } from '@joint/react';
 *
 * function MyComponent({ labels }: { labels: string[] }) {
 *   const { selectorRef, magnetRef } = useMarkup();
 *   return (
 *     // Tag the group as the 'body' selector so tools can target it.
 *     <g ref={selectorRef('body')}>
 *       {labels.map((label, index) => (
 *         // Each row is a magnet, so links can connect to it.
 *         <g ref={magnetRef(`item-${index}`)} key={label}>
 *           <text>{label}</text>
 *         </g>
 *       ))}
 *     </g>
 *   );
 * }
 * ```
 */
export function useMarkup(): MarkupApi {
  const { paper } = usePaper();
  const id = useCellId();

  // Live values read at call-time (the `useLatest` pattern), so the ref callbacks and
  // `startLinkDrag` never need to change identity when `paper`/`id` change. Updated in a
  // layout effect (not during render); the ref callbacks only fire on mount/unmount now,
  // and by unmount this holds the latest committed values.
  const latestRef = useRef<{ readonly paper: typeof paper; readonly id: typeof id }>({ paper, id });
  useLayoutEffect(() => {
    latestRef.current = { paper, id };
  });

  const applySelector = useCallback((node: Element | null, selector: string) => {
    const { paper: livePaper, id: liveId } = latestRef.current;
    const elementView = livePaper?.getCellView(liveId);
    if (!elementView) return;
    // `selectors` can already be gone when the view is mid-teardown: a fast unmount /
    // virtual-rendering removal detaches the ref (node === null) AFTER joint cleared the
    // view. Bail rather than `delete undefined[selector]`, which throws "Cannot convert
    // undefined or null to object" and crashes the React commit. (`selectors` is an
    // internal ElementView map, absent from the public view types.)
    // @ts-expect-error - `selectors` is an internal ElementView map, not in the public types
    const { selectors } = elementView;
    if (!selectors) return;
    if (node) {
      node.setAttribute('joint-selector', selector);
      selectors[selector] = node;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete selectors[selector];
    }
  }, []);

  // Cache the ref callbacks per key so `selectorRef('x')` / `magnetRef('x')` return the
  // SAME function across renders. Without this the factory built a fresh closure every
  // call → React saw a new ref identity every commit → it re-ran ref(null)+ref(node),
  // re-registering the selector on every render. Stable identity = register once.
  const selectorCacheRef = useRef(new Map<string, (node: Element | null) => void>());
  const magnetCacheRef = useRef(new Map<string, (node: Element | null) => void>());

  const selectorRef = useCallback(
    (selector: string) => {
      assertSelector(selector);
      const cache = selectorCacheRef.current;
      let ref = cache.get(selector);
      if (!ref) {
        ref = (node: Element | null) => applySelector(node, selector);
        cache.set(selector, ref);
      }
      return ref;
    },
    [applySelector]
  );

  const magnetRef = useCallback(
    (selector: string, options: MagnetRefOptions = {}) => {
      assertSelector(selector);
      const magnetValue = options.passive ? 'passive' : 'active';
      const key = `${magnetValue} ${selector}`;
      const cache = magnetCacheRef.current;
      let ref = cache.get(key);
      if (!ref) {
        ref = (node: Element | null) => {
          if (node) node.setAttribute('magnet', magnetValue);
          applySelector(node, selector);
        };
        cache.set(key, ref);
      }
      return ref;
    },
    [applySelector]
  );

  const startLinkDrag = useCallback((event: StartLinkDragEvent, selector?: string) => {
    // Locate the magnet node: the nearest `[magnet]` ancestor of the pressed control
    // (mirrors joint's own findMagnet), or an explicit selector registered via magnetRef.
    let magnetNode: Element | null | undefined;
    if (selector === undefined) {
      const { target } = event;
      magnetNode = target instanceof Element ? target.closest('[magnet]') : null;
    } else {
      const { paper: livePaper, id: liveId } = latestRef.current;
      const elementView = livePaper?.getCellView(liveId);
      magnetNode = elementView?.el.querySelector(`[joint-selector="${CSS.escape(selector)}"]`);
    }
    if (!magnetNode) return;

    // Re-dispatch a mousedown whose target is the MAGNET node, not the form control the
    // user actually pressed. joint's link-drag gate only refuses to start when the pressed
    // element is a form control (<button>/<input>/…); pointing the event at the magnet
    // element slips past that gate through joint's OWN public event pipeline (no private
    // APIs) so the drag arms, and the subsequent real pointer moves drive it. A plain
    // click is unaffected: with `magnetThreshold: 'onleave'` the link only forms once the
    // pointer leaves the magnet.
    magnetNode.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        // eslint-disable-next-line unicorn/prefer-global-this
        view: window,
        button: event.button,
        buttons: 1,
        clientX: event.clientX,
        clientY: event.clientY,
      })
    );
  }, []);

  return useMemo(
    () => ({ selectorRef, magnetRef, startLinkDrag }),
    [selectorRef, magnetRef, startLinkDrag]
  );
}

const RESERVED_SELECTORS = new Set([PORTAL_SELECTOR, 'root', 'portRoot']);

function assertSelector(selector: string) {
  if (RESERVED_SELECTORS.has(selector)) {
    throw new Error(
      `Selector name "${selector}" is reserved. Please choose a different selector name.`
    );
  }
}
