[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / createElements

# Function: createElements()

> **createElements**\<`E`\>(`data`): `E` & `object`[]

Defined in: [packages/joint-react/src/utils/create.ts:16](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/create.ts#L16)

Create elements helper function.

## Type Parameters

• **E** *extends* `GraphElementBase`

## Parameters

### data

`E`[]

Array of elements to create.

## Returns

`E` & `object`[]

Array of elements. (Nodes)

## Example

```ts
const elements = createElements([
 { id: '1', type: 'rect', x: 10, y: 10, width: 100, height: 100 },
 { id: '2', type: 'circle', x: 200, y: 200, width: 100, height: 100 },
]);
