[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphElementItem

# Interface: GraphElementItem\<Data\>

Defined in: [joint-react/src/types/element-types.ts:71](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L71)

Base interface for graph element.
It's a subset of `dia.Element` with some additional properties.

## See

 - 
 - https://docs.jointjs.com/learn/features/shapes/elements/#diaelement

## Extends

- [`GraphElementBase`](GraphElementBase.md)

## Extended by

- [`GraphElement`](GraphElement.md)

## Type Parameters

### Data

`Data` = `unknown`

## Indexable

\[`key`: `string`\]: `any`

\[`key`: `number`\]: `any`

## Properties

### attrs?

> `readonly` `optional` **attrs**: `unknown`

Defined in: [joint-react/src/types/element-types.ts:68](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L68)

Attributes of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`attrs`](GraphElementBase.md#attrs)

***

### data

> `readonly` **data**: `Data`

Defined in: [joint-react/src/types/element-types.ts:75](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L75)

Generic data for the element.

#### Overrides

[`GraphElementBase`](GraphElementBase.md).[`data`](GraphElementBase.md#data)

***

### height?

> `readonly` `optional` **height**: `number`

Defined in: [joint-react/src/types/element-types.ts:62](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L62)

Optional height of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`height`](GraphElementBase.md#height)

***

### id

> `readonly` **id**: `ID`

Defined in: [joint-react/src/types/element-types.ts:33](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L33)

Unique identifier of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`id`](GraphElementBase.md#id)

***

### markup?

> `readonly` `optional` **markup**: `string` \| `MarkupJSON`

Defined in: [joint-react/src/types/element-types.ts:64](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L64)

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`markup`](GraphElementBase.md#markup)

***

### ports?

> `readonly` `optional` **ports**: `Ports`

Defined in: [joint-react/src/types/element-types.ts:42](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L42)

Ports of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`ports`](GraphElementBase.md#ports)

***

### type?

> `readonly` `optional` **type**: `string`

Defined in: [joint-react/src/types/element-types.ts:38](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L38)

Optional element type.

#### Default

`REACT_TYPE`

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`type`](GraphElementBase.md#type-1)

***

### width?

> `readonly` `optional` **width**: `number`

Defined in: [joint-react/src/types/element-types.ts:58](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L58)

Optional width of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`width`](GraphElementBase.md#width)

***

### x

> `readonly` **x**: `number`

Defined in: [joint-react/src/types/element-types.ts:50](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L50)

X position of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`x`](GraphElementBase.md#x)

***

### y

> `readonly` **y**: `number`

Defined in: [joint-react/src/types/element-types.ts:54](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L54)

Y position of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`y`](GraphElementBase.md#y)
