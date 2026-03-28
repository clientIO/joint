import { useRef, type CSSProperties } from 'react';
import { useMeasureNode } from '../hooks/use-measure-node';
import { useElementSize } from '../hooks';

/**
 * Default element renderer: a `<div>` with a label, auto-sized via `useMeasureNode`.
 *
 * When `width`/`height` are present in the data, they set explicit CSS dimensions
 * on the `<div>`, making the element that exact size.
 * When omitted, the element auto-sizes to fit its content.
 *
 * Themed via CSS variables on `.jr-element`.
 * @example
 * ```tsx
 * <Paper renderElement={() => <DefaultElement />} />
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
  minWidth: 80,
};

function hasSize(size?: number) {
  return typeof size === 'number' && size > 0;
}

function getStyle(width: number | undefined, height: number | undefined): CSSProperties {
  if (!hasSize(width) && !hasSize(height)) {
    return autoStyle;
  }
  // Width only → text wraps, height grows to fit
  if (!hasSize(height)) {
    return { ...shared, width, overflowWrap: 'break-word' };
  }
  // Both → fixed box, text wraps but clipped at boundary
  return {
    ...shared,
    width,
    height,
    overflowWrap: 'break-word',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

interface DefaultElementProps {
  readonly label?: string;
  readonly style?: CSSProperties;
  readonly className?: string;
}

/**
 * Default element renderer: a `<div>` with a label, auto-sized via `useMeasureNode`.
 * Obtains data and size via hooks (useElementData, useElementSize).
 * @param props - Optional label, style, and className overrides.
 * @returns JSX element rendering a default node with the given label and dimensions.
 */
export function DefaultElement(props: Readonly<DefaultElementProps> = {}) {
  const { label } = props;
  const { width, height } = useElementSize();
  const nodeRef = useRef<HTMLDivElement>(null);
  const measuredSize = useMeasureNode(nodeRef);
  // Capture the user's initial intent — after measurement the graph syncs
  // height back into the data, so we'd wrongly switch to the fixed-box mode.
  const initialHeightRef = useRef(height);
  const baseStyle = getStyle(width, initialHeightRef.current);
  const mergedStyle = props.style ? { ...baseStyle, ...props.style } : baseStyle;
  const className = props.className ? `jr-element ${props.className}` : 'jr-element';

  return (
    <foreignObject {...measuredSize} overflow="visible">
      <div ref={nodeRef} className={className} style={mergedStyle}>
        {label}
      </div>
    </foreignObject>
  );
}
