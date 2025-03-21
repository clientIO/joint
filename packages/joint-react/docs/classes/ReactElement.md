[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / ReactElement

# Class: ReactElement\<Attributes\>

Defined in: [src/models/react-element.tsx:10](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/models/react-element.tsx#L10)

A custom JointJS element that can render React components.

## Extends

- `Element`\<`dia.Element.Attributes` & `Attributes`\>

## Type Parameters

### Attributes

`Attributes` = `dia.Element.Attributes`

## Constructors

### new ReactElement()

> **new ReactElement**\<`Attributes`\>(`attributes`?, `opt`?): `ReactElement`\<`Attributes`\>

Defined in: node\_modules/@joint/core/types/joint.d.ts:443

#### Parameters

##### attributes?

`_DeepPartial`\<`_DeepRequired`\<`Attributes` & `Attributes`\>\>

##### opt?

`ConstructorOptions`

#### Returns

`ReactElement`\<`Attributes`\>

#### Inherited from

`dia.Element< dia.Element.Attributes & Attributes >.constructor`

## Methods

### defaults()

> **defaults**(): `Attributes` & `Attributes`

Defined in: [src/models/react-element.tsx:17](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/models/react-element.tsx#L17)

Sets the default attributes for the ReactElement.

#### Returns

`Attributes` & `Attributes`

The default attributes.

#### Overrides

`dia.Element.defaults`

## Properties

### markup

> **markup**: `string` \| `MarkupJSON` = `elementMarkup`

Defined in: [src/models/react-element.tsx:31](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/models/react-element.tsx#L31)

#### Overrides

`dia.Element.markup`
