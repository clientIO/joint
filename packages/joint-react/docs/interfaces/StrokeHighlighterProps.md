[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / StrokeHighlighterProps

# Interface: StrokeHighlighterProps

Defined in: [joint-react/src/components/highlighters/stroke.tsx:8](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/highlighters/stroke.tsx#L8)

## Extends

- `PropsWithChildren`.`SVGProps`\<[`SVGPathElement`](https://developer.mozilla.org/docs/Web/API/SVGPathElement)\>

## Properties

### isHidden?

> `readonly` `optional` **isHidden**: `boolean`

Defined in: [joint-react/src/components/highlighters/stroke.tsx:36](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/highlighters/stroke.tsx#L36)

If the highlighter is disabled or not.

***

### layer?

> `readonly` `optional` **layer**: `string`

Defined in: [joint-react/src/components/highlighters/stroke.tsx:12](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/highlighters/stroke.tsx#L12)

The stacking order of the highlighter. See dia.HighlighterView for supported values.

***

### nonScalingStroke?

> `readonly` `optional` **nonScalingStroke**: `boolean`

Defined in: [joint-react/src/components/highlighters/stroke.tsx:32](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/highlighters/stroke.tsx#L32)

When enabled the stroke width of the highlighter is not dependent on the transformations of the paper (e.g. zoom level). It defaults to false.

***

### padding?

> `readonly` `optional` **padding**: `number`

Defined in: [joint-react/src/components/highlighters/stroke.tsx:16](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/highlighters/stroke.tsx#L16)

The space between the stroke and the element

***

### rx?

> `readonly` `optional` **rx**: `number`

Defined in: [joint-react/src/components/highlighters/stroke.tsx:20](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/highlighters/stroke.tsx#L20)

The stroke's border radius on the x-axis

#### Overrides

`React.SVGProps.rx`

***

### ry?

> `readonly` `optional` **ry**: `number`

Defined in: [joint-react/src/components/highlighters/stroke.tsx:24](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/highlighters/stroke.tsx#L24)

The stroke's border radius on the y-axis

#### Overrides

`React.SVGProps.ry`

***

### useFirstSubpath?

> `readonly` `optional` **useFirstSubpath**: `boolean`

Defined in: [joint-react/src/components/highlighters/stroke.tsx:28](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/highlighters/stroke.tsx#L28)

Draw the stroke by using the first subpath of the target el compound path.
