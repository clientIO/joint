[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / HtmlElement

# Function: HtmlElement()

> **HtmlElement**(`props`): `ReactNode`

Defined in: [packages/joint-react/src/components/html-element.tsx:80](https://github.com/samuelgja/joint/blob/e106840dde5e040ebb90e3a712443b6737a1bf58/packages/joint-react/src/components/html-element.tsx#L80)

Joint js div with auto sizing parent node based on this div.
When this div changes, it will automatically resize the parent node element (change width and height of parent cell).
Under the hood, it uses foreignObject to render the div

## Parameters

### props

[`HtmlElementProps`](../type-aliases/HtmlElementProps.md) & `RefAttributes`\<[`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement)\>

## Returns

`ReactNode`

## See

https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject
It uses all properties as HTMLDivElement.

Element calculate automatically it size based on the content and resize the node. If you do not want to use this feature, just use `width` and `height` properties from data.

## Example

Example with `global item component`:
```tsx
import { createElements, InferElement } from '@joint/react'
const initialElements = createElements([ { id: '1', data: { label: 'Node 1' }, x: 100, y: 0, width: 100, height: 50 } ])

type BaseElementWithData = InferElement<typeof initialElements>

function RenderElement({ data }: BaseElementWithData) {
 return <HtmlElement className="node">{data.label}</HtmlElement>
}
