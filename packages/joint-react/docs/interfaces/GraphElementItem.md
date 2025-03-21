[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphElementItem

# Interface: GraphElementItem\<Data\>

Defined in: [src/types/element-types.ts:72](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L72)

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

Defined in: [src/types/element-types.ts:69](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L69)

Attributes of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`attrs`](GraphElementBase.md#attrs)

***

### data

> `readonly` **data**: `Data`

Defined in: [src/types/element-types.ts:76](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L76)

Generic data for the element.

#### Overrides

[`GraphElementBase`](GraphElementBase.md).[`data`](GraphElementBase.md#data)

***

### height?

> `readonly` `optional` **height**: `number`

Defined in: [src/types/element-types.ts:63](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L63)

Optional height of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`height`](GraphElementBase.md#height)

***

### id

> `readonly` **id**: `ID`

Defined in: [src/types/element-types.ts:34](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L34)

Unique identifier of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`id`](GraphElementBase.md#id)

***

### markup?

> `readonly` `optional` **markup**: `string` \| `MarkupJSON`

Defined in: [src/types/element-types.ts:65](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L65)

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`markup`](GraphElementBase.md#markup)

***

### ports?

> `readonly` `optional` **ports**: `Ports`

Defined in: [src/types/element-types.ts:43](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L43)

Ports of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`ports`](GraphElementBase.md#ports)

***

### type?

> `readonly` `optional` **type**: `string`

Defined in: [src/types/element-types.ts:39](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L39)

Optional element type.

#### Default

`REACT_TYPE`

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`type`](GraphElementBase.md#type-1)

***

### width?

> `readonly` `optional` **width**: `number`

Defined in: [src/types/element-types.ts:59](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L59)

Optional width of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`width`](GraphElementBase.md#width)

***

### x

> `readonly` **x**: `number`

Defined in: [src/types/element-types.ts:51](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L51)

X position of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`x`](GraphElementBase.md#x)

***

### y

> `readonly` **y**: `number`

Defined in: [src/types/element-types.ts:55](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L55)

Y position of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`y`](GraphElementBase.md#y)
