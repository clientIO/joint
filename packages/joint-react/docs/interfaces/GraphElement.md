[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphElement

# Interface: GraphElement\<Data\>

Defined in: [joint-react/src/types/element-types.ts:78](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L78)

Base interface for graph element.
It's a subset of `dia.Element` with some additional properties.

## See

 - 
 - https://docs.jointjs.com/learn/features/shapes/elements/#diaelement

## Extends

- [`GraphElementItem`](GraphElementItem.md)\<`Data`\>

## Type Parameters

### Data

`Data` = `unknown`

## Indexable

\[`key`: `string`\]: `any`

\[`key`: `number`\]: `any`

## Properties

### attrs?

> `readonly` `optional` **attrs**: `unknown`

Defined in: [joint-react/src/types/element-types.ts:69](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L69)

Attributes of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`attrs`](GraphElementItem.md#attrs)

***

### data

> `readonly` **data**: `Data`

Defined in: [joint-react/src/types/element-types.ts:76](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L76)

Generic data for the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`data`](GraphElementItem.md#data-1)

***

### height?

> `readonly` `optional` **height**: `number`

Defined in: [joint-react/src/types/element-types.ts:63](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L63)

Optional height of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`height`](GraphElementItem.md#height)

***

### id

> `readonly` **id**: `ID`

Defined in: [joint-react/src/types/element-types.ts:34](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L34)

Unique identifier of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`id`](GraphElementItem.md#id)

***

### isElement

> `readonly` **isElement**: `true`

Defined in: [joint-react/src/types/element-types.ts:82](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L82)

Flag to distinguish between elements and links.

***

### isLink

> `readonly` **isLink**: `false`

Defined in: [joint-react/src/types/element-types.ts:86](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L86)

Flag to distinguish between elements and links.

***

### markup?

> `readonly` `optional` **markup**: `string` \| `MarkupJSON`

Defined in: [joint-react/src/types/element-types.ts:65](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L65)

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`markup`](GraphElementItem.md#markup)

***

### ports?

> `readonly` `optional` **ports**: `Ports`

Defined in: [joint-react/src/types/element-types.ts:43](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L43)

Ports of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`ports`](GraphElementItem.md#ports)

***

### type?

> `readonly` `optional` **type**: `string`

Defined in: [joint-react/src/types/element-types.ts:39](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L39)

Optional element type.

#### Default

`REACT_TYPE`

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`type`](GraphElementItem.md#type)

***

### width?

> `readonly` `optional` **width**: `number`

Defined in: [joint-react/src/types/element-types.ts:59](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L59)

Optional width of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`width`](GraphElementItem.md#width)

***

### x

> `readonly` **x**: `number`

Defined in: [joint-react/src/types/element-types.ts:51](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L51)

X position of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`x`](GraphElementItem.md#x)

***

### y

> `readonly` **y**: `number`

Defined in: [joint-react/src/types/element-types.ts:55](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L55)

Y position of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`y`](GraphElementItem.md#y)
