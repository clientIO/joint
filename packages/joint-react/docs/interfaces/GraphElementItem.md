[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphElementItem

# Interface: GraphElementItem\<Data, Type\>

Defined in: [joint-react/src/types/element-types.ts:76](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L76)

Base interface for graph element.
It's a subset of `dia.Element` with some additional properties.

## See

 - 
 - https://docs.jointjs.com/learn/features/shapes/elements/#diaelement

## Extends

- [`GraphElementBase`](GraphElementBase.md)\<`Type`\>

## Extended by

- [`GraphElement`](GraphElement.md)

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

[`GraphElementBase`](GraphElementBase.md).[`attrs`](GraphElementBase.md#attrs)

***

### data

> `readonly` **data**: `Data`

Defined in: [joint-react/src/types/element-types.ts:83](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L83)

Generic data for the element.

#### Overrides

[`GraphElementBase`](GraphElementBase.md).[`data`](GraphElementBase.md#data)

***

### height?

> `readonly` `optional` **height**: `number`

Defined in: [joint-react/src/types/element-types.ts:67](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L67)

Optional height of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`height`](GraphElementBase.md#height)

***

### id

> `readonly` **id**: `ID`

Defined in: [joint-react/src/types/element-types.ts:38](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L38)

Unique identifier of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`id`](GraphElementBase.md#id)

***

### markup?

> `readonly` `optional` **markup**: `string` \| `MarkupJSON`

Defined in: [joint-react/src/types/element-types.ts:69](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L69)

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`markup`](GraphElementBase.md#markup)

***

### ports?

> `readonly` `optional` **ports**: `Ports`

Defined in: [joint-react/src/types/element-types.ts:47](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L47)

Ports of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`ports`](GraphElementBase.md#ports)

***

### type?

> `readonly` `optional` **type**: `Type`

Defined in: [joint-react/src/types/element-types.ts:43](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L43)

Optional element type.

#### Default

`REACT_TYPE`

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`type`](GraphElementBase.md#type-1)

***

### width?

> `readonly` `optional` **width**: `number`

Defined in: [joint-react/src/types/element-types.ts:63](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L63)

Optional width of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`width`](GraphElementBase.md#width)

***

### x?

> `readonly` `optional` **x**: `number`

Defined in: [joint-react/src/types/element-types.ts:55](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L55)

X position of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`x`](GraphElementBase.md#x)

***

### y?

> `readonly` `optional` **y**: `number`

Defined in: [joint-react/src/types/element-types.ts:59](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L59)

Y position of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`y`](GraphElementBase.md#y)
