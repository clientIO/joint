import { useRef, type CSSProperties, type HTMLAttributes } from 'react';
import { useMeasureNode } from '../hooks/use-measure-node';
import { useElementSize } from '../hooks';

/**
 * Default element renderer: a `<div>` auto-sized via `useMeasureNode`.
 *
 * All props are spread onto the inner `<div>`, so you can pass `children`,
 * `style`, `className`, event handlers, `data-*` attributes, etc.
 *
 * When `width`/`height` are present in the element data, the `<div>` gets
 * explicit CSS dimensions. When omitted, it auto-sizes to fit its content.
 *
 * Themed via CSS variables on `.jr-element`.
 * @example
 * ```tsx
 * <Paper renderElement={({ label }) => <HTMLHost>{label}</HTMLHost>} />
 * ```
 */
const shared: CSSProperties = {
  boxSizing: 'border-box',
  textAlign: 'center',
  overflow: 'hidden',
  position: 'static',
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
  if (hasSize(width) && !hasSize(height)) {
    return { ...shared, width, overflowWrap: 'break-word' };
  }
  // Height only → single line, auto-width, vertically centered
  if (!hasSize(width) && hasSize(height)) {
    return {
      ...shared,
      width: 'max-content',
      height,
      whiteSpace: 'nowrap',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
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

export type HTMLHostProps = HTMLAttributes<HTMLDivElement>;

/**
 * Default element renderer: a measured `<div>` inside a `<foreignObject>`.
 * All props are passed through to the inner `<div>`.
 * @param props - Standard HTML div attributes (children, style, className, event handlers, etc.).
 */
export function HTMLHost(props: Readonly<HTMLHostProps> = {}) {
  const { style, className, ...rest } = props;
  const { width, height } = useElementSize();
  const nodeRef = useRef<HTMLDivElement>(null);
  const measuredSize = useMeasureNode(nodeRef);
  const initialWidthRef = useRef(width);
  const initialHeightRef = useRef(height);
  const baseStyle = getStyle(initialWidthRef.current, initialHeightRef.current);
  // Force static positioning — Safari mispositions foreignObject children with position: relative or backdrop-filter.
  const mergedStyle = style ? { ...baseStyle, ...style, position: 'static' as const } : baseStyle;
  const mergedClassName = className ? `jr-element ${className}` : 'jr-element';

  return (
    <foreignObject {...measuredSize} overflow="visible">
      <div ref={nodeRef} {...rest} className={mergedClassName} style={mergedStyle} />
    </foreignObject>
  );
}
