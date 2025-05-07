[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphElementWithAttributes

# Interface: GraphElementWithAttributes\<Attributes\>

Defined in: [joint-react/src/types/element-types.ts:71](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L71)

Base interface for graph element.
It's a subset of `dia.Element` with some additional properties.

## See

 - 
 - https://docs.jointjs.com/learn/features/shapes/elements/#diaelement

## Extends

- [`GraphElement`](GraphElement.md)

## Type Parameters

### Attributes

`Attributes` = `unknown`

## Indexable

\[`key`: `string`\]: `any`

\[`key`: `number`\]: `any`

## Properties

### attrs?

> `readonly` `optional` **attrs**: `Attributes`

Defined in: [joint-react/src/types/element-types.ts:75](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L75)

Attributes of the element.

#### Overrides

[`GraphElement`](GraphElement.md).[`attrs`](GraphElement.md#attrs)

***

### height?

> `readonly` `optional` **height**: `number`

Defined in: [joint-react/src/types/element-types.ts:56](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L56)

Optional height of the element.

#### Inherited from

[`GraphElement`](GraphElement.md).[`height`](GraphElement.md#height)

***

### id

> `readonly` **id**: `ID`

Defined in: [joint-react/src/types/element-types.ts:31](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L31)

Unique identifier of the element.

#### Inherited from

[`GraphElement`](GraphElement.md).[`id`](GraphElement.md#id)

***

### markup?

> `readonly` `optional` **markup**: `string` \| `MarkupJSON`

Defined in: [joint-react/src/types/element-types.ts:58](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L58)

#### Inherited from

[`GraphElement`](GraphElement.md).[`markup`](GraphElement.md#markup)

***

### ports?

> `readonly` `optional` **ports**: `Ports`

Defined in: [joint-react/src/types/element-types.ts:40](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L40)

Ports of the element.

#### Inherited from

[`GraphElement`](GraphElement.md).[`ports`](GraphElement.md#ports)

***

### type?

> `readonly` `optional` **type**: `string`

Defined in: [joint-react/src/types/element-types.ts:36](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L36)

Optional element type.

#### Default

`REACT_TYPE`

#### Inherited from

[`GraphElement`](GraphElement.md).[`type`](GraphElement.md#type)

***

### width?

> `readonly` `optional` **width**: `number`

Defined in: [joint-react/src/types/element-types.ts:52](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L52)

Optional width of the element.

#### Inherited from

[`GraphElement`](GraphElement.md).[`width`](GraphElement.md#width)

***

### x?

> `readonly` `optional` **x**: `number`

Defined in: [joint-react/src/types/element-types.ts:44](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L44)

X position of the element.

#### Inherited from

[`GraphElement`](GraphElement.md).[`x`](GraphElement.md#x)

***

### y?

> `readonly` `optional` **y**: `number`

Defined in: [joint-react/src/types/element-types.ts:48](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L48)

Y position of the element.

#### Inherited from

[`GraphElement`](GraphElement.md).[`y`](GraphElement.md#y)
