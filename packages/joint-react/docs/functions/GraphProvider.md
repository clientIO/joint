[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphProvider

# Function: GraphProvider()

> **GraphProvider**(`props`): `Element`

Defined in: [packages/joint-react/src/components/graph-provider.tsx:75](https://github.com/samuelgja/joint/blob/a91832ea2262342cf7ec1914cdb61c5629371a80/packages/joint-react/src/components/graph-provider.tsx#L75)

GraphProvider component creates a graph instance and provides it to its children via context.
It also handles updates to the graph when cells change via React state or JointJS events.
For using many hooks provided by this library, you need to wrap your app with this provider.

## Parameters

### props

[`GraphProps`](../interfaces/GraphProps.md)

## Returns

`Element`

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
