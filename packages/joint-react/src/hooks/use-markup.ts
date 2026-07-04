import { useCallback, useMemo } from 'react';
import { usePaper } from './use-paper';
import { useCellId } from './use-cell-id';
import type { dia } from '@joint/core';
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
      const elementView = paper?.getCellView(id) as dia.ElementView | null;
      if (!elementView) return;
      if (node) {
        node.setAttribute('joint-selector', selector);
        // @ts-expect-error - selector is dynamic key on selectors object
        elementView.selectors[selector] = node;
      } else {
        // @ts-expect-error - selector is dynamic key on selectors object
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete elementView.selectors[selector];
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
