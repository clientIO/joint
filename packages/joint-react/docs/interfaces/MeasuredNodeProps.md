[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / MeasuredNodeProps

# Interface: MeasuredNodeProps

Defined in: [joint-react/src/components/measured-node/measured-node.tsx:5](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/measured-node/measured-node.tsx#L5)

## Extends

- [`MeasureNodeOptions`](MeasureNodeOptions.md)

## Properties

### children

> `readonly` **children**: `ReactNode`

Defined in: [joint-react/src/components/measured-node/measured-node.tsx:10](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/measured-node/measured-node.tsx#L10)

The child element to measure.
It can be only HTML or SVG element.

***

### setSize?

> `readonly` `optional` **setSize**: [`OnSetSize`](../type-aliases/OnSetSize.md)

Defined in: [joint-react/src/hooks/use-measure-node-size.tsx:21](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-measure-node-size.tsx#L21)

Overwrite default node set function with custom handling.
Useful for adding another padding, or just check element size.

#### Default

```ts
it sets element via cell.set('size', {width, height})
```

#### Inherited from

[`MeasureNodeOptions`](MeasureNodeOptions.md).[`setSize`](MeasureNodeOptions.md#setsize)
