import {
  forwardRef,
  useMemo,
  type CSSProperties,
  type ForwardedRef,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import { useMeasureElement } from '../hooks/use-measure-element';
import { useCombinedRef } from '../hooks/use-combined-ref';
import { useCell } from '../hooks/use-cell';
import { selectElementSize } from '../selectors';

/**
 * Props accepted by {@link HTMLHost}. Inherits all standard `<div>` attributes.
 * @expand
 * @group Types
 */
export interface HTMLHostProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Skip measuring the rendered content and size the host from the graph
   * element's stored geometry instead. Cheaper, but the element no longer
   * auto-resizes when the React subtree changes.
   * @default false
   */
  readonly useModelGeometry?: boolean;
}

interface HTMLFrameProps extends Omit<HTMLHostProps, 'useModelGeometry'> {
  readonly nodeRef?: RefObject<HTMLDivElement | null>;
  readonly width?: number;
  readonly height?: number;
}

/** Internal frame props: the inner `<div>` attributes plus the host's forwarded ref. */
interface FrameVariantProps extends HTMLAttributes<HTMLDivElement> {
  readonly hostRef?: ForwardedRef<HTMLDivElement>;
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
  const mergedStyle = useMemo<CSSProperties>(() => ({ ...style, position: 'static' }), [style]);
  return (
    <foreignObject width={width} height={height} overflow="visible">
      <div ref={nodeRef} {...rest} style={mergedStyle} />
    </foreignObject>
  );
}

/**
 * Renders a graph element as an unstyled HTML node you fully control. Reach for
 * this inside `<Paper renderElement={...}>` when you want plain DOM (a `<div>`,
 * inputs, your own components) instead of SVG shapes, with no default theme.
 *
 * All props are spread onto the inner `<div>` (`children`, `style`,
 * `className`, event handlers, `data-*`, etc.), and a forwarded `ref` lands on
 * that same inner `<div>` — so a parent can focus or measure the host directly.
 * By default the host measures its content via {@link useMeasureElement} and
 * syncs that size back to the graph element; set `useModelGeometry` to skip
 * measurement and size the host from the element's model geometry instead.
 *
 * Applies no default styling. For a ready-themed box driven by `--jj-box-*` CSS
 * variables, use {@link HTMLBox} instead.
 * @example
 * ```tsx
 * import { Paper, HTMLHost } from '@joint/react';
 *
 * // Render each element as your own HTML node and style it via CSS.
 * <Paper renderElement={({ label }) => (
 *   <HTMLHost className="my-node">{label}</HTMLHost>
 * )} />
 * ```
 * @group Components
 */
function HTMLHostComponent(
  props: Readonly<HTMLHostProps>,
  ref: ForwardedRef<HTMLDivElement>
): ReactNode {
  const { useModelGeometry = false, ...rest } = props;

  return useModelGeometry ? (
    <StaticHTMLFrame hostRef={ref} {...rest} />
  ) : (
    <MeasuredHTMLFrame hostRef={ref} {...rest} />
  );
}

export const HTMLHost = forwardRef(HTMLHostComponent);

/**
 * Internal component that uses the element's size from the model.
 * Rendered when `useModelGeometry` is set.
 * @param root0
 * @param root0.style
 * @param root0.hostRef
 */
function StaticHTMLFrame({ style, hostRef, ...rest }: Readonly<FrameVariantProps>) {
  const divRef = useCombinedRef<HTMLDivElement>(hostRef);
  const { height, width } = useCell(selectElementSize);
  const mergedStyle = useMemo<CSSProperties>(
    () => ({ width, height, ...style }),
    [width, height, style]
  );
  return (
    <HTMLFrame nodeRef={divRef} width={width} height={height} style={mergedStyle} {...rest} />
  );
}

/**
 * Internal component that measures its DOM node and syncs the size to the graph element.
 * Rendered by default when `useModelGeometry` is not set.
 * @param root0
 * @param root0.style
 * @param root0.hostRef
 */
function MeasuredHTMLFrame({ style, hostRef, ...rest }: Readonly<FrameVariantProps>) {
  const divRef = useCombinedRef<HTMLDivElement>(hostRef);
  const measuredSize = useMeasureElement(divRef);
  const mergedStyle = useMemo<CSSProperties>(
    () => ({ width: 'max-content', height: 'max-content', ...style }),
    [style]
  );
  return (
    <HTMLFrame
      nodeRef={divRef}
      width={measuredSize.width}
      height={measuredSize.height}
      style={mergedStyle}
      tabIndex={rest.tabIndex ?? 0}
      {...rest}
    />
  );
}
