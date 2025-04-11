[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphElement

# Interface: GraphElement\<Data, Type\>

Defined in: [joint-react/src/types/element-types.ts:78](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L78)

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

`Type` *extends* [`StandardShapesType`](../type-aliases/StandardShapesType.md) \| `string` = `string`

## Indexable

\[`key`: `string`\]: `any`

\[`key`: `number`\]: `any`

## Properties

### attrs?

> `readonly` `optional` **attrs**: `Type` *extends* keyof `StandardShapesTypeMapper` ? `StandardShapesTypeMapper`\[`Type`\<`Type`\>\] : `unknown`

Defined in: [joint-react/src/types/element-types.ts:68](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L68)

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

Defined in: [joint-react/src/types/element-types.ts:62](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L62)

Optional height of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`height`](GraphElementItem.md#height)

***

### id

> `readonly` **id**: `ID`

Defined in: [joint-react/src/types/element-types.ts:33](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L33)

Unique identifier of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`id`](GraphElementItem.md#id)

***

### isElement

> `readonly` **isElement**: `true`

Defined in: [joint-react/src/types/element-types.ts:83](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L83)

Flag to distinguish between elements and links.

***

### isLink

> `readonly` **isLink**: `false`

Defined in: [joint-react/src/types/element-types.ts:87](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L87)

Flag to distinguish between elements and links.

***

### markup?

> `readonly` `optional` **markup**: `string` \| `MarkupJSON`

Defined in: [joint-react/src/types/element-types.ts:64](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L64)

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`markup`](GraphElementItem.md#markup)

***

### ports?

> `readonly` `optional` **ports**: `Ports`

Defined in: [joint-react/src/types/element-types.ts:42](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L42)

Ports of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`ports`](GraphElementItem.md#ports)

***

### type?

> `readonly` `optional` **type**: `Type`

Defined in: [joint-react/src/types/element-types.ts:38](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L38)

Optional element type.

#### Default

`REACT_TYPE`

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`type`](GraphElementItem.md#type-1)

***

### width?

> `readonly` `optional` **width**: `number`

Defined in: [joint-react/src/types/element-types.ts:58](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L58)

Optional width of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`width`](GraphElementItem.md#width)

***

### x?

> `readonly` `optional` **x**: `number`

Defined in: [joint-react/src/types/element-types.ts:50](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L50)

X position of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`x`](GraphElementItem.md#x)

***

### y?

> `readonly` `optional` **y**: `number`

Defined in: [joint-react/src/types/element-types.ts:54](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L54)

Y position of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`y`](GraphElementItem.md#y)
