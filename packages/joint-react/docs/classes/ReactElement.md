[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / ReactElement

# Class: ReactElement\<T\>

Defined in: [packages/joint-react/src/models/react-element.ts:13](https://github.com/samuelgja/joint/blob/5100bfa1707e62a58cc3b7833d30969c8c4b52ed/packages/joint-react/src/models/react-element.ts#L13)

A custom JointJS element that can render React components.

## Extends

- `Element`\<`dia.Element.Attributes` & `T`\>

## Type Parameters

• **T** = `dia.Element.Attributes`

## Constructors

### new ReactElement()

> **new ReactElement**\<`T`\>(`attributes`?, `opt`?): [`ReactElement`](ReactElement.md)\<`T`\>

Defined in: packages/joint-react/node\_modules/@joint/core/types/joint.d.ts:443

#### Parameters

##### attributes?

`_DeepPartial`\<`_DeepRequired`\<`Attributes` & `T`\>\>

##### opt?

`ConstructorOptions`

#### Returns

[`ReactElement`](ReactElement.md)\<`T`\>

#### Inherited from

`dia.Element< dia.Element.Attributes & T >.constructor`

## Methods

### defaults()

> **defaults**(): `Attributes` & `T`

Defined in: [packages/joint-react/src/models/react-element.ts:20](https://github.com/samuelgja/joint/blob/5100bfa1707e62a58cc3b7833d30969c8c4b52ed/packages/joint-react/src/models/react-element.ts#L20)

Sets the default attributes for the ReactElement.

#### Returns

`Attributes` & `T`

The default attributes.

#### Overrides

`dia.Element.defaults`

***

### preinitialize()

> **preinitialize**(): `void`

Defined in: [packages/joint-react/src/models/react-element.ts:39](https://github.com/samuelgja/joint/blob/5100bfa1707e62a58cc3b7833d30969c8c4b52ed/packages/joint-react/src/models/react-element.ts#L39)

Initializes the markup for the ReactElement.

#### Returns

`void`

#### Overrides

`dia.Element.preinitialize`
