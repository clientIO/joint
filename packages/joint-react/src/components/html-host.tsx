import { useRef, type CSSProperties, type HTMLAttributes, type RefObject } from 'react';
import { useMeasureNode } from '../hooks/use-measure-node';
import { useElementSize } from '../hooks';

/**
 * Style-neutral element host: a `<div>` inside a `<foreignObject>`.
 *
 * All props are spread onto the inner `<div>`, so you can pass `children`,
 * `style`, `className`, event handlers, `data-*` attributes, etc.
 *
 * When both `width` and `height` are present in the element data, the host
 * renders with explicit dimensions and skips DOM measurement entirely.
 * When either is missing, it auto-sizes via `useMeasureNode`.
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

interface ForeignObjectHostProps extends HTMLHostProps {
  readonly nodeRef?: RefObject<HTMLDivElement | null>;
  readonly width?: number;
  readonly height?: number;
}

/**
 * Shared rendering primitive: a `<div>` inside a `<foreignObject>`.
 * Forces static positioning to work around Safari foreignObject quirks.
 */
function ForeignObjectHost({ nodeRef, width, height, style, ...rest }: Readonly<ForeignObjectHostProps>) {
  // Force static positioning — Safari mispositions foreignObject children with position: relative or backdrop-filter.
  const mergedStyle: CSSProperties = { ...style, position: 'static' };
  return (
    <foreignObject width={width} height={height} overflow="visible">
      <div ref={nodeRef} {...rest} style={mergedStyle} />
    </foreignObject>
  );
}

/**
 * Style-neutral element host: a measured `<div>` inside a `<foreignObject>`.
 * All props are passed through to the inner `<div>`.
 * @param props - Standard HTML div attributes (children, style, className, event handlers, etc.).
 */
export function HTMLHost(props: Readonly<HTMLHostProps> = {}) {
  const { style, ...rest } = props;
  const { width, height } = useElementSize();
  const initialWidthRef = useRef(width);
  const initialHeightRef = useRef(height);
  const hasWidth = hasSizeSet(initialWidthRef.current);
  const hasHeight = hasSizeSet(initialHeightRef.current);

  if (!hasWidth || !hasHeight) {
    const cssWidth = hasWidth ? initialWidthRef.current : 'max-content';
    const cssHeight = hasHeight ? initialHeightRef.current : undefined;
    return <AutoSizedHost width={cssWidth} height={cssHeight} style={style} {...rest} />;
  }

  return (
    <ForeignObjectHost
      width={width}
      height={height}
      style={{ width, height, ...style }}
      {...rest}
    />
  );
}

interface AutoSizedHostProps extends HTMLHostProps {
  readonly width: CSSProperties['width'];
  readonly height: CSSProperties['height'];
}

/**
 * Internal component that measures its DOM node and syncs the size to the graph element.
 * Used when at least one dimension (width or height) is not explicitly set.
 */
function AutoSizedHost({ width, height, style, ...rest }: Readonly<AutoSizedHostProps>) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const measuredSize = useMeasureNode(nodeRef);
  return (
    <ForeignObjectHost
      nodeRef={nodeRef}
      width={measuredSize.width}
      height={measuredSize.height}
      style={{ width, height, ...style }}
      {...rest}
    />
  );
}
