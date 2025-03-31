[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useCreateGraphStore

# Function: useCreateGraphStore()

> **useCreateGraphStore**(`options`): [`GraphStore`](../interfaces/GraphStore.md)

Defined in: [joint-react/src/hooks/use-create-graph-store.ts:82](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-create-graph-store.ts#L82)

**`Internal`**

Store for listen to cell changes and updates on the graph elements (nodes) and links (edges).
It use `useSyncExternalStore` to avoid memory leaks and cells (state) duplicates.

## Parameters

### options

`Options`

Options for creating the graph store.

## Returns

[`GraphStore`](../interfaces/GraphStore.md)

The graph store instance.
