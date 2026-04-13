import { useCallback, useMemo } from 'react';
import { usePaper } from './use-paper';
import { useElementId } from './use-element-id';
import type { dia } from '@joint/core';
import { PORTAL_SELECTOR } from '../models/element-model';

/**
 * Provides utilities for working with JointJS markup selectors in React-rendered elements.
 * The returned `selectorRef` creates ref callbacks that register SVG sub-elements as named
 * selectors on the element view. This enables links to target specific parts of a
 * React-rendered element by selector name (e.g. `item-0`, `item-1`).
 * Must be used inside `renderElement`.
 * @group Hooks
 * @returns An object with markup utilities.
 * @example
 * ```tsx
 * import { useMarkup } from '@joint/react';
 *
 * function MyComponent({ labels }) {
 *   const { selectorRef } = useMarkup();
 *   return (
 *     <>
 *       {labels.map((label, index) => (
 *         <g ref={selectorRef(`item-${index}`)} key={label}>
 *           <text>{label}</text>
 *         </g>
 *       ))}
 *     </>
 *   );
 * }
 * ```
 */
export function useMarkup() {
    const { paper } = usePaper();
    const id = useElementId();
    const selectorRef = useCallback((selector: string) => {
        if (selector === PORTAL_SELECTOR) {
            throw new Error(
                `Selector name "${PORTAL_SELECTOR}" is reserved for the React portal target. Please choose a different selector name.`
            );
        }
        return (node: Element | null) => {
            const elementView = paper.findViewByModel(id) as dia.ElementView | undefined;
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
        };
    }, [paper, id]);
    return useMemo(() => ({ selectorRef }), [selectorRef]);
}
