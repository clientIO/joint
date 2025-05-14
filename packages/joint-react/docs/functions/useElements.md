[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useElements

# Function: useElements()

> **useElements**\<`Elements`, `SelectorReturnType`\>(`selector`, `isEqual`): `SelectorReturnType`

Defined in: [joint-react/src/hooks/use-elements.ts:59](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-elements.ts#L59)

A hook to access `dia.graph` elements

This hook returns the selected elements from the graph store. It accepts:
- a selector function, which extracts the desired portion from the elements map.
- an optional `isEqual` function, used to compare previous and new values—ensuring
the component only re-renders when necessary.

How it works:
1. The hook subscribes to the elements of the graph store.
2. It fetches the elements from the store and then applies the selector.
3. To avoid unnecessary re-renders (especially since the selector could produce new
references on each call), the `isEqual` comparator (defaulting to a deep comparison)
checks if the selected value really changed.

## Type Parameters

### Elements

`Elements` *extends* [`GraphElement`](../interfaces/GraphElement.md) = [`GraphElement`](../interfaces/GraphElement.md)

### SelectorReturnType

`SelectorReturnType` = `Elements`[]

## Parameters

### selector

(`items`) => `SelectorReturnType`

A function to select a portion of the elements.

### isEqual

(`a`, `b`) => `boolean`

A function to compare the previous and new values.

## Returns

`SelectorReturnType`

- The selected elements.

## Examples

Using without a selector (returns all elements):
```tsx
const elements = useElements();
```

Using with a selector (extract part of each element):
```tsx
const elementIds = useElements((elements) => elements.map((element) => element.id));
```

Using with a selector (extract id):
```tsx
const maybeElementById = useElements((elements) => elements.get('id'));
```

Using with a custom isEqual function (e.g. comparing the size of the returned map):
```tsx
const elementLength = useElements(
  (elements) => elements,
  (prev, next) => prev.size === next.size
);
```
