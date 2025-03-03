[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useElements

# Function: useElements()

> **useElements**\<`T`, `R`\>(`selector`, `isEqual`): `R`

Defined in: [packages/joint-react/src/hooks/use-elements.ts:50](https://github.com/samuelgja/joint/blob/a91832ea2262342cf7ec1914cdb61c5629371a80/packages/joint-react/src/hooks/use-elements.ts#L50)

A hook to access `dia.graph` elements

This hook returns the selected elements from the graph store. It accepts:
 - a selector function, which extracts the desired portion from the elements array.
   (By default, it returns the full elements array.)
 - an optional isEqual function, used to compare previous and new values—ensuring
   the component only re-renders when necessary.

How it works:
1. The hook subscribes to the elements of the graph store via useSyncExternalStoreWithSelector.
2. It fetches the elements from the store and then applies the selector.
3. To avoid unnecessary re-renders (especially since the selector could produce new
   references on each call), the isEqual comparator (defaulting to a deep comparison)
   checks if the selected value really changed.

## Type Parameters

• **T** = [`BaseElement`](../interfaces/BaseElement.md)\<`unknown`\>

• **R** = `T`[]

## Parameters

### selector

(`items`) => `R`

The selector function to pick elements.

### isEqual

(`a`, `b`) => `boolean`

The function used to decide equality.

## Returns

`R`

The selected elements.

## Examples

Using without a selector (returns all elements):
```tsx
const elements = useElements();
```

Using with a selector (extract part of each element):
```tsx
const elementIds = useElements((elements) => elements.map((element) => element.id));
```

Using with a custom isEqual function (e.g. comparing the length of the returned array):
```tsx
const elementLength = useElements(
  (elements) => elements,
  (prev, next) => prev.length === next.length
);
```

## Default

```ts
defaultElementsSelector
```

## Default

```ts
util.isEqual
```
