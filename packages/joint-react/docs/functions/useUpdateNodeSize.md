[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useUpdateNodeSize

# Function: useUpdateNodeSize()

> **useUpdateNodeSize**\<`AnyHtmlOrSvgElement`\>(`ref`?): (`node`) => `void`

Defined in: [packages/joint-react/src/hooks/use-update-node-size.ts:16](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-update-node-size.ts#L16)

Function to update node (element) `width` and `height` based on the provided element ref.
Returns new created function to set the ref.
It must be used inside the paper `renderElement` function.

## Type Parameters

• **AnyHtmlOrSvgElement** *extends* [`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement) \| [`SVGRectElement`](https://developer.mozilla.org/docs/Web/API/SVGRectElement)

## Parameters

### ref?

`Ref`\<`null` \| `AnyHtmlOrSvgElement`\>

The reference to the HTML or SVG element.

## Returns

`Function`

### Parameters

#### node

`null` | `AnyHtmlOrSvgElement`

### Returns

`void`

## See

 - Paper
 - `useGraph`
 - `useCellId`
