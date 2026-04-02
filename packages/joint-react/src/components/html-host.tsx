import { useRef, type CSSProperties, type HTMLAttributes, type RefObject } from 'react';
import { useMeasureNode } from '../hooks/use-measure-node';
import { useElementSize } from '../hooks';

/**
 * Style-neutral element host: a `<div>` inside a `<foreignObject>`.
 *
 * All props are spread onto the inner `<div>`, so you can pass `children`,
 * `style`, `className`, event handlers, `data-*` attributes, etc.
 *
 * By default, the host measures its content via `useMeasureNode` and syncs
 * the size back to the graph element. Set `useModelGeometry` to skip
 * measurement and render with the element's dimensions from the model instead.
 *
 * Does **not** apply any default theme class. For themed styling via
 * `--jr-element-*` CSS variables, use {@link DefaultHTMLHost} instead.
 *
 * @example
 * ```tsx
 * <Paper renderElement={({ label }) => (
 *   <HTMLHost className="my-node">{label}</HTMLHost>
 * )} />
 * ```
 */

export interface HTMLHostProps extends HTMLAttributes<HTMLDivElement> {
  /** Skip DOM measurement and use the element's size from the model. Default: `false`. */
  readonly useModelGeometry?: boolean;
}

interface HTMLFrameProps extends Omit<HTMLHostProps, 'useModelGeometry'> {
  readonly nodeRef?: RefObject<HTMLDivElement | null>;
  readonly width?: number;
  readonly height?: number;
}

/**
 * Shared rendering primitive: a `<div>` inside a `<foreignObject>`.
 * Forces static positioning to work around Safari foreignObject quirks.
 */
function HTMLFrame({ nodeRef, width, height, style, ...rest }: Readonly<HTMLFrameProps>) {
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
 * @param props - HTML div attributes plus optional `useModelGeometry` flag.
 */
export function HTMLHost(props: Readonly<HTMLHostProps> = {}) {
  const { useModelGeometry = false, ...rest } = props;

  return useModelGeometry ? (
    <StaticHTMLFrame {...rest} />
  ) : (
    <MeasuredHTMLFrame {...rest} />
  );
}

/**
 * Internal component that uses the element's size from the model.
 * Rendered when `useModelGeometry` is set.
 */
function StaticHTMLFrame({ style, ...rest }: Readonly<HTMLAttributes<HTMLDivElement>>) {
  const { width, height } = useElementSize();
  return (
    <HTMLFrame
      width={width}
      height={height}
      style={{ width, height, ...style }}
      {...rest}
    />
  );
}

/**
 * Internal component that measures its DOM node and syncs the size to the graph element.
 * Rendered by default when `useModelGeometry` is not set.
 */
function MeasuredHTMLFrame({ style, ...rest }: Readonly<HTMLAttributes<HTMLDivElement>>) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const measuredSize = useMeasureNode(nodeRef);
  return (
    <HTMLFrame
      nodeRef={nodeRef}
      width={measuredSize.width}
      height={measuredSize.height}
      style={style}
      {...rest}
    />
  );
}
