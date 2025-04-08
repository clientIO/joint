[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / Paper

# Variable: Paper()

> `const` **Paper**: \<`ElementItem`\>(`props`) => `Element`

Defined in: [joint-react/src/components/paper/paper.tsx:267](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L267)

Paper component that renders the JointJS paper elements inside HTML.
It uses `renderElement` to render the elements.
It must be used within a `GraphProvider` context.

## Type Parameters

### ElementItem

`ElementItem` *extends* [`GraphElementBase`](../interfaces/GraphElementBase.md)\<`string`\> = [`GraphElementBase`](../interfaces/GraphElementBase.md)\<`string`\>

## Parameters

### props

[`PaperProps`](../interfaces/PaperProps.md)\<`ElementItem`\>

## Returns

`Element`

## See

 - GraphProvider
 - PaperProps

Props also extends `dia.Paper.Options` interface.
 - dia.Paper.Options

## Examples

Example with `global renderElement component`:
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

Example with `local renderElement component`:
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
