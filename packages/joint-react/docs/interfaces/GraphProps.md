[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphProps

# Interface: GraphProps

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:62](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L62)

## Properties

### cellModel?

> `readonly` `optional` **cellModel**: *typeof* `Cell`

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:87](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L87)

Custom cell model to use.
It's loaded just once, so it cannot be used as React state.

#### See

https://docs.jointjs.com/api/dia/Cell

***

### cellNamespace?

> `readonly` `optional` **cellNamespace**: `unknown`

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:81](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L81)

Namespace for cell models.
It's loaded just once, so it cannot be used as React state.
When added new shape, it will not remove existing ones, it will just add new ones.
So `{ ...shapes, ReactElement }` elements are still available.

#### Default

`{ ...shapes, ReactElement }`

#### See

https://docs.jointjs.com/api/shapes

***

### children?

> `readonly` `optional` **children**: `ReactNode`

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:72](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L72)

Children to render.

***

### graph?

> `readonly` `optional` **graph**: `Graph`\<`Attributes`, `ModelSetOptions`\>

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:68](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L68)

Graph instance to use. If not provided, a new graph instance will be created.

#### See

https://docs.jointjs.com/api/dia/Graph

#### Default

```ts
new dia.Graph({}, { cellNamespace: shapes })
```

***

### initialElements?

> `readonly` `optional` **initialElements**: ([`GraphElement`](GraphElement.md) \| `Element`\<`Attributes`, `ModelSetOptions`\>)[]

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:92](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L92)

Initial elements to be added to graph
It's loaded just once, so it cannot be used as React state.

***

### initialLinks?

> `readonly` `optional` **initialLinks**: ([`GraphLink`](GraphLink.md)\<`string`\> \| `Link`\<`Attributes`, `ModelSetOptions`\>)[]

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:97](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L97)

Initial links to be added to graph
It's loaded just once, so it cannot be used as React state.

***

### store?

> `readonly` `optional` **store**: `Store`

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:103](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L103)

Store is build around graph, it handles react updates and states, it can be created separately and passed to the provider via `createStore` function.

#### See

`createStore`
