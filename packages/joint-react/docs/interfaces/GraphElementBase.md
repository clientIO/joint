[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphElementBase

# Interface: GraphElementBase\<Type\>

Defined in: [joint-react/src/types/element-types.ts:29](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L29)

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

Defined in: [joint-react/src/types/element-types.ts:69](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L69)

Attributes of the element.

***

### data?

> `readonly` `optional` **data**: `unknown`

Defined in: [joint-react/src/types/element-types.ts:47](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L47)

Generic data for the element.

***

### height?

> `readonly` `optional` **height**: `number`

Defined in: [joint-react/src/types/element-types.ts:63](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L63)

Optional height of the element.

***

### id

> `readonly` **id**: `ID`

Defined in: [joint-react/src/types/element-types.ts:34](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L34)

Unique identifier of the element.

***

### markup?

> `readonly` `optional` **markup**: `string` \| `MarkupJSON`

Defined in: [joint-react/src/types/element-types.ts:65](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L65)

***

### ports?

> `readonly` `optional` **ports**: `Ports`

Defined in: [joint-react/src/types/element-types.ts:43](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L43)

Ports of the element.

***

### type?

> `readonly` `optional` **type**: `Type`

Defined in: [joint-react/src/types/element-types.ts:39](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L39)

Optional element type.

#### Default

`REACT_TYPE`

***

### width?

> `readonly` `optional` **width**: `number`

Defined in: [joint-react/src/types/element-types.ts:59](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L59)

Optional width of the element.

***

### x

> `readonly` **x**: `number`

Defined in: [joint-react/src/types/element-types.ts:51](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L51)

X position of the element.

***

### y

> `readonly` **y**: `number`

Defined in: [joint-react/src/types/element-types.ts:55](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L55)

Y position of the element.
