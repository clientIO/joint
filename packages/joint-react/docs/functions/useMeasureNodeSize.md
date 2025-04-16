[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useMeasureNodeSize

# Function: useMeasureNodeSize()

> **useMeasureNodeSize**\<`AnyHtmlOrSvgElement`\>(`elementRef`, `options`?): `void`

Defined in: [joint-react/src/hooks/use-measure-node-size.tsx:32](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-measure-node-size.tsx#L32)

Custom hook to measure the size of a node and update its size in the graph.
It uses the `createElementSizeObserver` utility to observe size changes.

## Type Parameters

### AnyHtmlOrSvgElement

`AnyHtmlOrSvgElement` *extends* [`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement) \| [`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement)

## Parameters

### elementRef

`RefObject`\<`null` \| `AnyHtmlOrSvgElement`\>

A reference to the HTML or SVG element to measure.

### options?

[`MeasureNodeOptions`](../interfaces/MeasureNodeOptions.md)

Options for measuring the node size.

## Returns

`void`
