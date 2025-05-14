[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useUpdateElement

# Function: useUpdateElement()

## Call Signature

> **useUpdateElement**\<`Attributes`, `Attribute`\>(`id`, `attribute`): (`value`) => `void`

Defined in: [joint-react/src/hooks/use-update-element.ts:81](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-update-element.ts#L81)

**`Experimental`**

Set the element attribute in the graph.
It returns a function to set the element attribute.

It must be used inside the GraphProvider.

### Type Parameters

#### Attributes

`Attributes` = [`BaseAttributes`](../interfaces/BaseAttributes.md)

#### Attribute

`Attribute` *extends* `string` \| `number` \| `symbol` = keyof `Attributes`

### Parameters

#### id

`ID`

The ID of the element.

#### attribute

`Attribute`

The attribute to set.

### Returns

`Function`

The function to set the element attribute. It can be reactive.

It can be used in three ways:

#### Parameters

##### value

`Attributes`\[`Attribute`\] | `Setter`\<`Attributes`\[`Attribute`\]\>

#### Returns

`void`

### Examples

1. Use empty hook and define ID, attribute, and value inside the set function
```tsx
const setElement = useUpdateElement();
setElement('element-id', 'position', { x: 100, y: 100 });
```

2. Provide ID and attribute, and use the returned function to set value
```tsx
const setElement = useUpdateElement('element-id', 'position');
setElement({ x: 100, y: 100 });
```

3. Provide ID and use the returned function to set attribute and value
```tsx
const setElement = useUpdateElement('element-id');
setElement('position', { x: 100, y: 100 });
```

## Call Signature

> **useUpdateElement**\<`Attributes`\>(`id`): \<`Attribute`\>(`attribute`, `value`) => `void`

Defined in: [joint-react/src/hooks/use-update-element.ts:89](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-update-element.ts#L89)

**`Experimental`**

Set the element attribute in the graph.
It returns a function to set the element attribute.

It must be used inside the GraphProvider.

### Type Parameters

#### Attributes

`Attributes` = [`BaseAttributes`](../interfaces/BaseAttributes.md)

### Parameters

#### id

`ID`

The ID of the element.

### Returns

`Function`

The function to set the element attribute. It can be reactive.

It can be used in three ways:

#### Type Parameters

##### Attribute

`Attribute` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### attribute

`Attribute`

##### value

`Attributes`\[`Attribute`\] | `Setter`\<`Attributes`\[`Attribute`\]\>

#### Returns

`void`

### Examples

1. Use empty hook and define ID, attribute, and value inside the set function
```tsx
const setElement = useUpdateElement();
setElement('element-id', 'position', { x: 100, y: 100 });
```

2. Provide ID and attribute, and use the returned function to set value
```tsx
const setElement = useUpdateElement('element-id', 'position');
setElement({ x: 100, y: 100 });
```

3. Provide ID and use the returned function to set attribute and value
```tsx
const setElement = useUpdateElement('element-id');
setElement('position', { x: 100, y: 100 });
```

## Call Signature

> **useUpdateElement**\<`Attributes`\>(): \<`Attribute`\>(`id`, `attribute`, `value`) => `void`

Defined in: [joint-react/src/hooks/use-update-element.ts:96](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-update-element.ts#L96)

**`Experimental`**

Set the element attribute in the graph.
It returns a function to set the element attribute.

It must be used inside the GraphProvider.

### Type Parameters

#### Attributes

`Attributes` = [`BaseAttributes`](../interfaces/BaseAttributes.md)

### Returns

`Function`

The function to set the element attribute. It can be reactive.

It can be used in three ways:

#### Type Parameters

##### Attribute

`Attribute` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### id

`ID`

##### attribute

`Attribute`

##### value

`Attributes`\[`Attribute`\] | `Setter`\<`Attributes`\[`Attribute`\]\>

#### Returns

`void`

### Examples

1. Use empty hook and define ID, attribute, and value inside the set function
```tsx
const setElement = useUpdateElement();
setElement('element-id', 'position', { x: 100, y: 100 });
```

2. Provide ID and attribute, and use the returned function to set value
```tsx
const setElement = useUpdateElement('element-id', 'position');
setElement({ x: 100, y: 100 });
```

3. Provide ID and use the returned function to set attribute and value
```tsx
const setElement = useUpdateElement('element-id');
setElement('position', { x: 100, y: 100 });
```
