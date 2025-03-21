[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphElements

# Class: GraphElements\<Element\>

Defined in: [src/types/element-types.ts:105](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L105)

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

- [`CellMap`](CellMap.md)\<`Element`\>

## Type Parameters

### Element

`Element` *extends* [`GraphElementBase`](../interfaces/GraphElementBase.md) = [`GraphElement`](../interfaces/GraphElement.md)

## Constructors

### new GraphElements()

> **new GraphElements**\<`Element`\>(`items`?): `GraphElements`\<`Element`\>

Defined in: [src/utils/cell/cell-map.ts:14](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L14)

#### Parameters

##### items?

`Element`[]

#### Returns

`GraphElements`\<`Element`\>

#### Inherited from

[`CellMap`](CellMap.md).[`constructor`](CellMap.md#constructor)

## Methods

### filter()

> **filter**(`predicate`): `Element`[]

Defined in: [src/utils/cell/cell-map.ts:31](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L31)

#### Parameters

##### predicate

(`item`) => `boolean`

#### Returns

`Element`[]

#### Inherited from

[`CellMap`](CellMap.md).[`filter`](CellMap.md#filter)

***

### map()

> **map**\<`Item`\>(`selector`): `Item`[]

Defined in: [src/utils/cell/cell-map.ts:27](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L27)

#### Type Parameters

##### Item

`Item` = `Element`

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

Defined in: [src/utils/cell/cell-map.ts:35](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L35)

#### Returns

`string`

#### Inherited from

[`CellMap`](CellMap.md).[`toJSON`](CellMap.md#tojson)
