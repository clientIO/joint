[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphLink

# Interface: GraphLink

Defined in: [joint-react/src/types/link-types.ts:56](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L56)

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

### anchor?

> `optional` **anchor**: `AnchorJSON`

Defined in: [joint-core/types/joint.d.ts:690](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L690)

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`anchor`](GraphLinkBase.md#anchor)

***

### attrs?

> `readonly` `optional` **attrs**: `unknown`

Defined in: [joint-react/src/types/link-types.ts:52](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L52)

Attributes of the element.

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`attrs`](GraphLinkBase.md#attrs)

***

### connectionPoint?

> `optional` **connectionPoint**: `ConnectionPointJSON`

Defined in: [joint-core/types/joint.d.ts:691](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L691)

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`connectionPoint`](GraphLinkBase.md#connectionpoint)

***

### defaultLabel?

> `readonly` `optional` **defaultLabel**: `Label`

Defined in: [joint-react/src/types/link-types.ts:47](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L47)

Optional link attrs.

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`defaultLabel`](GraphLinkBase.md#defaultlabel)

***

### id

> `readonly` **id**: `ID`

Defined in: [joint-react/src/types/link-types.ts:23](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L23)

Unique identifier of the link.

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`id`](GraphLinkBase.md#id)

***

### isElement

> `readonly` **isElement**: `false`

Defined in: [joint-react/src/types/link-types.ts:60](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L60)

Flag to distinguish between elements and links.

***

### isLink

> `readonly` **isLink**: `true`

Defined in: [joint-react/src/types/link-types.ts:64](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L64)

Flag to distinguish between elements and links.

***

### magnet?

> `optional` **magnet**: `string`

Defined in: [joint-core/types/joint.d.ts:687](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L687)

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`magnet`](GraphLinkBase.md#magnet)

***

### markup?

> `readonly` `optional` **markup**: `MarkupJSON`

Defined in: [joint-react/src/types/link-types.ts:43](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L43)

Optional link markup.

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`markup`](GraphLinkBase.md#markup)

***

### port?

> `optional` **port**: `string`

Defined in: [joint-core/types/joint.d.ts:689](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L689)

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`port`](GraphLinkBase.md#port)

***

### priority?

> `optional` **priority**: `boolean`

Defined in: [joint-core/types/joint.d.ts:692](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L692)

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`priority`](GraphLinkBase.md#priority)

***

### selector?

> `optional` **selector**: `string`

Defined in: [joint-core/types/joint.d.ts:688](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L688)

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`selector`](GraphLinkBase.md#selector)

***

### source

> `readonly` **source**: `ID`

Defined in: [joint-react/src/types/link-types.ts:27](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L27)

Source element id.

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`source`](GraphLinkBase.md#source)

***

### target

> `readonly` **target**: `ID`

Defined in: [joint-react/src/types/link-types.ts:31](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L31)

Target element id.

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`target`](GraphLinkBase.md#target)

***

### type?

> `readonly` `optional` **type**: `string`

Defined in: [joint-react/src/types/link-types.ts:35](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L35)

Optional link type.

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`type`](GraphLinkBase.md#type-1)

***

### x?

> `optional` **x**: `number`

Defined in: [joint-core/types/joint.d.ts:697](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L697)

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`x`](GraphLinkBase.md#x)

***

### y?

> `optional` **y**: `number`

Defined in: [joint-core/types/joint.d.ts:698](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L698)

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`y`](GraphLinkBase.md#y)

***

### z?

> `readonly` `optional` **z**: `number`

Defined in: [joint-react/src/types/link-types.ts:39](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L39)

Z index of the link.

#### Inherited from

[`GraphLinkBase`](GraphLinkBase.md).[`z`](GraphLinkBase.md#z)
