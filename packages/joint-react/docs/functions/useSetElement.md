[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useSetElement

# Function: useSetElement()

## Call Signature

> **useSetElement**\<`Attributes`, `Attribute`\>(`id`, `attribute`): (`value`) => `void`

Defined in: [packages/joint-react/src/hooks/use-set-element.ts:59](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-set-element.ts#L59)

Use this hook to set element attributes.
It returns a function to set the element attribute.

It must be used inside the GraphProvider.
It can be used in three ways:
1. Provide ID, attribute, and value
2. Provide ID and attribute, and use the returned function to set the value
3. Provide ID, and use the returned function to set attribute and value

### Type Parameters

• **Attributes** = [`BaseAttributes`](../interfaces/BaseAttributes.md)

• **Attribute** *extends* `string` \| `number` \| `symbol` = keyof `Attributes`

### Parameters

#### id

`ID`

element ID

#### attribute

`Attribute`

to be picked, it's optional

### Returns

`Function`

#### Parameters

##### value

`Attributes`\[`Attribute`\] | `Setter`\<`Attributes`\[`Attribute`\]\>

#### Returns

`void`

## Call Signature

> **useSetElement**\<`Attributes`\>(`id`): \<`X`\>(`attribute`, `value`) => `void`

Defined in: [packages/joint-react/src/hooks/use-set-element.ts:67](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-set-element.ts#L67)

Use this hook to set element attributes.
It returns a function to set the element attribute.

It must be used inside the GraphProvider.
It can be used in three ways:
1. Provide ID, attribute, and value
2. Provide ID and attribute, and use the returned function to set the value
3. Provide ID, and use the returned function to set attribute and value

### Type Parameters

• **Attributes** = [`BaseAttributes`](../interfaces/BaseAttributes.md)

### Parameters

#### id

`ID`

element ID

### Returns

`Function`

#### Type Parameters

• **X** *extends* `string` \| `number` \| `symbol`

#### Parameters

##### attribute

`X`

##### value

`Attributes`\[`X`\] | `Setter`\<`Attributes`\[`X`\]\>

#### Returns

`void`

## Call Signature

> **useSetElement**\<`Attributes`\>(): \<`X`\>(`id`, `attribute`, `value`) => `void`

Defined in: [packages/joint-react/src/hooks/use-set-element.ts:71](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-set-element.ts#L71)

Use this hook to set element attributes.
It returns a function to set the element attribute.

It must be used inside the GraphProvider.
It can be used in three ways:
1. Provide ID, attribute, and value
2. Provide ID and attribute, and use the returned function to set the value
3. Provide ID, and use the returned function to set attribute and value

### Type Parameters

• **Attributes** = [`BaseAttributes`](../interfaces/BaseAttributes.md)

### Returns

`Function`

#### Type Parameters

• **X** *extends* `string` \| `number` \| `symbol`

#### Parameters

##### id

`ID`

##### attribute

`X`

##### value

`Attributes`\[`X`\] | `Setter`\<`Attributes`\[`X`\]\>

#### Returns

`void`
