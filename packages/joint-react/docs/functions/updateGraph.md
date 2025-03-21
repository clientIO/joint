[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / updateGraph

# Function: updateGraph()

> **updateGraph**(`graph`, `cells`): `void`

Defined in: [src/utils/update-graph.ts:55](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/update-graph.ts#L55)

Updates the graph with new cells.

## Parameters

### graph

`Graph`

The graph to update.

### cells

[`Item`](../type-aliases/Item.md)[]

The new cells to add to the graph.

## Returns

`void`

## Example

```ts
const graph = new dia.Graph()
const cells = createElements([
   { id: '1', type: 'rect', x: 10, y: 10, width: 100, height: 100 },
])
updateGraph(graph, cells)
```
