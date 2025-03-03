[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / OnAddHighlighter

# Type Alias: OnAddHighlighter()\<T\>

> **OnAddHighlighter**\<`T`\>: (`cellView`, `element`, `highlighterId`, `options`) => `dia.HighlighterView`\<`T`\>

Defined in: [packages/joint-react/src/components/highlighters/custom.tsx:10](https://github.com/samuelgja/joint/blob/a91832ea2262342cf7ec1914cdb61c5629371a80/packages/joint-react/src/components/highlighters/custom.tsx#L10)

## Type Parameters

• **T** *extends* `dia.HighlighterView.Options` = `dia.HighlighterView.Options`

## Parameters

### cellView

`dia.ElementView`\<`dia.Element`\<`dia.Element.Attributes`, `dia.ModelSetOptions`\>\> | `dia.LinkView`\<`dia.Link`\<`dia.Link.Attributes`, `dia.ModelSetOptions`\>\>

### element

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement) | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>

### highlighterId

`string`

### options

`T`

## Returns

`dia.HighlighterView`\<`T`\>
