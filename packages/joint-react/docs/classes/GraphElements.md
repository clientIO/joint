[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphElements

# Class: GraphElements\<Data\>

Defined in: [packages/joint-react/src/data/graph-elements.ts:80](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L80)

Collection of graph elements.
It's main data structure for elements (nodes) in the graph.

Why? It's not recommended to props drill mutable classes(`dia.element`) in React components.

It's a wrapper around `Map<dia.Cell.ID, GraphElement>` with some sugar.

## Example

```ts
const elements = new GraphElements();
elements.set('element-1', { id: 'element-1', x: 100, y: 100 });
elements.set('element-2', { id: 'element-2', x: 200, y: 200 });
```

## Extends

- [`CellMap`](CellMap.md)\<[`GraphElement`](../interfaces/GraphElement.md)\<`Data`\>\>

## Type Parameters

• **Data** = `unknown`

## Constructors

### new GraphElements()

> **new GraphElements**\<`Data`\>(`items`?): [`GraphElements`](GraphElements.md)\<`Data`\>

Defined in: [packages/joint-react/src/utils/cell/cell-map.ts:14](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L14)

#### Parameters

##### items?

[`GraphElement`](../interfaces/GraphElement.md)\<`Data`\>[]

#### Returns

[`GraphElements`](GraphElements.md)\<`Data`\>

#### Inherited from

[`CellMap`](CellMap.md).[`constructor`](CellMap.md#constructors)

## Methods

### filter()

> **filter**(`predicate`): [`GraphElement`](../interfaces/GraphElement.md)\<`Data`\>[]

Defined in: [packages/joint-react/src/utils/cell/cell-map.ts:28](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L28)

#### Parameters

##### predicate

(`item`) => `boolean`

#### Returns

[`GraphElement`](../interfaces/GraphElement.md)\<`Data`\>[]

#### Inherited from

[`CellMap`](CellMap.md).[`filter`](CellMap.md#filter)

***

### map()

> **map**\<`Item`\>(`selector`): `Item`[]

Defined in: [packages/joint-react/src/utils/cell/cell-map.ts:24](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L24)

#### Type Parameters

• **Item** = [`GraphElement`](../interfaces/GraphElement.md)\<`Data`\>

#### Parameters

##### selector

(`item`) => `Item`

#### Returns

`Item`[]

#### Inherited from

[`CellMap`](CellMap.md).[`map`](CellMap.md#map)

***

### toJSON()

> **toJSON**(): `string`

Defined in: [packages/joint-react/src/utils/cell/cell-map.ts:32](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L32)

#### Returns

`string`

#### Inherited from

[`CellMap`](CellMap.md).[`toJSON`](CellMap.md#tojson)
