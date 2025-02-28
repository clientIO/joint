[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useElements

# Function: useElements()

> **useElements**\<`T`, `R`\>(`selector`, `isEqual`): `R`

Defined in: [packages/joint-react/src/hooks/use-elements.ts:32](https://github.com/samuelgja/joint/blob/e106840dde5e040ebb90e3a712443b6737a1bf58/packages/joint-react/src/hooks/use-elements.ts#L32)

A hook to access the graph store's elements. This hook takes a selector function
as an argument. The selector is called with the store elements.

This hook takes an optional equality comparison function as the second parameter
that allows you to customize the way the selected elements are compared to determine
whether the component needs to be re-rendered.

## Type Parameters

• **T** = [`BaseElement`](../interfaces/BaseElement.md)\<`unknown`\>

• **R** = `T`[]

## Parameters

### selector

(`items`) => `R`

The selector function to select elements.

### isEqual

(`a`, `b`) => `boolean`

The function that will be used to determine equality.

## Returns

`R`

The selected elements.

## Default

```ts
defaultElementsSelector
```

## Default

```ts
util.isEqual
```

## Example

```ts
import React from 'react'
import { useElements } from './use-elements'

export const ElementsComponent = () => {
  const elements = useElements(state => state.elements)
  return <div>{elements.length}</div>
}
```
