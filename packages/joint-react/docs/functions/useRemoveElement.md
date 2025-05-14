[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useRemoveElement

# Function: useRemoveElement()

> **useRemoveElement**(): (`id`) => `void`

Defined in: [joint-react/src/hooks/use-remove-cell.ts:37](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-remove-cell.ts#L37)

A custom hook that removes an element from the graph by its ID.

## Returns

`Function`

A function that removes the element from the graph.

### Parameters

#### id

`ID`

### Returns

`void`

## Example

```ts
const removeElement = useRemoveElement();
removeElement('1');
```
