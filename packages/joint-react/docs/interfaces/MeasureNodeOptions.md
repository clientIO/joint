[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / MeasureNodeOptions

# Interface: MeasureNodeOptions

Defined in: [joint-react/src/hooks/use-measure-node-size.tsx:15](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-measure-node-size.tsx#L15)

## Extended by

- [`MeasuredNodeProps`](MeasuredNodeProps.md)

## Properties

### setSize?

> `readonly` `optional` **setSize**: [`OnSetSize`](../type-aliases/OnSetSize.md)

Defined in: [joint-react/src/hooks/use-measure-node-size.tsx:21](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-measure-node-size.tsx#L21)

Overwrite default node set function with custom handling.
Useful for adding another padding, or just check element size.

#### Default

it set element via `cell.set('size', {width, height})`
