[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / OnAddHighlighter

# Type Alias: OnAddHighlighter()\<Highlighter\>

> **OnAddHighlighter**\<`Highlighter`\>: (`cellView`, `element`, `highlighterId`, `options`) => `dia.HighlighterView`\<`Highlighter`\>

Defined in: [packages/joint-react/src/components/highlighters/custom.tsx:10](https://github.com/samuelgja/joint/blob/ba33b9b8c40870ffb787d62832f1ac6786fe7e98/packages/joint-react/src/components/highlighters/custom.tsx#L10)

## Type Parameters

• **Highlighter** *extends* `dia.HighlighterView.Options` = `dia.HighlighterView.Options`

## Parameters

### cellView

`dia.ElementView`\<`dia.Element`\<`dia.Element.Attributes`, `dia.ModelSetOptions`\>\> | `dia.LinkView`\<`dia.Link`\<`dia.Link.Attributes`, `dia.ModelSetOptions`\>\>

### element

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement) | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>

### highlighterId

`string`

### options

`Highlighter`

## Returns

`dia.HighlighterView`\<`Highlighter`\>
