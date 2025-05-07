[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / createLinks

# Function: createLinks()

> **createLinks**\<`Link`, `Type`\>(`data`): `Link` & [`GraphLink`](../interfaces/GraphLink.md)\<`string`\>[]

Defined in: [joint-react/src/utils/create.ts:72](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/create.ts#L72)

Create links helper function.

## Type Parameters

### Link

`Link` *extends* [`GraphLink`](../interfaces/GraphLink.md)\<`Type`\>

### Type

`Type` *extends* `string` = `"standard.Link"`

## Parameters

### data

`Link` & [`GraphLink`](../interfaces/GraphLink.md)\<`Type`\>[]

Array of links to create.

## Returns

`Link` & [`GraphLink`](../interfaces/GraphLink.md)\<`string`\>[]

Array of links. (Edges)

## Example

```ts
const links = createLinks([
 { id: '1', source: '1', target: '2' },
 { id: '2', source: '2', target: '3' },
]);
```
