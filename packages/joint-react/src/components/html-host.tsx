import { useMemo, useRef, type CSSProperties, type HTMLAttributes, type RefObject } from 'react';
import { useMeasureNode } from '../hooks/use-measure-node';
import { useElement } from '../hooks/use-element';

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
 * `--jj-box-*` CSS variables, use {@link DefaultHTMLHost} instead.
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
 * @param root0
 * @param root0.nodeRef
 * @param root0.width
 * @param root0.height
 * @param root0.style
 */
function HTMLFrame({ nodeRef, width, height, style, ...rest }: Readonly<HTMLFrameProps>) {
  // Force static positioning — Safari mispositions foreignObject children with position: relative or backdrop-filter.
  const mergedStyle = useMemo<CSSProperties>(
    () => ({ ...style, position: 'static' }),
    [style]
  );
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
 * @param root0
 * @param root0.style
 */
function StaticHTMLFrame({ style, ...rest }: Readonly<HTMLAttributes<HTMLDivElement>>) {
  const { width, height } = useElement((element) => element.size);
  const mergedStyle = useMemo<CSSProperties>(
    () => ({ width, height, ...style }),
    [width, height, style]
  );
  return <HTMLFrame width={width} height={height} style={mergedStyle} {...rest} />;
}

/**
 * Internal component that measures its DOM node and syncs the size to the graph element.
 * Rendered by default when `useModelGeometry` is not set.
 * @param root0
 * @param root0.style
 */
function MeasuredHTMLFrame({ style, ...rest }: Readonly<HTMLAttributes<HTMLDivElement>>) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const measuredSize = useMeasureNode(nodeRef);
  const mergedStyle = useMemo<CSSProperties>(
    () => ({ width: 'max-content', height: 'max-content', ...style }),
    [style]
  );
  return (
    <HTMLFrame
      nodeRef={nodeRef}
      width={measuredSize.width}
      height={measuredSize.height}
      style={mergedStyle}
      {...rest}
    />
  );
}
