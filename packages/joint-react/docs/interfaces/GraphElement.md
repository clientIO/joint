[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphElement

# Interface: GraphElement\<Data\>

Defined in: [packages/joint-react/src/data/graph-elements.ts:53](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L53)

Base interface for graph element.
It's a subset of `dia.Element` with some additional properties.

## See

 - 
 - https://docs.jointjs.com/learn/features/shapes/elements/#diaelement

## Extends

- [`GraphElementItem`](GraphElementItem.md)\<`Data`\>

## Type Parameters

• **Data** = `unknown`

## Indexable

\[`key`: `string`\]: `any`

\[`key`: `number`\]: `any`

## Properties

### data

> `readonly` **data**: `Data`

Defined in: [packages/joint-react/src/data/graph-elements.ts:51](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L51)

Generic data for the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`data`](GraphElementItem.md#data)

***

### height?

> `readonly` `optional` **height**: `number`

Defined in: [packages/joint-react/src/data/graph-elements.ts:44](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L44)

Optional height of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`height`](GraphElementItem.md#height)

***

### id

> `readonly` **id**: `ID`

Defined in: [packages/joint-react/src/data/graph-elements.ts:15](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L15)

Unique identifier of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`id`](GraphElementItem.md#id)

***

### isElement

> `readonly` **isElement**: `true`

Defined in: [packages/joint-react/src/data/graph-elements.ts:57](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L57)

Flag to distinguish between elements and links.

***

### isLink

> `readonly` **isLink**: `false`

Defined in: [packages/joint-react/src/data/graph-elements.ts:61](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L61)

Flag to distinguish between elements and links.

***

### ports?

> `readonly` `optional` **ports**: `Ports`

Defined in: [packages/joint-react/src/data/graph-elements.ts:24](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L24)

Ports of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`ports`](GraphElementItem.md#ports)

***

### type?

> `readonly` `optional` **type**: `string`

Defined in: [packages/joint-react/src/data/graph-elements.ts:20](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L20)

Optional element type.

#### Default

`REACT_TYPE`

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`type`](GraphElementItem.md#type)

***

### width?

> `readonly` `optional` **width**: `number`

Defined in: [packages/joint-react/src/data/graph-elements.ts:40](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L40)

Optional width of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`width`](GraphElementItem.md#width)

***

### x

> `readonly` **x**: `number`

Defined in: [packages/joint-react/src/data/graph-elements.ts:32](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L32)

X position of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`x`](GraphElementItem.md#x)

***

### y

> `readonly` **y**: `number`

Defined in: [packages/joint-react/src/data/graph-elements.ts:36](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L36)

Y position of the element.

#### Inherited from

[`GraphElementItem`](GraphElementItem.md).[`y`](GraphElementItem.md#y)
