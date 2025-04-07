[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphLinkBase

# Interface: GraphLinkBase\<Type\>

Defined in: [joint-react/src/types/link-types.ts:16](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L16)

Base interface for graph link.
It's a subset of `dia.Link` with some additional properties.

## See

 - 
 - https://docs.jointjs.com/learn/features/shapes/links/#dialink

## Extends

- `EndJSON`.[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>

## Extended by

- [`GraphLink`](GraphLink.md)

## Type Parameters

### Type

`Type` *extends* [`StandardLinkShapesType`](../type-aliases/StandardLinkShapesType.md) \| `string` = `string`

## Indexable

\[`key`: `string`\]: `unknown`

## Properties

### anchor?

> `optional` **anchor**: `AnchorJSON`

Defined in: [joint-core/types/joint.d.ts:690](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L690)

#### Inherited from

`dia.Link.EndJSON.anchor`

***

### attrs?

> `readonly` `optional` **attrs**: `Type` *extends* keyof `StandardLinkShapesTypeMapper` ? `StandardLinkShapesTypeMapper`\[`Type`\<`Type`\>\] : `unknown`

Defined in: [joint-react/src/types/link-types.ts:51](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L51)

Attributes of the element.

***

### connectionPoint?

> `optional` **connectionPoint**: `ConnectionPointJSON`

Defined in: [joint-core/types/joint.d.ts:691](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L691)

#### Inherited from

`dia.Link.EndJSON.connectionPoint`

***

### defaultLabel?

> `readonly` `optional` **defaultLabel**: `Label`

Defined in: [joint-react/src/types/link-types.ts:46](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L46)

Optional link attrs.

***

### id

> `readonly` **id**: `ID`

Defined in: [joint-react/src/types/link-types.ts:22](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L22)

Unique identifier of the link.

#### Overrides

`dia.Link.EndJSON.id`

***

### magnet?

> `optional` **magnet**: `string`

Defined in: [joint-core/types/joint.d.ts:687](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L687)

#### Inherited from

`dia.Link.EndJSON.magnet`

***

### markup?

> `readonly` `optional` **markup**: `MarkupJSON`

Defined in: [joint-react/src/types/link-types.ts:42](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L42)

Optional link markup.

***

### port?

> `optional` **port**: `string`

Defined in: [joint-core/types/joint.d.ts:689](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L689)

#### Inherited from

`dia.Link.EndJSON.port`

***

### priority?

> `optional` **priority**: `boolean`

Defined in: [joint-core/types/joint.d.ts:692](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L692)

#### Inherited from

`dia.Link.EndJSON.priority`

***

### selector?

> `optional` **selector**: `string`

Defined in: [joint-core/types/joint.d.ts:688](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L688)

#### Inherited from

`dia.Link.EndJSON.selector`

***

### source

> `readonly` **source**: `EndJSON` \| `ID`

Defined in: [joint-react/src/types/link-types.ts:26](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L26)

Source element id.

***

### target

> `readonly` **target**: `EndJSON` \| `ID`

Defined in: [joint-react/src/types/link-types.ts:30](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L30)

Target element id.

***

### type?

> `readonly` `optional` **type**: `Type`

Defined in: [joint-react/src/types/link-types.ts:34](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L34)

Optional link type.

***

### x?

> `optional` **x**: `number`

Defined in: [joint-core/types/joint.d.ts:697](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L697)

#### Inherited from

`dia.Link.EndJSON.x`

***

### y?

> `optional` **y**: `number`

Defined in: [joint-core/types/joint.d.ts:698](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L698)

#### Inherited from

`dia.Link.EndJSON.y`

***

### z?

> `readonly` `optional` **z**: `number`

Defined in: [joint-react/src/types/link-types.ts:38](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L38)

Z index of the link.
