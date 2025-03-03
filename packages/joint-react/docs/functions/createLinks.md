[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / createLinks

# Function: createLinks()

> **createLinks**\<`Item`\>(`data`): `Item` & [`GraphLink`](../interfaces/GraphLink.md)[]

Defined in: [packages/joint-react/src/utils/create.ts:50](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/create.ts#L50)

Create links helper function.

## Type Parameters

• **Item** *extends* [`GraphLinkBase`](../interfaces/GraphLinkBase.md) = [`GraphLinkBase`](../interfaces/GraphLinkBase.md)

## Parameters

### data

`Item`[]

Array of links to create.

## Returns

`Item` & [`GraphLink`](../interfaces/GraphLink.md)[]

Array of links. (Edges)

## Example

```ts
const links = createLinks([
 { id: '1', source: '1', target: '2' },
 { id: '2', source: '2', target: '3' },
]);
```
