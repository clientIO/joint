[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphLinkBase

# Interface: GraphLinkBase

Defined in: [packages/joint-react/src/data/graph-links.ts:10](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L10)

Base interface for graph link.
It's a subset of `dia.Link` with some additional properties.

## See

 - 
 - https://docs.jointjs.com/learn/features/shapes/links/#dialink

## Extends

- `EndJSON`.[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>

## Extended by

- [`GraphLink`](GraphLink.md)

## Indexable

\[`key`: `string`\]: `unknown`

## Properties

### defaultLabel?

> `readonly` `optional` **defaultLabel**: `Label`

Defined in: [packages/joint-react/src/data/graph-links.ts:38](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L38)

Optional link attrs.

***

### id

> `readonly` **id**: `ID`

Defined in: [packages/joint-react/src/data/graph-links.ts:14](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L14)

Unique identifier of the link.

#### Overrides

`dia.Link.EndJSON.id`

***

### markup?

> `readonly` `optional` **markup**: `MarkupJSON`

Defined in: [packages/joint-react/src/data/graph-links.ts:34](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L34)

Optional link markup.

***

### source

> `readonly` **source**: `ID`

Defined in: [packages/joint-react/src/data/graph-links.ts:18](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L18)

Source element id.

***

### target

> `readonly` **target**: `ID`

Defined in: [packages/joint-react/src/data/graph-links.ts:22](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L22)

Target element id.

***

### type?

> `readonly` `optional` **type**: `string`

Defined in: [packages/joint-react/src/data/graph-links.ts:26](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L26)

Optional link type.

***

### z?

> `readonly` `optional` **z**: `number`

Defined in: [packages/joint-react/src/data/graph-links.ts:30](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L30)

Z index of the link.
