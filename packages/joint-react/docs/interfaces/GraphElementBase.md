[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphElementBase

# Interface: GraphElementBase\<Type\>

Defined in: [joint-react/src/types/element-types.ts:28](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L28)

Base interface for graph element.
It's a subset of `dia.Element` with some additional properties.

## See

 - 
 - https://docs.jointjs.com/learn/features/shapes/elements/#diaelement

## Extends

- `Attributes`

## Extended by

- [`GraphElementItem`](GraphElementItem.md)

## Type Parameters

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

***

### data?

> `readonly` `optional` **data**: `unknown`

Defined in: [joint-react/src/types/element-types.ts:46](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L46)

Generic data for the element.

***

### height?

> `readonly` `optional` **height**: `number`

Defined in: [joint-react/src/types/element-types.ts:62](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L62)

Optional height of the element.

***

### id

> `readonly` **id**: `ID`

Defined in: [joint-react/src/types/element-types.ts:33](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L33)

Unique identifier of the element.

***

### markup?

> `readonly` `optional` **markup**: `string` \| `MarkupJSON`

Defined in: [joint-react/src/types/element-types.ts:64](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L64)

***

### ports?

> `readonly` `optional` **ports**: `Ports`

Defined in: [joint-react/src/types/element-types.ts:42](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L42)

Ports of the element.

***

### type?

> `readonly` `optional` **type**: `Type`

Defined in: [joint-react/src/types/element-types.ts:38](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L38)

Optional element type.

#### Default

`REACT_TYPE`

***

### width?

> `readonly` `optional` **width**: `number`

Defined in: [joint-react/src/types/element-types.ts:58](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L58)

Optional width of the element.

***

### x?

> `readonly` `optional` **x**: `number`

Defined in: [joint-react/src/types/element-types.ts:50](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L50)

X position of the element.

***

### y?

> `readonly` `optional` **y**: `number`

Defined in: [joint-react/src/types/element-types.ts:54](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L54)

Y position of the element.
