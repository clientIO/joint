[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useAddElement

# Function: useAddElement()

> **useAddElement**\<`T`\>(): (`element`) => `void`

Defined in: [joint-react/src/hooks/use-add-element.ts:22](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-add-element.ts#L22)

A custom hook that adds an element to the graph.

## Type Parameters

### T

`T` *extends* `Element`\<`Attributes`, `ModelSetOptions`\> \| [`GraphElementBase`](../interfaces/GraphElementBase.md)\<`string`\>

## Returns

`Function`

A function that adds the element to the graph.

### Parameters

#### element

`SetElement`\<`T`\>

### Returns

`void`

## Example

```ts
const addElement = useAddElement();
addElement({ id: '1', data: { label: 'Node 1' } });
```
