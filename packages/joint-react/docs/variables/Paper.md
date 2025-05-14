[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / Paper

# Variable: Paper()

> `const` **Paper**: \<`ElementItem`\>(`props`) => `Element`

Defined in: [joint-react/src/components/paper/paper.tsx:394](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L394)

Paper component that renders the JointJS paper elements inside HTML.
It uses `renderElement` to render the elements.
It must be used within a `GraphProvider` context.

## Type Parameters

### ElementItem

`ElementItem` *extends* [`GraphElement`](../interfaces/GraphElement.md) = [`GraphElement`](../interfaces/GraphElement.md)

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

const initialElements = createElements([ { id: '1', label: 'Node 1' , x: 100, y: 0, width: 100, height: 50 } ])
type BaseElementWithData = InferElement<typeof initialElements>

function RenderElement({ label }: BaseElementWithData) {
 return <HTMLElement className="node">{label}</HTMLElement>
}
function MyApp() {
 return <GraphProvider initialElements={initialElements}>
   <Paper renderElement={RenderElement} />
 </GraphProvider>
}
```

Example with `local renderElement component`:
```tsx
 const initialElements = createElements([
   { id: '1', label: 'Node 1', x: 100, y: 0, width: 100, height: 50 },
 ])
 type BaseElementWithData = InferElement<typeof initialElements>

 function MyApp() {
   const renderElement: RenderElement<BaseElementWithData> = useCallback(
     (element) => <HTMLElement className="node">{element.label}</HTMLElement>,
     []
   )

   return (
     <GraphProvider initialElements={initialElements}>
       <Paper renderElement={renderElement} />
     </GraphProvider>
   )
 }
```
