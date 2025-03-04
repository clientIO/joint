import type { CSSProperties } from 'react';
import { forwardRef, useMemo, useRef } from 'react';
import { useUpdateNodeSize } from '../../hooks/use-update-node-size';
const FO_STYLE: CSSProperties = {
  overflow: 'visible',
  position: 'relative',
  display: 'inline-block',
};

interface ElementBase<T extends HTMLElement> extends React.HTMLAttributes<T> {
  /**
   * The type of the element.
   * @default 'div'
   */
  readonly element?: string;
  /**
   * The style of the element.
   * @default { "display": "inline-block" }
   */
  readonly style?: CSSProperties;
}

interface DivElementProps extends ElementBase<HTMLDivElement> {
  readonly element?: 'div';
}

interface ButtonElementProps extends ElementBase<HTMLButtonElement> {
  readonly element?: 'button';
}

interface SpanElementProps extends ElementBase<HTMLSpanElement> {
  readonly element: 'span';
}

/**
 * Special html element, when width and height are set, we will not automatically resize the parent node element.
 */
export type HtmlElementProps = DivElementProps | SpanElementProps | ButtonElementProps;

function Element(props: HtmlElementProps, forwardedRef: React.ForwardedRef<HTMLElement>) {
  const { element, ...rest } = props;
  if (element === 'span') {
    return <span {...rest} ref={forwardedRef} />;
  }
  if (element === 'button') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return <button {...rest} ref={forwardedRef as React.ForwardedRef<HTMLButtonElement>} />;
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  return <div {...rest} ref={forwardedRef as React.ForwardedRef<HTMLDivElement>} />;
}
const ElementForward = forwardRef(Element);

/**
 * Component that automatically resizes the parent node element based on the size of the div.
 */
function WithAutoSize(props: HtmlElementProps, forwardedRef: React.ForwardedRef<HTMLElement>) {
  const foreignRef = useRef<SVGForeignObjectElement>(null);
  const divElement = useUpdateNodeSize(forwardedRef);
  const style = useMemo(() => ({ display: 'inline-block', ...props.style }), [props.style]);
  return (
    <foreignObject ref={foreignRef} style={FO_STYLE}>
      <ElementForward {...props} style={style} ref={divElement} />
    </foreignObject>
  );
}
const WithAutoSizeForward = forwardRef(WithAutoSize);

function Component(props: HtmlElementProps, forwardedRef: React.ForwardedRef<HTMLElement>) {
  return <WithAutoSizeForward {...props} ref={forwardedRef} />;
}

/**
 * Joint js div with auto sizing parent node based on this div.
 * When this div changes, it will automatically resize the parent node element (change width and height of parent cell).
 * Under the hood, it uses foreignObject to render the div @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject
 * It uses all properties as HTMLDivElement.
 *
 * If there is not style provided to the element, it will use `display: inline-block` style by default.
 * Element calculate automatically it size based on the content and resize the node. If you do not want to use this feature, just use `width` and `height` properties from data.
 *
 * @group Components
 *
 * @example
 * Example with `global item component`:
 * ```tsx
 * import { createElements, InferElement } from '@joint/react'
 * const initialElements = createElements([ { id: '1', data: { label: 'Node 1' }, x: 100, y: 0, width: 100, height: 50 } ])
 *
 * type BaseElementWithData = InferElement<typeof initialElements>
 *
 * function RenderElement({ data }: BaseElementWithData) {
 *  return <HtmlElement className="node">{data.label}</HtmlElement>
 * }
 */
export const HTMLNode = forwardRef(Component);
