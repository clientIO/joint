[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / MeasuredNodeProps

# Interface: MeasuredNodeProps

Defined in: [packages/joint-react/src/components/measured-node/measured-node.tsx:11](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/measured-node/measured-node.tsx#L11)

## Properties

### children

> `readonly` **children**: `ReactNode`

Defined in: [packages/joint-react/src/components/measured-node/measured-node.tsx:16](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/measured-node/measured-node.tsx#L16)

The child element to measure.
It can be only HTML or SVG element.

***

### heightPadding

> `readonly` **heightPadding**: `number`

Defined in: [packages/joint-react/src/components/measured-node/measured-node.tsx:32](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/measured-node/measured-node.tsx#L32)

The padding to add to the height of the element.

#### Default

```ts
0
```

***

### onSetSize()?

> `readonly` `optional` **onSetSize**: (`element`, `size`) => `void`

Defined in: [packages/joint-react/src/components/measured-node/measured-node.tsx:22](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/measured-node/measured-node.tsx#L22)

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

### widthPadding

> `readonly` **widthPadding**: `number`

Defined in: [packages/joint-react/src/components/measured-node/measured-node.tsx:27](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/measured-node/measured-node.tsx#L27)

The padding to add to the width of the element.

#### Default

```ts
0
```
