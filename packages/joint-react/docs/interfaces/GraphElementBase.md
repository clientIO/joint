[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphElementBase

# Interface: GraphElementBase

Defined in: [packages/joint-react/src/data/graph-elements.ts:11](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L11)

Base interface for graph element.
It's a subset of `dia.Element` with some additional properties.

## See

 - 
 - https://docs.jointjs.com/learn/features/shapes/elements/#diaelement

## Extends

- `Attributes`

## Extended by

- [`GraphElementItem`](GraphElementItem.md)

## Indexable

\[`key`: `string`\]: `any`

\[`key`: `number`\]: `any`

## Properties

### data?

> `readonly` `optional` **data**: `unknown`

Defined in: [packages/joint-react/src/data/graph-elements.ts:28](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L28)

Generic data for the element.

***

### height?

> `readonly` `optional` **height**: `number`

Defined in: [packages/joint-react/src/data/graph-elements.ts:44](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L44)

Optional height of the element.

***

### id

> `readonly` **id**: `ID`

Defined in: [packages/joint-react/src/data/graph-elements.ts:15](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L15)

Unique identifier of the element.

***

### ports?

> `readonly` `optional` **ports**: `Ports`

Defined in: [packages/joint-react/src/data/graph-elements.ts:24](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L24)

Ports of the element.

***

### type?

> `readonly` `optional` **type**: `string`

Defined in: [packages/joint-react/src/data/graph-elements.ts:20](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L20)

Optional element type.

#### Default

`REACT_TYPE`

***

### width?

> `readonly` `optional` **width**: `number`

Defined in: [packages/joint-react/src/data/graph-elements.ts:40](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L40)

Optional width of the element.

***

### x

> `readonly` **x**: `number`

Defined in: [packages/joint-react/src/data/graph-elements.ts:32](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L32)

X position of the element.

***

### y

> `readonly` **y**: `number`

Defined in: [packages/joint-react/src/data/graph-elements.ts:36](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-elements.ts#L36)

Y position of the element.
