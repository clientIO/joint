[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / CellMap

# Class: CellMap\<V\>

Defined in: [packages/joint-react/src/utils/cell/cell-map.ts:13](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L13)

CellMap is a custom Map implementation that extends the native Map class.
It provides additional utility methods for working with working with nodes & edges.

## Extends

- [`Map`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map)\<`dia.Cell.ID`, `V`\>

## Extended by

- [`GraphElements`](GraphElements.md)
- [`GraphLinks`](GraphLinks.md)

## Type Parameters

• **V** *extends* `ItemBase`

## Constructors

### new CellMap()

> **new CellMap**\<`V`\>(`items`?): [`CellMap`](CellMap.md)\<`V`\>

Defined in: [packages/joint-react/src/utils/cell/cell-map.ts:14](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L14)

#### Parameters

##### items?

`V`[]

#### Returns

[`CellMap`](CellMap.md)\<`V`\>

#### Overrides

`Map<dia.Cell.ID, V>.constructor`

## Methods

### filter()

> **filter**(`predicate`): `V`[]

Defined in: [packages/joint-react/src/utils/cell/cell-map.ts:28](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L28)

#### Parameters

##### predicate

(`item`) => `boolean`

#### Returns

`V`[]

***

### map()

> **map**\<`Item`\>(`selector`): `Item`[]

Defined in: [packages/joint-react/src/utils/cell/cell-map.ts:24](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L24)

#### Type Parameters

• **Item** = `V`

#### Parameters

##### selector

(`item`) => `Item`

#### Returns

`Item`[]

***

### toJSON()

> **toJSON**(): `string`

Defined in: [packages/joint-react/src/utils/cell/cell-map.ts:32](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L32)

#### Returns

`string`
