[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphLinks

# Class: GraphLinks\<Link\>

Defined in: [joint-react/src/types/link-types.ts:82](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L82)

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

- [`CellMap`](CellMap.md)\<`Link`\>

## Type Parameters

### Link

`Link` *extends* [`GraphLinkBase`](../interfaces/GraphLinkBase.md) = [`GraphLink`](../interfaces/GraphLink.md)

## Constructors

### new GraphLinks()

> **new GraphLinks**\<`Link`\>(`items`?): `GraphLinks`\<`Link`\>

Defined in: [joint-react/src/utils/cell/cell-map.ts:14](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L14)

#### Parameters

##### items?

`Link`[]

#### Returns

`GraphLinks`\<`Link`\>

#### Inherited from

[`CellMap`](CellMap.md).[`constructor`](CellMap.md#constructor)

## Methods

### filter()

> **filter**(`predicate`): `Link`[]

Defined in: [joint-react/src/utils/cell/cell-map.ts:31](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L31)

#### Parameters

##### predicate

(`item`) => `boolean`

#### Returns

`Link`[]

#### Inherited from

[`CellMap`](CellMap.md).[`filter`](CellMap.md#filter)

***

### map()

> **map**\<`Item`\>(`selector`): `Item`[]

Defined in: [joint-react/src/utils/cell/cell-map.ts:27](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L27)

#### Type Parameters

##### Item

`Item` = `Link`

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

Defined in: [joint-react/src/utils/cell/cell-map.ts:35](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L35)

#### Returns

`string`

#### Inherited from

[`CellMap`](CellMap.md).[`toJSON`](CellMap.md#tojson)
