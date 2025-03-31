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

### isDisabled?

> `readonly` `optional` **isDisabled**: `boolean`

Defined in: [joint-react/src/components/highlighters/custom.tsx:40](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/highlighters/custom.tsx#L40)

If the highlighter is disabled or not.

***

### onAdd

> `readonly` **onAdd**: [`OnAddHighlighter`](../type-aliases/OnAddHighlighter.md)\<`Highlighter`\>

Defined in: [joint-react/src/components/highlighters/custom.tsx:31](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/highlighters/custom.tsx#L31)

Callback to add the highlighter.

***

### options

> `readonly` **options**: `Highlighter`

Defined in: [joint-react/src/components/highlighters/custom.tsx:36](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/highlighters/custom.tsx#L36)

This should be memoized
