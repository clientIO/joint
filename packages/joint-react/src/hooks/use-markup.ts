import { useCallback, useMemo } from 'react';
import { usePaper } from './use-paper';
import { useCellId } from './use-cell-id';
import type { dia } from '@joint/core';
import { PORTAL_SELECTOR } from '../models/element-model';

/** Options for `magnetRef`. */
export interface MagnetRefOptions {
    /**
     * Whether the magnet is passive — only a valid connection target, not a source.
     * When `false` (default), the magnet is `active` and links can start from it.
     */
    readonly passive?: boolean;
}

/** Markup utilities returned by `useMarkup`. */
export interface MarkupUtils {
    /**
     * Returns a React ref callback that registers the node under the given selector name.
     * Sets the `joint-selector` attribute on the node and adds it to `elementView.selectors`
     * so links and tools can target it by name.
     * @param selector - Unique selector name within the element (e.g. `'body'`, `'item-0'`).
     * @throws If `selector` equals the reserved portal selector name.
     */
    readonly selectorRef: (selector: string) => (node: Element | null) => void;
    /**
     * Returns a React ref callback that registers the node under the given selector name
     * AND marks it as a JointJS magnet — a valid endpoint for link connections.
     * @param selector - Unique selector name within the element (e.g. `'port-in'`, `'row-0'`).
     * @param options - Magnet behavior options.
     * @throws If `selector` equals the reserved portal selector name.
     */
    readonly magnetRef: (selector: string, options?: MagnetRefOptions) => (node: Element | null) => void;
}

/**
 * Provides utilities for working with JointJS markup selectors in React-rendered elements.
 * The returned `selectorRef` creates ref callbacks that register SVG sub-elements as named
 * selectors on the element view. This enables links to target specific parts of a
 * React-rendered element by selector name (e.g. `item-0`, `item-1`).
 * `magnetRef` additionally marks the node as a JointJS magnet — a valid endpoint
 * for connections.
 * Must be used inside `renderElement`.
 * @group Hooks
 * @returns An object with markup utilities.
 * @example
 * ```tsx
 * import { useMarkup } from '@joint/react';
 *
 * function MyComponent({ labels }) {
 *   const { selectorRef, magnetRef } = useMarkup();
 *   return (
 *     <>
 *       {labels.map((label, index) => (
 *         <g ref={magnetRef(`item-${index}`)} key={label}>
 *           <text>{label}</text>
 *         </g>
 *       ))}
 *     </>
 *   );
 * }
 * ```
 */
export function useMarkup(): MarkupUtils {
    const { paper } = usePaper();
    const id = useCellId();
    const applySelector = useCallback((node: Element | null, selector: string) => {
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
    }, [paper, id]);
    const selectorRef = useCallback((selector: string) => {
        assertSelector(selector);
        return (node: Element | null) => applySelector(node, selector);
    }, [applySelector]);
    const magnetRef = useCallback((selector: string, options: MagnetRefOptions = {}) => {
        assertSelector(selector);
        const magnetValue = options.passive ? 'passive' : 'active';
        return (node: Element | null) => {
            if (node) node.setAttribute('magnet', magnetValue);
            applySelector(node, selector);
        };
    }, [applySelector]);
    return useMemo(() => ({ selectorRef, magnetRef }), [selectorRef, magnetRef]);
}

const RESERVED_SELECTORS = [PORTAL_SELECTOR, 'root', 'portRoot'];

function assertSelector(selector: string) {
    if (RESERVED_SELECTORS.includes(selector)) {
        throw new Error(
            `Selector name "${selector}" is reserved. Please choose a different selector name.`
        );
    }
}
