[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphElementBase

# Interface: GraphElementBase\<Type\>

Defined in: [joint-react/src/types/element-types.ts:33](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L33)

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

Defined in: [joint-react/src/types/element-types.ts:73](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L73)

Attributes of the element.

***

### data?

> `readonly` `optional` **data**: `unknown`

Defined in: [joint-react/src/types/element-types.ts:51](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L51)

Generic data for the element.

***

### height?

> `readonly` `optional` **height**: `number`

Defined in: [joint-react/src/types/element-types.ts:67](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L67)

Optional height of the element.

***

### id

> `readonly` **id**: `ID`

Defined in: [joint-react/src/types/element-types.ts:38](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L38)

Unique identifier of the element.

***

### markup?

> `readonly` `optional` **markup**: `string` \| `MarkupJSON`

Defined in: [joint-react/src/types/element-types.ts:69](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L69)

***

### ports?

> `readonly` `optional` **ports**: `Ports`

Defined in: [joint-react/src/types/element-types.ts:47](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L47)

Ports of the element.

***

### type?

> `readonly` `optional` **type**: `Type`

Defined in: [joint-react/src/types/element-types.ts:43](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L43)

Optional element type.

#### Default

`REACT_TYPE`

***

### width?

> `readonly` `optional` **width**: `number`

Defined in: [joint-react/src/types/element-types.ts:63](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L63)

Optional width of the element.

***

### x?

> `readonly` `optional` **x**: `number`

Defined in: [joint-react/src/types/element-types.ts:55](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L55)

X position of the element.

***

### y?

> `readonly` `optional` **y**: `number`

Defined in: [joint-react/src/types/element-types.ts:59](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/element-types.ts#L59)

Y position of the element.
