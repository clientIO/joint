[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / createLinks

# Function: createLinks()

> **createLinks**\<`Item`\>(`data`): `Item`[]

Defined in: [packages/joint-react/src/utils/create.ts:64](https://github.com/samuelgja/joint/blob/ba33b9b8c40870ffb787d62832f1ac6786fe7e98/packages/joint-react/src/utils/create.ts#L64)

Create links helper function.

## Type Parameters

• **Item** *extends* [`BaseLink`](../interfaces/BaseLink.md) = [`BaseLink`](../interfaces/BaseLink.md)

## Parameters

### data

`Item`[]

Array of links to create.

## Returns

`Item`[]

Array of links. (Edges)

## Example

```ts
const links = createLinks([
 { id: '1', source: '1', target: '2' },
 { id: '2', source: '2', target: '3' },
]);
```
