[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / ReactElement

# Class: ReactElement\<Attributes\>

Defined in: [packages/joint-react/src/models/react-element.ts:13](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/models/react-element.ts#L13)

A custom JointJS element that can render React components.

## Extends

- `Element`\<`dia.Element.Attributes` & `Attributes`\>

## Type Parameters

• **Attributes** = `dia.Element.Attributes`

## Constructors

### new ReactElement()

> **new ReactElement**\<`Attributes`\>(`attributes`?, `opt`?): [`ReactElement`](ReactElement.md)\<`Attributes`\>

Defined in: packages/joint-react/node\_modules/@joint/core/types/joint.d.ts:443

#### Parameters

##### attributes?

`_DeepPartial`\<`_DeepRequired`\<`Attributes` & `Attributes`\>\>

##### opt?

`ConstructorOptions`

#### Returns

[`ReactElement`](ReactElement.md)\<`Attributes`\>

#### Inherited from

`dia.Element< dia.Element.Attributes & Attributes >.constructor`

## Methods

### defaults()

> **defaults**(): `Attributes` & `Attributes`

Defined in: [packages/joint-react/src/models/react-element.ts:20](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/models/react-element.ts#L20)

Sets the default attributes for the ReactElement.

#### Returns

`Attributes` & `Attributes`

The default attributes.

#### Overrides

`dia.Element.defaults`

***

### preinitialize()

> **preinitialize**(): `void`

Defined in: [packages/joint-react/src/models/react-element.ts:39](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/models/react-element.ts#L39)

Initializes the markup for the ReactElement.

#### Returns

`void`

#### Overrides

`dia.Element.preinitialize`
