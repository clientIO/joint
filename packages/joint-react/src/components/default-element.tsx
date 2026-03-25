import { useRef, type CSSProperties } from 'react';
import { useMeasureNode } from '../hooks/use-measure-node';
import type { FlatElementData } from '../types/data-types';

/**
 * Default element renderer: a `<div>` with a label, auto-sized via `useMeasureNode`.
 *
 * When `width`/`height` are present in the data, they set explicit CSS dimensions
 * on the `<div>`, making the element that exact size.
 * When omitted, the element auto-sizes to fit its content.
 *
 * Themed via CSS variables on `.jr-element`.
 * @param root0
 * @param root0.label
 * @param root0.width
 * @param root0.height
 * @example
 * ```tsx
 * <Paper renderElement={DefaultElement} />
 * ```
 */
const shared: CSSProperties = {
    boxSizing: 'border-box',
    textAlign: 'center',
    overflow: 'hidden',
};

// No width, no height → single line, auto-sized to content
const autoStyle: CSSProperties = {
    ...shared,
    width: 'max-content',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
};

/**
 * Determines the style for the default element based on the presence of width and height in the data.
 * @param width
 * @param height
 * @returns CSS properties for the element's `<div>` based on the presence of width and height in the data.
 */
function getStyle(width: number | undefined, height: number | undefined): CSSProperties {
    if (width === undefined && height === undefined) {
        return autoStyle;
    }
    // Width only → text wraps, height grows to fit
    if (height === undefined) {
        return { ...shared, width, overflowWrap: 'break-word' };
    }
    // Both → fixed box, text wraps but clipped at boundary
    return { ...shared, width, height, overflowWrap: 'break-word' };
}

/**
 * Default element renderer: a `<div>` with a label, auto-sized via `useMeasureNode`.
 * @param data
 * @param data.label
 * @param data.width
 * @param data.height
 * @returns JSX element rendering a default node with the given label and dimensions.
 */
export function DefaultElement({ label, width, height }: Readonly<FlatElementData>) {
    const nodeRef = useRef<HTMLDivElement>(null);
    const layout = useMeasureNode(nodeRef);
    // Capture the user's initial intent — after measurement the graph syncs
    // height back into the data, so we'd wrongly switch to the fixed-box mode.
    const initialHeightRef = useRef(height);

    return (
        <foreignObject width={layout.width} height={layout.height} overflow="visible">
            <div ref={nodeRef} className="jr-element" style={getStyle(width, initialHeightRef.current)}>
                {label as string}
            </div>
        </foreignObject>
    );
}
