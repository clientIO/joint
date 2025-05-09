[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphProvider

# Function: GraphProvider()

> **GraphProvider**(`props`): `null` \| `Element`

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:138](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L138)

GraphProvider component creates a graph instance and provide `dia.graph` to it's children.
It relies on

## Parameters

### props

[`GraphProps`](../interfaces/GraphProps.md)

{GraphProvider} props

## Returns

`null` \| `Element`

GraphProvider component

## See

useCreateGraphStore hook to create the graph instance.

Without this provider, the library will not work.

## Examples

Using provider:
```tsx
import { GraphProvider } from '@joint/react'

function App() {
 return (
  <GraphProvider>
   <MyApp />
 </GraphProvider>
)
```

Using provider with default elements and links:
```tsx
import { GraphProvider } from '@joint/react'

function App() {
 return (
  <GraphProvider defaultElements={[]} defaultLinks={[]}>
   <MyApp />
 </GraphProvider>
)
```
