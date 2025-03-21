[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphLinkBase

# Interface: GraphLinkBase\<Type\>

Defined in: [src/types/link-types.ts:17](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L17)

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

### attrs?

> `readonly` `optional` **attrs**: `Type` *extends* keyof `StandardLinkShapesTypeMapper` ? `StandardLinkShapesTypeMapper`\[`Type`\<`Type`\>\] : `unknown`

Defined in: [src/types/link-types.ts:52](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L52)

Attributes of the element.

***

### defaultLabel?

> `readonly` `optional` **defaultLabel**: `Label`

Defined in: [src/types/link-types.ts:47](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L47)

Optional link attrs.

***

### id

> `readonly` **id**: `ID`

Defined in: [src/types/link-types.ts:23](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L23)

Unique identifier of the link.

#### Overrides

`dia.Link.EndJSON.id`

***

### markup?

> `readonly` `optional` **markup**: `MarkupJSON`

Defined in: [src/types/link-types.ts:43](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L43)

Optional link markup.

***

### source

> `readonly` **source**: `ID`

Defined in: [src/types/link-types.ts:27](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L27)

Source element id.

***

### target

> `readonly` **target**: `ID`

Defined in: [src/types/link-types.ts:31](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L31)

Target element id.

***

### type?

> `readonly` `optional` **type**: `Type`

Defined in: [src/types/link-types.ts:35](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L35)

Optional link type.

***

### z?

> `readonly` `optional` **z**: `number`

Defined in: [src/types/link-types.ts:39](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/link-types.ts#L39)

Z index of the link.
