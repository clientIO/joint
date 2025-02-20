import type { CSSProperties } from 'react'
import { forwardRef, useMemo } from 'react'
import { useCombinedRefs } from '../hooks/use-combined-refs'
import { useSyncSizeWithElement } from '../hooks/use-sync-size-with-element'
const FO_STYLE: CSSProperties = {
  overflow: 'visible',
  position: 'relative',
}

interface ElementBase<T extends HTMLElement> extends React.HTMLAttributes<T> {
  readonly width?: number
  readonly height?: number
  /**
   * The type of the element.
   * @default 'div'
   */
  readonly element?: string
}

interface DivElementProps extends ElementBase<HTMLDivElement> {
  readonly element?: 'div'
}

interface SpanElementProps extends ElementBase<HTMLSpanElement> {
  readonly element: 'span'
}

/**
 * Special html element, when width and height are set, we will not automatically resize the parent node element.
 */
export type HtmlElementProps = DivElementProps | SpanElementProps

function Element(props: HtmlElementProps, forwardedRef: React.ForwardedRef<HTMLElement>) {
  const { element, ...rest } = props
  if (element === 'span') {
    return <span {...rest} ref={forwardedRef} />
  }
  return <div {...rest} ref={forwardedRef as React.ForwardedRef<HTMLDivElement>} />
}
const ElementForward = forwardRef(Element)

/**
 * Component that automatically resizes the parent node element based on the size of the div.
 */
function WithAutoSize(props: HtmlElementProps, forwardedRef: React.ForwardedRef<HTMLElement>) {
  const divElement = useSyncSizeWithElement<HTMLDivElement>()
  const combinedRef = useCombinedRefs(divElement, forwardedRef)
  return (
    <foreignObject style={FO_STYLE}>
      <ElementForward {...props} ref={combinedRef} />
    </foreignObject>
  )
}
const WithAutoSizeForward = forwardRef(WithAutoSize)

/**
 * Component that uses props width and height to set the size of itself
 */
function WithDefinedSize(props: HtmlElementProps, forwardedRef: React.ForwardedRef<HTMLElement>) {
  const { width, height, ...rest } = props
  const style: CSSProperties = useMemo(
    () => ({
      ...rest.style,
      width,
      height,
    }),
    [height, rest.style, width]
  )
  return (
    <foreignObject style={FO_STYLE}>
      <ElementForward {...rest} ref={forwardedRef} style={style} />
    </foreignObject>
  )
}
const WithDefinedSizeForward = forwardRef(WithDefinedSize)
/**
 * Joint js div with auto sizing parent node based on this div.
 * When this div changes, it will automatically resize the parent node element (change width and height of parent cell).
 *
 * It uses all properties as HTMLDivElement.
 */
function Component(props: HtmlElementProps, forwardedRef: React.ForwardedRef<HTMLElement>) {
  const { width, height } = props
  if (width === undefined && height === undefined) {
    return <WithAutoSizeForward {...props} ref={forwardedRef} />
  }
  return <WithDefinedSizeForward {...props} ref={forwardedRef} />
}

export const HtmlElement = forwardRef(Component)
