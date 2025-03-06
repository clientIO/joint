[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / MeasureNodeOptions

# Interface: MeasureNodeOptions

Defined in: [packages/joint-react/src/hooks/use-measure-node-size.tsx:10](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-measure-node-size.tsx#L10)

## Extended by

- [`MeasuredNodeProps`](MeasuredNodeProps.md)

## Properties

### heightPadding?

> `readonly` `optional` **heightPadding**: `number`

Defined in: [packages/joint-react/src/hooks/use-measure-node-size.tsx:20](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-measure-node-size.tsx#L20)

The padding to add to the height of the element.

#### Default

```ts
0
```

***

### onSetSize()?

> `readonly` `optional` **onSetSize**: (`element`, `size`) => `void`

Defined in: [packages/joint-react/src/hooks/use-measure-node-size.tsx:27](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-measure-node-size.tsx#L27)

Overwrite default node set function with custom handling.
Useful for adding another padding, or just check element size.

#### Parameters

##### element

`Cell`

##### size

`SizeObserver`

#### Returns

`void`

#### Default

it set element via `cell.set('size', {width, height})`

***

### widthPadding?

> `readonly` `optional` **widthPadding**: `number`

Defined in: [packages/joint-react/src/hooks/use-measure-node-size.tsx:15](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-measure-node-size.tsx#L15)

The padding to add to the width of the element.

#### Default

```ts
0
```
