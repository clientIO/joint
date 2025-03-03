[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphProps

# Interface: GraphProps

Defined in: [packages/joint-react/src/components/graph-provider.tsx:6](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider.tsx#L6)

## Properties

### cellModel?

> `readonly` `optional` **cellModel**: *typeof* `Cell`

Defined in: [packages/joint-react/src/components/graph-provider.tsx:29](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider.tsx#L29)

Custom cell model to use.
It's loaded just once, so it cannot be used as React state.

#### See

https://docs.jointjs.com/api/dia/Cell

***

### cellNamespace?

> `readonly` `optional` **cellNamespace**: `unknown`

Defined in: [packages/joint-react/src/components/graph-provider.tsx:23](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider.tsx#L23)

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

Defined in: [packages/joint-react/src/components/graph-provider.tsx:16](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider.tsx#L16)

Children to render.

***

### defaultElements?

> `readonly` `optional` **defaultElements**: ([`BaseElement`](BaseElement.md)\<`unknown`\> \| `Element`\<`Attributes`, `ModelSetOptions`\>)[]

Defined in: [packages/joint-react/src/components/graph-provider.tsx:34](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider.tsx#L34)

Initial elements to be added to graph
It's loaded just once, so it cannot be used as React state.

***

### defaultLinks?

> `readonly` `optional` **defaultLinks**: ([`BaseLink`](BaseLink.md) \| `Link`\<`Attributes`, `ModelSetOptions`\>)[]

Defined in: [packages/joint-react/src/components/graph-provider.tsx:40](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider.tsx#L40)

Initial links to be added to graph
It's loaded just once, so it cannot be used as React state.

***

### graph?

> `readonly` `optional` **graph**: `Graph`\<`Attributes`, `ModelSetOptions`\>

Defined in: [packages/joint-react/src/components/graph-provider.tsx:12](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/graph-provider.tsx#L12)

Graph instance to use. If not provided, a new graph instance will be created.

#### See

https://docs.jointjs.com/api/dia/Graph

#### Default

```ts
new dia.Graph({}, { cellNamespace: shapes })
```
