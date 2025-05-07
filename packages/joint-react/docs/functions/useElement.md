[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useElement

# Function: useElement()

> **useElement**\<`Data`, `Element`, `ReturnedElements`\>(`selector`, `isEqual`): `ReturnedElements`

Defined in: [joint-react/src/hooks/use-element.ts:35](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-element.ts#L35)

A hook to access a specific graph element from the Paper context.
It must be used inside a PaperProvider.
This hook returns the selected element based on its cell id. It accepts:
- a selector function, which extracts the desired part from the element.
(By default, it returns the entire element.)
- an optional `isEqual` function, used to determine if the selected value has changed.

How it works:
1. The hook retrieves the cell id using `useCellId`.
2. It subscribes to the graph store and fetches the element associated with the cell id.
3. The selector is applied to the fetched element and `isEqual` ensures proper re-rendering behavior.

## Type Parameters

### Data

`Data` = `unknown`

### Element

`Element` = [`GraphElementWithAttributes`](../interfaces/GraphElementWithAttributes.md)\<`unknown`\>

### ReturnedElements

`ReturnedElements` = `Element`

## Parameters

### selector

(`item`) => `ReturnedElements`

The selector function to pick part of the element.

### isEqual

(`a`, `b`) => `boolean`

The function used to check equality.

## Returns

`ReturnedElements`

The selected element based on the current cell id.

## Examples

```ts
// Using without a selector (returns the full element):
const element = useElement();
```

```ts
// Using with a selector (extract a property from the element):
const elementId = useElement((element) => element.id);
```

```ts
// Using with a custom isEqual function:
const refinedElement = useElement(
  (element) => element,
  (prev, next) => prev.width === next.width
);
```

## Default

```ts
defaultElementSelector
```

## Default

```ts
util.isEqual
```
