[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useMeasureNodeSize

# Function: useMeasureNodeSize()

> **useMeasureNodeSize**\<`AnyHtmlOrSvgElement`\>(`elementRef`, `options`?): `void`

Defined in: [joint-react/src/hooks/use-measure-node-size.tsx:36](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-measure-node-size.tsx#L36)

Function to measure (update) node (element) `width` and `height` based on the provided element ref.
Returns new created function to set the ref.
It must be used inside the paper `renderElement` function.

Ref must be just a reference to the HTML or SVG element.

## Type Parameters

### AnyHtmlOrSvgElement

`AnyHtmlOrSvgElement` *extends* [`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement) \| [`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement)

## Parameters

### elementRef

`RefObject`\<`null` \| `AnyHtmlOrSvgElement`\>

### options?

[`MeasureNodeOptions`](../interfaces/MeasureNodeOptions.md)

## Returns

`void`

## See

 - Paper
 - `useGraph`
 - `useCellId`
