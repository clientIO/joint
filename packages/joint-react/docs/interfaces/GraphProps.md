[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphProps

# Interface: GraphProps

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:61](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L61)

## Properties

### cellModel?

> `readonly` `optional` **cellModel**: *typeof* `Cell`

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:84](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L84)

Custom cell model to use.
It's loaded just once, so it cannot be used as React state.

#### See

https://docs.jointjs.com/api/dia/Cell

***

### cellNamespace?

> `readonly` `optional` **cellNamespace**: `unknown`

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:78](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L78)

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

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:71](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L71)

Children to render.

***

### defaultElements?

> `readonly` `optional` **defaultElements**: (`Element`\<`Attributes`, `ModelSetOptions`\> \| [`GraphElementBase`](GraphElementBase.md)\<`string`\>)[]

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:89](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L89)

Initial elements to be added to graph
It's loaded just once, so it cannot be used as React state.

***

### defaultLinks?

> `readonly` `optional` **defaultLinks**: (`Link`\<`Attributes`, `ModelSetOptions`\> \| [`GraphLink`](GraphLink.md))[]

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:94](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L94)

Initial links to be added to graph
It's loaded just once, so it cannot be used as React state.

***

### graph?

> `readonly` `optional` **graph**: `Graph`\<`Attributes`, `ModelSetOptions`\>

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:67](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L67)

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

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:100](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L100)

Store is build around graph, it handles react updates and states, it can be created separately and passed to the provider via `createStore` function.

#### See

`createStore`
