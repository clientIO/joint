[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useRemoveCell

# Function: useRemoveCell()

> **useRemoveCell**(): (`id`) => `void`

Defined in: [joint-react/src/hooks/use-remove-cell.ts:15](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-remove-cell.ts#L15)

A custom hook that removes an node or link from the graph by its ID.

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
const removeCell = useRemoveCell();
removeCell('1');
```
