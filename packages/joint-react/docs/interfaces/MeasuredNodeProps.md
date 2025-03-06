[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / MeasuredNodeProps

# Interface: MeasuredNodeProps

Defined in: [packages/joint-react/src/components/measured-node/measured-node.tsx:10](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/measured-node/measured-node.tsx#L10)

## Properties

### children

> `readonly` **children**: `ReactNode`

Defined in: [packages/joint-react/src/components/measured-node/measured-node.tsx:15](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/measured-node/measured-node.tsx#L15)

The child element to measure.
It can be only HTML or SVG element.

***

### heightPadding

> `readonly` **heightPadding**: `number`

Defined in: [packages/joint-react/src/components/measured-node/measured-node.tsx:29](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/measured-node/measured-node.tsx#L29)

The padding to add to the height of the element.

#### Default

```ts
0
```

***

### onSizeChange()?

> `readonly` `optional` **onSizeChange**: (`position`) => `void`

Defined in: [packages/joint-react/src/components/measured-node/measured-node.tsx:19](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/measured-node/measured-node.tsx#L19)

Observer function that is called when the size of the element changes.

#### Parameters

##### position

`PositionObserver`

#### Returns

`void`

***

### widthPadding

> `readonly` **widthPadding**: `number`

Defined in: [packages/joint-react/src/components/measured-node/measured-node.tsx:24](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/measured-node/measured-node.tsx#L24)

The padding to add to the width of the element.

#### Default

```ts
0
```
