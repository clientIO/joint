[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / CellMap

# Class: CellMap\<V\>

Defined in: [joint-react/src/utils/cell/cell-map.ts:13](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L13)

CellMap is a custom Map implementation that extends the native Map class.
It provides additional utility methods for working with working with nodes & edges.

## Extends

- [`Map`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map)\<`dia.Cell.ID`, `V`\>

## Type Parameters

### V

`V` *extends* [`CellBase`](../interfaces/CellBase.md)

## Constructors

### new CellMap()

> **new CellMap**\<`V`\>(`entries`?): `CellMap`\<`V`\>

Defined in: joint-react/node\_modules/typescript/lib/lib.es2015.collection.d.ts:50

#### Parameters

##### entries?

`null` | readonly readonly \[`ID`, `V`\][]

#### Returns

`CellMap`\<`V`\>

#### Inherited from

`Map<dia.Cell.ID, V>.constructor`

### new CellMap()

> **new CellMap**\<`V`\>(`iterable`?): `CellMap`\<`V`\>

Defined in: joint-react/node\_modules/typescript/lib/lib.es2015.collection.d.ts:49

#### Parameters

##### iterable?

`null` | [`Iterable`](https://www.typescriptlang.org/docs/handbook/iterators-and-generators.html#iterable-interface)\<readonly \[`ID`, `V`\], `any`, `any`\>

#### Returns

`CellMap`\<`V`\>

#### Inherited from

`Map<dia.Cell.ID, V>.constructor`

## Methods

### filter()

> **filter**(`predicate`): `V`[]

Defined in: [joint-react/src/utils/cell/cell-map.ts:18](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L18)

#### Parameters

##### predicate

(`item`) => `boolean`

#### Returns

`V`[]

***

### map()

> **map**\<`Item`\>(`selector`): `Item`[]

Defined in: [joint-react/src/utils/cell/cell-map.ts:14](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L14)

#### Type Parameters

##### Item

`Item` = `V`

#### Parameters

##### selector

(`item`) => `Item`

#### Returns

`Item`[]

***

### toJSON()

> **toJSON**(): `string`

Defined in: [joint-react/src/utils/cell/cell-map.ts:22](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/cell/cell-map.ts#L22)

#### Returns

`string`
