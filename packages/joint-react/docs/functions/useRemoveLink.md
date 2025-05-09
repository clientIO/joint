[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useRemoveLink

# Function: useRemoveLink()

> **useRemoveLink**(): (`id`) => `void`

Defined in: [joint-react/src/hooks/use-remove-cell.ts:63](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-remove-cell.ts#L63)

A custom hook that removes a link from the graph by its ID.

## Returns

`Function`

A function that removes the link from the graph.

### Parameters

#### id

`ID`

### Returns

`void`

## Example

```ts
const removeLink = useRemoveLink();
removeLink('1');
```
