import type { CSSProperties } from 'react';
import { forwardRef, useMemo } from 'react';
import { useElement } from '../../hooks/use-element';
import { MeasuredNode } from '../measured-node/measured-node';

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
 * Special HTML element, when width and height are set, we will not automatically resize the parent node element.
 */
export type HTMLElementProps = DivElementProps | SpanElementProps | ButtonElementProps;

// eslint-disable-next-line jsdoc/require-jsdoc
function Element(props: HTMLElementProps, forwardedRef: React.ForwardedRef<HTMLElement>) {
  const { element, ...rest } = props;
  if (element === 'span') {
    return <span {...rest} ref={forwardedRef} />;
  }
  if (element === 'button') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // eslint-disable-next-line @eslint-react/dom/no-missing-button-type
    return <button {...rest} ref={forwardedRef as React.ForwardedRef<HTMLButtonElement>} />;
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  return <div {...rest} ref={forwardedRef as React.ForwardedRef<HTMLDivElement>} />;
}
const ElementForward = forwardRef(Element);

// eslint-disable-next-line jsdoc/require-jsdoc
function WithAutoSize(props: HTMLElementProps, forwardedRef: React.ForwardedRef<HTMLElement>) {
  const style = useMemo(() => ({ ...props.style }), [props.style]);
  const { width, height } = useElement();

  return (
    <foreignObject width={width} height={height} style={FO_STYLE}>
      <MeasuredNode ref={forwardedRef}>
        <ElementForward {...props} style={style} />
      </MeasuredNode>
    </foreignObject>
  );
}
const WithAutoSizeForward = forwardRef(WithAutoSize);

// eslint-disable-next-line jsdoc/require-jsdoc
function Component(props: HTMLElementProps, forwardedRef: React.ForwardedRef<HTMLElement>) {
  return <WithAutoSizeForward {...props} ref={forwardedRef} />;
}

/**
 * HTMlNode is component wrapper around `foreignObject` and `measuredNode` element with `HTML` element inside.
 * When this div changes, it will automatically resize the parent node element (change width and height of parent cell).
 * Under the hood, it uses foreignObject to render the div @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject
 * It uses all properties as HTMLDivElement.
 *
 * If there is not style provided to the element, it will use `display: inline-block` style by default.
 * Element calculate automatically it size based on the content and resize the node. If you do not want to use this feature, just use `width` and `height` properties from data.
 * @group Components
 * @experimental
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
 * ```
 */
export const HTMLNode = forwardRef(Component);
