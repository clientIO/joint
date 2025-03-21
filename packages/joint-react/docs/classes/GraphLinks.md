[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphLinks

# Class: GraphLinks

Defined in: [src/types/link-types.ts:81](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L81)

Collection of graph links.
It's main data structure for links (edges) in the graph.
It's a wrapper around `Map<dia.Cell.ID, GraphLink>` with some sugar.

## Example

```ts
const links = new GraphLinks();
links.set('link-1', { id: 'link-1', source: 'element-1', target: 'element-2' });
links.set('link-2', { id: 'link-2', source: 'element-2', target: 'element-3' });
```

## See

https://docs.jointjs.com/learn/features/shapes/links/#dialink

## Extends

- [`CellMap`](CellMap.md)\<[`GraphLink`](../interfaces/GraphLink.md)\>

## Constructors

### new GraphLinks()

> **new GraphLinks**(`items`?): `GraphLinks`

Defined in: [src/utils/cell/cell-map.ts:14](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L14)

#### Parameters

##### items?

[`GraphLink`](../interfaces/GraphLink.md)[]

#### Returns

`GraphLinks`

#### Inherited from

[`CellMap`](CellMap.md).[`constructor`](CellMap.md#constructor)

## Methods

### filter()

> **filter**(`predicate`): [`GraphLink`](../interfaces/GraphLink.md)[]

Defined in: [src/utils/cell/cell-map.ts:31](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L31)

#### Parameters

##### predicate

(`item`) => `boolean`

#### Returns

[`GraphLink`](../interfaces/GraphLink.md)[]

#### Inherited from

[`CellMap`](CellMap.md).[`filter`](CellMap.md#filter)

***

### map()

> **map**\<`Item`\>(`selector`): `Item`[]

Defined in: [src/utils/cell/cell-map.ts:27](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L27)

#### Type Parameters

##### Item

`Item` = [`GraphLink`](../interfaces/GraphLink.md)

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
