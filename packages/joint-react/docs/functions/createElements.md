[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / createElements

# Function: createElements()

> **createElements**\<`Data`, `E`\>(`data`): `E`[]

Defined in: [packages/joint-react/src/utils/create.ts:31](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/create.ts#L31)

Create elements helper function.

## Type Parameters

• **Data**

• **E** *extends* [`BaseElement`](../interfaces/BaseElement.md)\<`Data`\>

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
