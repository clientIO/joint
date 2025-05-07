[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / createElements

# Function: createElements()

> **createElements**\<`Element`, `Type`\>(`items`): `Element` & `RequiredElementProps`[]

Defined in: [joint-react/src/utils/create.ts:37](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/create.ts#L37)

Create elements helper function.

## Type Parameters

### Element

`Element` *extends* [`GraphElement`](../interfaces/GraphElement.md)

### Type

`Type` *extends* `undefined` \| `string` = `"react"`

## Parameters

### items

`Element` & `ElementWithAttributes`\<`Type`\>[]

Array of elements to create.

## Returns

`Element` & `RequiredElementProps`[]

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
