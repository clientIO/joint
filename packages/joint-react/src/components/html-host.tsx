import { useRef, type CSSProperties, type HTMLAttributes } from 'react';
import { useMeasureNode } from '../hooks/use-measure-node';
import { useElementSize } from '../hooks';

/**
 * Style-neutral element host: a `<div>` inside a `<foreignObject>`, auto-sized
 * via `useMeasureNode`.
 *
 * All props are spread onto the inner `<div>`, so you can pass `children`,
 * `style`, `className`, event handlers, `data-*` attributes, etc.
 *
 * When `width`/`height` are present in the element data, the `<div>` gets
 * explicit CSS dimensions. When omitted, it auto-sizes to fit its content.
 *
 * Does **not** apply any default theme class. For themed styling via
 * `--jr-element-*` CSS variables, use {@link DefaultElement} instead.
 *
 * @example
 * ```tsx
 * <Paper renderElement={({ label }) => <HTMLHost className="my-node">{label}</HTMLHost>} />
 * ```
 */
function hasSizeSet(value?: number): value is number {
  return typeof value === 'number' && value > 0;
}

export type HTMLHostProps = HTMLAttributes<HTMLDivElement>;

/**
 * Style-neutral element host: a measured `<div>` inside a `<foreignObject>`.
 * All props are passed through to the inner `<div>`.
 * @param props - Standard HTML div attributes (children, style, className, event handlers, etc.).
 */
export function HTMLHost(props: Readonly<HTMLHostProps> = {}) {
  const { style, ...rest } = props;
  const { width, height } = useElementSize();
  const nodeRef = useRef<HTMLDivElement>(null);
  const measuredSize = useMeasureNode(nodeRef);
  const initialWidthRef = useRef(width);
  const initialHeightRef = useRef(height);
  const sizeStyle: CSSProperties = {
    width: hasSizeSet(initialWidthRef.current) ? initialWidthRef.current : 'max-content',
    height: hasSizeSet(initialHeightRef.current) ? initialHeightRef.current : undefined,
  };
  // Force static positioning — Safari mispositions foreignObject children with position: relative or backdrop-filter.
  const mergedStyle: CSSProperties = { ...sizeStyle, ...style, position: 'static' };

  return (
    <foreignObject {...measuredSize} overflow="visible">
      <div ref={nodeRef} {...rest} style={mergedStyle} />
    </foreignObject>
  );
}
