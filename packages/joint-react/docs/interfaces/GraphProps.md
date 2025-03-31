[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphProps

# Interface: GraphProps

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:7](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L7)

## Properties

### cellModel?

> `readonly` `optional` **cellModel**: *typeof* `Cell`

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:30](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L30)

Custom cell model to use.
It's loaded just once, so it cannot be used as React state.

#### See

https://docs.jointjs.com/api/dia/Cell

***

### cellNamespace?

> `readonly` `optional` **cellNamespace**: `unknown`

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:24](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L24)

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

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:17](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L17)

Children to render.

***

### defaultElements?

> `readonly` `optional` **defaultElements**: (`Element`\<`Attributes`, `ModelSetOptions`\> \| [`GraphElementBase`](GraphElementBase.md)\<`string`\>)[]

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:35](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L35)

Initial elements to be added to graph
It's loaded just once, so it cannot be used as React state.

***

### defaultLinks?

> `readonly` `optional` **defaultLinks**: (`Link`\<`Attributes`, `ModelSetOptions`\> \| [`GraphLink`](GraphLink.md))[]

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:40](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L40)

Initial links to be added to graph
It's loaded just once, so it cannot be used as React state.

***

### graph?

> `readonly` `optional` **graph**: `Graph`\<`Attributes`, `ModelSetOptions`\>

Defined in: [joint-react/src/components/graph-provider/graph-provider.tsx:13](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider/graph-provider.tsx#L13)

Graph instance to use. If not provided, a new graph instance will be created.

#### See

https://docs.jointjs.com/api/dia/Graph

#### Default

```ts
new dia.Graph({}, { cellNamespace: shapes })
```
