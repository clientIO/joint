[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / Paper

# Function: Paper()

> **Paper**\<`T`\>(`props`): `Element`

Defined in: [packages/joint-react/src/components/paper.tsx:231](https://github.com/samuelgja/joint/blob/9749094e6efe2db40c6881d5ffe1569d905db73f/packages/joint-react/src/components/paper.tsx#L231)

Paper component that renders the JointJS paper element.
It must be used within a `GraphProvider` context.

## Type Parameters

• **T** *extends* [`RequiredCell`](../interfaces/RequiredCell.md) = [`BaseElement`](../interfaces/BaseElement.md)\<`unknown`\>

## Parameters

### props

[`Readonly`](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype)\<[`PaperProps`](../interfaces/PaperProps.md)\<`T`\>\>

## Returns

`Element`

## See

 - GraphProvider
 - PaperProps

## Examples

Example with `global item component`:
```tsx
import { createElements, InferElement, GraphProvider, Paper } from '@joint/react'

const initialElements = createElements([ { id: '1', data: { label: 'Node 1' }, x: 100, y: 0, width: 100, height: 50 } ])
type BaseElementWithData = InferElement<typeof initialElements>

function RenderElement({ data }: BaseElementWithData) {
 return <HtmlElement className="node">{data.label}</HtmlElement>
}
function MyApp() {
 return <GraphProvider defaultElements={initialElements}>
   <Paper renderElement={RenderElement} />
 </GraphProvider>
}
```

Example with `local item component`:
```tsx
 const initialElements = createElements([
   { id: '1', data: { label: 'Node 1' }, x: 100, y: 0, width: 100, height: 50 },
 ])
 type BaseElementWithData = InferElement<typeof initialElements>

 function MyApp() {
   const renderElement: RenderElement<BaseElementWithData> = useCallback(
     (element) => <HtmlElement className="node">{element.data.label}</HtmlElement>,
     []
   )

   return (
     <GraphProvider defaultElements={initialElements}>
       <Paper renderElement={renderElement} />
     </GraphProvider>
   )
 }
```
