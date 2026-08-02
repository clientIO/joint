import { useCallback, useMemo } from 'react';
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
 * Markup utilities returned by {@link useMarkup}.
 * @expand
 * @group Types
 */
export interface MarkupApi {
  /**
   * Returns a React ref callback that registers the node under the given selector
   * name so links and tools can target it by name.
   * @param selector - Unique selector name within the element (e.g. `'body'`, `'item-0'`).
   * @throws If `selector` is one of the reserved names (`__portal__`, `root`, `portRoot`).
   */
  readonly selectorRef: (selector: string) => (node: Element | null) => void;
  /**
   * Returns a React ref callback that registers the node under the given selector name
   * AND marks it as a JointJS magnet, a valid endpoint for link connections.
   * @param selector - Unique selector name within the element (e.g. `'port-in'`, `'row-0'`).
   * @param options - Magnet behavior options.
   * @throws If `selector` is one of the reserved names (`__portal__`, `root`, `portRoot`).
   */
  readonly magnetRef: (
    selector: string,
    options?: MagnetRefOptions
  ) => (node: Element | null) => void;
}

/**
 * Register SVG sub-elements as JointJS selectors (and optionally magnets) on
 * the current element view, so links and tools can target named parts of a
 * React-rendered element. Must be used inside `renderElement`.
 * Interactive controls inside a magnet work with plain React events.
 *
 * To keep a press from reaching the paper, so it starts no link drag and no element
 * move, stop the React event. `onClick` is a separate native event and still fires:
 *
 * ```tsx
 * <g ref={magnetRef('row-0')}>
 *   <foreignObject width={80} height={24}>
 *     <button onMouseDown={(event) => event.stopPropagation()} onClick={toggle}>NN</button>
 *   </foreignObject>
 * </g>
 * ```
 *
 * Stop `onMouseDown` (and `onTouchStart` for touch) — those are the events the paper
 * listens to. Stopping `onPointerDown` does NOT work on its own: `pointerdown` is a
 * separate event, so the `mousedown` that drives the paper still gets through. If a
 * handler already owns the pointer (`setPointerCapture`), calling `preventDefault()` on
 * `pointerdown` also works, because canceling it suppresses the compatibility
 * `mousedown` altogether.
 *
 * Keeping a control clickable while the rest of the element stays draggable usually
 * needs no wiring at all: JointJS refuses to start a link drag or an element move from a
 * form control (`<button>`, `<input>`, `<select>`, `<textarea>`, `<option>`), so a press
 * on one is always a click. For a non-form control that must both click and
 * drag-to-connect, set `magnetThreshold="onleave"` on the `<Paper>`: the link forms only
 * once the pointer leaves the magnet, so a drag releases away from the control and the
 * browser fires no click on it, while a press-and-release in place still clicks.
 * @group Hooks
 * @returns The {@link MarkupApi}: a `selectorRef` factory that tags an SVG node
 * under a named selector so links and tools can target it, and a `magnetRef`
 * factory that does the same and also marks the node as a connectable magnet.
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
  const applySelector = useCallback(
    (node: Element | null, selector: string) => {
      // The view can exist but not yet have rendered its markup — its `selectors`
      // map (the selector -> node dictionary) is then `undefined`: joint-core only
      // assigns it during render and never re-nulls it. This happens during a
      // visibility/teardown churn, e.g. hiding a cell when its group collapses. A
      // ref-cleanup would otherwise do `delete undefined[selector]` and throw
      // "Cannot convert undefined or null to object". Guard the map, not just the
      // view. `selectors` isn't part of the public ElementView type, hence the cast
      // to a deletable dictionary.
      const elementView = paper?.getCellView(id) as {
        selectors?: Record<string, Element | undefined>;
      } | null;
      const selectors = elementView?.selectors;
      if (!selectors) return;
      if (node) {
        node.setAttribute('joint-selector', selector);
        selectors[selector] = node;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete selectors[selector];
      }
    },
    [paper, id]
  );
  const selectorRef = useCallback(
    (selector: string) => {
      assertSelector(selector);
      return (node: Element | null) => applySelector(node, selector);
    },
    [applySelector]
  );
  const magnetRef = useCallback(
    (selector: string, options: MagnetRefOptions = {}) => {
      assertSelector(selector);
      const magnetValue = options.passive ? 'passive' : 'active';
      return (node: Element | null) => {
        if (node) node.setAttribute('magnet', magnetValue);
        applySelector(node, selector);
      };
    },
    [applySelector]
  );
  return useMemo(() => ({ selectorRef, magnetRef }), [selectorRef, magnetRef]);
}

const RESERVED_SELECTORS = new Set([PORTAL_SELECTOR, 'root', 'portRoot']);

function assertSelector(selector: string) {
  if (RESERVED_SELECTORS.has(selector)) {
    throw new Error(
      `Selector name "${selector}" is reserved. Please choose a different selector name.`
    );
  }
}
