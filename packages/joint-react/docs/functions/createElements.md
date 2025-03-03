[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / createElements

# Function: createElements()

> **createElements**\<`T`, `E`\>(`data`): `E`[]

Defined in: [packages/joint-react/src/utils/create.ts:31](https://github.com/samuelgja/joint/blob/5100bfa1707e62a58cc3b7833d30969c8c4b52ed/packages/joint-react/src/utils/create.ts#L31)

Create elements helper function.

## Type Parameters

• **T**

• **E** *extends* [`BaseElement`](../interfaces/BaseElement.md)\<`T`\>

## Parameters

### data

`E`[]

Array of elements to create.

## Returns

`E`[]

Array of elements. (Nodes)

## Example

```ts
const elements = createElements([
 { id: '1', type: 'rect', x: 10, y: 10, width: 100, height: 100 },
 { id: '2', type: 'circle', x: 200, y: 200, width: 100, height: 100 },
]);
