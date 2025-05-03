[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphElement

# Interface: GraphElement\<Data, Type\>

Defined in: [joint-react/src/types/element-types.ts:85](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L85)

Base interface for graph element.
It's a subset of `dia.Element` with some additional properties.

## See

 - 
 - https://docs.jointjs.com/learn/features/shapes/elements/#diaelement

## Extends

- [`GraphElementItem`](GraphElementItem.md)\<`Data`, `Type`\>

## Type Parameters

### Data

`Data` = `unknown`

### Type

`Type` *extends* [`StandardShapesType`](../type-aliases/StandardShapesType.md) \| `string` = `"react"`

## Indexable

\[`key`: `string`\]: `any`

\[`key`: `number`\]: `any`

## Properties

### attrs?

> `readonly` `optional` **attrs**: `Type` *extends* keyof `StandardShapesTypeMapper` ? `StandardShapesTypeMapper`\[`Type`\<`Type`\>\] : `unknown`

Defined in: [joint-react/src/types/element-types.ts:73](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L73)

Attributes of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`attrs`](GraphElementItem.md#attrs)

***

### data

> `readonly` **data**: `Data`

Defined in: [joint-react/src/types/element-types.ts:83](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L83)

Generic data for the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`data`](GraphElementItem.md#data-1)

***

### height?

> `readonly` `optional` **height**: `number`

Defined in: [joint-react/src/types/element-types.ts:67](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L67)

Optional height of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`height`](GraphElementItem.md#height)

***

### id

> `readonly` **id**: `ID`

Defined in: [joint-react/src/types/element-types.ts:38](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L38)

Unique identifier of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`id`](GraphElementItem.md#id)

***

### isElement

> `readonly` **isElement**: `true`

Defined in: [joint-react/src/types/element-types.ts:90](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L90)

Flag to distinguish between elements and links.

***

### isLink

> `readonly` **isLink**: `false`

Defined in: [joint-react/src/types/element-types.ts:94](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L94)

Flag to distinguish between elements and links.

***

### markup?

> `readonly` `optional` **markup**: `string` \| `MarkupJSON`

Defined in: [joint-react/src/types/element-types.ts:69](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L69)

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`markup`](GraphElementItem.md#markup)

***

### ports?

> `readonly` `optional` **ports**: `Ports`

Defined in: [joint-react/src/types/element-types.ts:47](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L47)

Ports of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`ports`](GraphElementItem.md#ports)

***

### type?

> `readonly` `optional` **type**: `Type`

Defined in: [joint-react/src/types/element-types.ts:43](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L43)

Optional element type.

#### Default

`REACT_TYPE`

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`type`](GraphElementItem.md#type-1)

***

### width?

> `readonly` `optional` **width**: `number`

Defined in: [joint-react/src/types/element-types.ts:63](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L63)

Optional width of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`width`](GraphElementItem.md#width)

***

### x?

> `readonly` `optional` **x**: `number`

Defined in: [joint-react/src/types/element-types.ts:55](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L55)

X position of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`x`](GraphElementItem.md#x)

***

### y?

> `readonly` `optional` **y**: `number`

Defined in: [joint-react/src/types/element-types.ts:59](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L59)

Y position of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`y`](GraphElementItem.md#y)
