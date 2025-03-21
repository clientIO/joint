[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / createLinks

# Function: createLinks()

> **createLinks**\<`Link`, `Type`\>(`data`): `Link` & [`GraphLink`](../interfaces/GraphLink.md)[]

Defined in: [src/utils/create.ts:64](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/create.ts#L64)

Create links helper function.

## Type Parameters

### Link

`Link` *extends* [`GraphLinkBase`](../interfaces/GraphLinkBase.md)\<`Type`\>

### Type

`Type` *extends* `string` = `string`

## Parameters

### data

`Link` & [`GraphLinkBase`](../interfaces/GraphLinkBase.md)\<`Type`\>[]

Array of links to create.

## Returns

`Link` & [`GraphLink`](../interfaces/GraphLink.md)[]

Array of links. (Edges)

## Example

```ts
const links = createLinks([
 { id: '1', source: '1', target: '2' },
 { id: '2', source: '2', target: '3' },
]);
```
