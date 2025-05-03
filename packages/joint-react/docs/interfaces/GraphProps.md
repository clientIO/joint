[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphProps

# Interface: GraphProps

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:60](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L60)

## Properties

### cellModel?

> `readonly` `optional` **cellModel**: *typeof* `Cell`

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:83](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L83)

Custom cell model to use.
It's loaded just once, so it cannot be used as React state.

#### See

https://docs.jointjs.com/api/dia/Cell

***

### cellNamespace?

> `readonly` `optional` **cellNamespace**: `unknown`

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:77](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L77)

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

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:70](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L70)

Children to render.

***

### defaultElements?

> `readonly` `optional` **defaultElements**: (`Element`\<`Attributes`, `ModelSetOptions`\> \| [`GraphElementBase`](GraphElementBase.md)\<`string`\>)[]

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:88](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L88)

Initial elements to be added to graph
It's loaded just once, so it cannot be used as React state.

***

### defaultLinks?

> `readonly` `optional` **defaultLinks**: (`Link`\<`Attributes`, `ModelSetOptions`\> \| [`GraphLink`](GraphLink.md))[]

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:93](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L93)

Initial links to be added to graph
It's loaded just once, so it cannot be used as React state.

***

### graph?

> `readonly` `optional` **graph**: `Graph`\<`Attributes`, `ModelSetOptions`\>

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:66](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L66)

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

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:99](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L99)

Store is build around graph, it handles react updates and states, it can be created separately and passed to the provider via `createStore` function.

#### See

`createStore`
