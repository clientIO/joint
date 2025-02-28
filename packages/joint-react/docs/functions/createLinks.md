[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / createLinks

# Function: createLinks()

> **createLinks**\<`T`\>(`data`): `T`[]

Defined in: [packages/joint-react/src/utils/create.ts:64](https://github.com/samuelgja/joint/blob/e106840dde5e040ebb90e3a712443b6737a1bf58/packages/joint-react/src/utils/create.ts#L64)

Create links helper function.

## Type Parameters

• **T** *extends* [`BaseLink`](../interfaces/BaseLink.md) = [`BaseLink`](../interfaces/BaseLink.md)

## Parameters

### data

`T`[]

Array of links to create.

## Returns

`T`[]

Array of links. (Edges)

## Example

```ts
const links = createLinks([
 { id: '1', source: '1', target: '2' },
 { id: '2', source: '2', target: '3' },
]);
```
