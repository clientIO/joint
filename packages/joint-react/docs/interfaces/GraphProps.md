[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphProps

# Interface: GraphProps

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:8](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L8)

## Properties

### cellModel?

> `readonly` `optional` **cellModel**: *typeof* `Cell`

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:31](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L31)

Custom cell model to use.
It's loaded just once, so it cannot be used as React state.

#### See

https://docs.jointjs.com/api/dia/Cell

***

### cellNamespace?

> `readonly` `optional` **cellNamespace**: `unknown`

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:25](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L25)

Namespace for cell models.
It's loaded just once, so it cannot be used as React state.

#### Default

```ts
shapes + ReactElement
```

#### See

https://docs.jointjs.com/api/shapes

***

### children?

> `readonly` `optional` **children**: `ReactNode`

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:18](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L18)

Children to render.

***

### defaultElements?

> `readonly` `optional` **defaultElements**: ([`GraphElementBase`](GraphElementBase.md)\<`string`\> \| `Element`\<`Attributes`, `ModelSetOptions`\>)[]

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:36](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L36)

Initial elements to be added to graph
It's loaded just once, so it cannot be used as React state.

***

### defaultLinks?

> `readonly` `optional` **defaultLinks**: ([`GraphLink`](GraphLink.md) \| `Link`\<`Attributes`, `ModelSetOptions`\>)[]

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:41](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L41)

Initial links to be added to graph
It's loaded just once, so it cannot be used as React state.

***

### graph?

> `readonly` `optional` **graph**: `Graph`\<`Attributes`, `ModelSetOptions`\>

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:14](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L14)

Graph instance to use. If not provided, a new graph instance will be created.

#### See

https://docs.jointjs.com/api/dia/Graph

#### Default

```ts
new dia.Graph({}, { cellNamespace: shapes })
```

***

### store?

> `readonly` `optional` **store**: `Store`

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:47](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L47)

Store is build around graph, it handles react updates and states, it can be created separately and passed to the provider via `createStore` function.

#### See

`createStore`
