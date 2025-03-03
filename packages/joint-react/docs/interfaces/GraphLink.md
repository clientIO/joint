[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphLink

# Interface: GraphLink

Defined in: [packages/joint-react/src/data/graph-links.ts:40](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L40)

Base interface for graph link.
It's a subset of `dia.Link` with some additional properties.

## See

 - 
 - https://docs.jointjs.com/learn/features/shapes/links/#dialink

## Extends

- [`GraphLinkBase`](GraphLinkBase.md)

## Indexable

\[`key`: `string`\]: `unknown`

## Properties

### defaultLabel?

> `readonly` `optional` **defaultLabel**: `Label`

Defined in: [packages/joint-react/src/data/graph-links.ts:38](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L38)

Optional link attrs.

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`defaultLabel`](GraphLinkBase.md#defaultlabel)

***

### id

> `readonly` **id**: `ID`

Defined in: [packages/joint-react/src/data/graph-links.ts:14](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L14)

Unique identifier of the link.

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`id`](GraphLinkBase.md#id)

***

### isElement

> `readonly` **isElement**: `false`

Defined in: [packages/joint-react/src/data/graph-links.ts:44](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L44)

Flag to distinguish between elements and links.

***

### isLink

> `readonly` **isLink**: `true`

Defined in: [packages/joint-react/src/data/graph-links.ts:48](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L48)

Flag to distinguish between elements and links.

***

### markup?

> `readonly` `optional` **markup**: `MarkupJSON`

Defined in: [packages/joint-react/src/data/graph-links.ts:34](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L34)

Optional link markup.

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`markup`](GraphLinkBase.md#markup)

***

### source

> `readonly` **source**: `ID`

Defined in: [packages/joint-react/src/data/graph-links.ts:18](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L18)

Source element id.

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`source`](GraphLinkBase.md#source)

***

### target

> `readonly` **target**: `ID`

Defined in: [packages/joint-react/src/data/graph-links.ts:22](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L22)

Target element id.

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`target`](GraphLinkBase.md#target)

***

### type?

> `readonly` `optional` **type**: `string`

Defined in: [packages/joint-react/src/data/graph-links.ts:26](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L26)

Optional link type.

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`type`](GraphLinkBase.md#type)

***

### z?

> `readonly` `optional` **z**: `number`

Defined in: [packages/joint-react/src/data/graph-links.ts:30](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/graph-links.ts#L30)

Z index of the link.

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`z`](GraphLinkBase.md#z)
