[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / createElements

# Function: createElements()

> **createElements**\<`Element`, `Type`\>(`data`): `Element` & `object`[]

Defined in: [src/utils/create.ts:27](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/create.ts#L27)

Create elements helper function.

## Type Parameters

### Element

`Element` *extends* [`GraphElementBase`](../interfaces/GraphElementBase.md)\<`Type`\>

### Type

`Type` *extends* `string` = `string`

## Parameters

### data

`Element` & [`GraphElementBase`](../interfaces/GraphElementBase.md)\<`Type`\>[]

Array of elements to create.

## Returns

`Element` & `object`[]

Array of elements. (Nodes)

## Examples

without custom data
```ts
const elements = createElements([
 { id: '1', type: 'rect', x: 10, y: 10, width: 100, height: 100 },
 { id: '2', type: 'circle', x: 200, y: 200, width: 100, height: 100 },
]);
```

with custom data
```ts
const elements = createElements([
{ id: '1', type: 'rect', x: 10, y: 10 ,data : { label: 'Node 1' }, width: 100, height: 100 },
{ id: '2', type: 'circle', x: 200, y: 200, data : { label: 'Node 2' }, width: 100, height: 100 },
]);
```
