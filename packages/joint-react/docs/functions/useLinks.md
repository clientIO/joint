[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useLinks

# Function: useLinks()

> **useLinks**\<`Link`, `SelectorReturnType`\>(`selector`, `isEqual`): `SelectorReturnType`

Defined in: [src/hooks/use-links.ts:42](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-links.ts#L42)

A hook to access the graph store's links.

This hook returns the selected links from the graph store. It accepts:
 - a selector function, which extracts the desired portion from the links map.
   (By default, it returns all links.)
 - an optional `isEqual` function, used to compare previous and new values to prevent unnecessary re-renders.

How it works:
1. The hook subscribes to the links of the graph store.
2. It retrieves the links and then applies the selector.
3. The `isEqual` comparator (defaulting to a deep comparison) checks if the selected value has really changed.

## Type Parameters

### Link

`Link` *extends* [`GraphLinkBase`](../interfaces/GraphLinkBase.md)\<`string`\> = [`GraphLink`](../interfaces/GraphLink.md)

### SelectorReturnType

`SelectorReturnType` = `Link`[]

## Parameters

### selector

(`items`) => `SelectorReturnType`

The selector function to pick links.

### isEqual

(`a`, `b`) => `boolean`

The function to compare equality.

## Returns

`SelectorReturnType`

The selected links.

## Examples

```ts
// Using without a selector (returns all links):
const links = useLinks();
```

```ts
// Using with a selector (extract part of the links data):
const linkIds = useLinks((links) => links.map(link => link.id));
```

```ts
// Using with a custom isEqual function:
const filteredLinks = useLinks(
  (links) => links,
  (prev, next) => prev.length === next.length
);
```

## Default

```ts
defaultLinksSelector
```

## Default

```ts
util.isEqual
```
