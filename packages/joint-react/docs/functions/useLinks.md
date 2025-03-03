[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useLinks

# Function: useLinks()

> **useLinks**\<`T`, `R`\>(`selector`, `isEqual`): `R`

Defined in: [packages/joint-react/src/hooks/use-links.ts:29](https://github.com/samuelgja/joint/blob/a91832ea2262342cf7ec1914cdb61c5629371a80/packages/joint-react/src/hooks/use-links.ts#L29)

A hook to access the graph store's links. This hook takes a selector function
as an argument. The selector is called with the store links.

This hook takes an optional equality comparison function as the second parameter
that allows you to customize the way the selected links are compared to determine
whether the component needs to be re-rendered.

## Type Parameters

• **T** = [`BaseLink`](../interfaces/BaseLink.md)

• **R** = `T`[]

## Parameters

### selector

(`items`) => `R`

The selector function to select links.

### isEqual

(`a`, `b`) => `boolean`

The function that will be used to determine equality.

## Returns

`R`

## Default

```ts
defaultLinksSelector
```

## Default

```ts
util.isEqual
```

## Example

```ts
import React from 'react'
import { useLinks } from './use-links'

export const LinksComponent = () => {
  const links = useLinks(state => state.links)
  return <div>{links.length}</div>
}
```
