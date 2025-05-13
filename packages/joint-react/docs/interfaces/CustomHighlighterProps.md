[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / CustomHighlighterProps

# Interface: CustomHighlighterProps\<Highlighter\>

Defined in: [joint-react/src/components/highlighters/custom.tsx:21](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/highlighters/custom.tsx#L21)

## Type Parameters

### Highlighter

`Highlighter` *extends* `dia.HighlighterView.Options` = `dia.HighlighterView.Options`

## Properties

### children?

> `readonly` `optional` **children**: `ReactNode`

Defined in: [joint-react/src/components/highlighters/custom.tsx:27](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/highlighters/custom.tsx#L27)

Child elements to render inside the highlighter.

***

### isHidden?

> `readonly` `optional` **isHidden**: `boolean`

Defined in: [joint-react/src/components/highlighters/custom.tsx:45](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/highlighters/custom.tsx#L45)

If the highlighter is disabled or not.

***

### onCreateHighlighter

> `readonly` **onCreateHighlighter**: [`OnAddHighlighter`](../type-aliases/OnAddHighlighter.md)\<`Highlighter`\>

Defined in: [joint-react/src/components/highlighters/custom.tsx:36](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/highlighters/custom.tsx#L36)

Callback function should return any highlighter.

#### Param

The cell view to which the highlighter is attached.

#### Param

The SVG element to which the highlighter is attached.

#### Param

The ID of the highlighter.

#### Param

The options for the highlighter.

#### Returns

The created highlighter.

***

### options

> `readonly` **options**: `Highlighter`

Defined in: [joint-react/src/components/highlighters/custom.tsx:41](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/highlighters/custom.tsx#L41)

This should be memoized
