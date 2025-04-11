[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useCellId

# Function: useCellId()

> **useCellId**(): `ID`

Defined in: [joint-react/src/hooks/use-cell-id.ts:20](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-cell-id.ts#L20)

Return cell id from the paper (paper item).
It must be used inside `renderElement` function.

## Returns

`ID`

- The cell id.

## Throws

- If the hook is not used inside the paper context.

## Description

This hook is used to get the cell id from the paper `RenderElement`.
It must be used inside the `renderElement` function.

## Example

```ts
const cellId = useCellId();
console.log(cellId);
```
