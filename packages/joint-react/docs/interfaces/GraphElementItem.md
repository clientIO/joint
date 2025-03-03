[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphElementItem

# Interface: GraphElementItem\<Data\>

Defined in: [packages/joint-react/src/data/graph-elements.ts:47](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L47)

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

• **Data** = `unknown`

## Indexable

\[`key`: `string`\]: `any`

\[`key`: `number`\]: `any`

## Properties

### data

> `readonly` **data**: `Data`

Defined in: [packages/joint-react/src/data/graph-elements.ts:51](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L51)

Generic data for the element.

#### Overrides

[`GraphElementBase`](GraphElementBase.md).[`data`](GraphElementBase.md#data)

***

### height?

> `readonly` `optional` **height**: `number`

Defined in: [packages/joint-react/src/data/graph-elements.ts:44](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L44)

Optional height of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`height`](GraphElementBase.md#height)

***

### id

> `readonly` **id**: `ID`

Defined in: [packages/joint-react/src/data/graph-elements.ts:15](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L15)

Unique identifier of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`id`](GraphElementBase.md#id)

***

### ports?

> `readonly` `optional` **ports**: `Ports`

Defined in: [packages/joint-react/src/data/graph-elements.ts:24](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L24)

Ports of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`ports`](GraphElementBase.md#ports)

***

### type?

> `readonly` `optional` **type**: `string`

Defined in: [packages/joint-react/src/data/graph-elements.ts:20](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L20)

Optional element type.

#### Default

`REACT_TYPE`

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`type`](GraphElementBase.md#type)

***

### width?

> `readonly` `optional` **width**: `number`

Defined in: [packages/joint-react/src/data/graph-elements.ts:40](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L40)

Optional width of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`width`](GraphElementBase.md#width)

***

### x

> `readonly` **x**: `number`

Defined in: [packages/joint-react/src/data/graph-elements.ts:32](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L32)

X position of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`x`](GraphElementBase.md#x)

***

### y

> `readonly` **y**: `number`

Defined in: [packages/joint-react/src/data/graph-elements.ts:36](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L36)

Y position of the element.

#### Inherited from

[`GraphElementBase`](GraphElementBase.md).[`y`](GraphElementBase.md#y)
