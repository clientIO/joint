[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / PaperProps

# Interface: PaperProps\<ElementItem\>

Defined in: [src/components/paper/paper.tsx:23](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L23)

The props for the Paper component. Extend the `dia.Paper.Options` interface.
For more information, see the JointJS documentation.

## See

https://docs.jointjs.com/api/dia/Paper

## Extends

- `Options`.`PaperEvents`

## Type Parameters

### ElementItem

`ElementItem` *extends* [`GraphElementBase`](GraphElementBase.md) = [`GraphElementBase`](GraphElementBase.md)

## Indexable

\[`key`: `string`\]: `any`

## Properties

### children?

> `readonly` `optional` **children**: `ReactNode`

Defined in: [src/components/paper/paper.tsx:88](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L88)

Children to render. Paper automatically wrap the children with the PaperContext, if there is no PaperContext in the parent tree.

***

### className?

> `readonly` `optional` **className**: `string`

Defined in: [src/components/paper/paper.tsx:66](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L66)

Class name of the paper element.

#### Overrides

`dia.Paper.Options.className`

***

### elementSelector()?

> `readonly` `optional` **elementSelector**: (`item`) => `ElementItem`

Defined in: [src/components/paper/paper.tsx:74](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L74)

A function that selects the elements to be rendered.
It defaults to the `GraphElement` elements because `dia.Element` is not a valid React element (it do not change reference after update).

#### Parameters

##### item

[`GraphElement`](GraphElement.md)

#### Returns

`ElementItem`

#### Default

(item: dia.Cell) => `BaseElement`

#### See

GraphElement<Data>

***

### isTransformToFitContentEnabled?

> `readonly` `optional` **isTransformToFitContentEnabled**: `boolean`

Defined in: [src/components/paper/paper.tsx:93](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L93)

Function that is called when the paper is resized.

***

### noDataPlaceholder?

> `readonly` `optional` **noDataPlaceholder**: `ReactNode`

Defined in: [src/components/paper/paper.tsx:83](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L83)

Placeholder to be rendered when there is no data (no nodes or elements to render).

***

### onBlankContextmenu?

> `optional` **onBlankContextmenu**: `PaperEventHandler`\<`"blank:contextmenu"`\>

#### Inherited from

`PaperEvents.onBlankContextmenu`

***

### onBlankMouseenter?

> `optional` **onBlankMouseenter**: `PaperEventHandler`\<`"blank:mouseenter"`\>

#### Inherited from

`PaperEvents.onBlankMouseenter`

***

### onBlankMouseleave?

> `optional` **onBlankMouseleave**: `PaperEventHandler`\<`"blank:mouseleave"`\>

#### Inherited from

`PaperEvents.onBlankMouseleave`

***

### onBlankMouseout?

> `optional` **onBlankMouseout**: `PaperEventHandler`\<`"blank:mouseout"`\>

#### Inherited from

`PaperEvents.onBlankMouseout`

***

### onBlankMouseover?

> `optional` **onBlankMouseover**: `PaperEventHandler`\<`"blank:mouseover"`\>

#### Inherited from

`PaperEvents.onBlankMouseover`

***

### onBlankMousewheel?

> `optional` **onBlankMousewheel**: `PaperEventHandler`\<`"blank:mousewheel"`\>

#### Inherited from

`PaperEvents.onBlankMousewheel`

***

### onBlankPointerClick?

> `optional` **onBlankPointerClick**: `PaperEventHandler`\<`"blank:pointerclick"`\>

#### Inherited from

`PaperEvents.onBlankPointerClick`

***

### onBlankPointerdblClick?

> `optional` **onBlankPointerdblClick**: `PaperEventHandler`\<`"blank:pointerdblclick"`\>

#### Inherited from

`PaperEvents.onBlankPointerdblClick`

***

### onBlankPointerdown?

> `optional` **onBlankPointerdown**: `PaperEventHandler`\<`"blank:pointerdown"`\>

#### Inherited from

`PaperEvents.onBlankPointerdown`

***

### onBlankPointermove?

> `optional` **onBlankPointermove**: `PaperEventHandler`\<`"blank:pointermove"`\>

#### Inherited from

`PaperEvents.onBlankPointermove`

***

### onBlankPointerup?

> `optional` **onBlankPointerup**: `PaperEventHandler`\<`"blank:pointerup"`\>

#### Inherited from

`PaperEvents.onBlankPointerup`

***

### onCellContextmenu?

> `optional` **onCellContextmenu**: `PaperEventHandler`\<`"cell:contextmenu"`\>

#### Inherited from

`PaperEvents.onCellContextmenu`

***

### onCellHighlight?

> `optional` **onCellHighlight**: `PaperEventHandler`\<`"cell:highlight"`\>

#### Inherited from

`PaperEvents.onCellHighlight`

***

### onCellHighlightInvalid?

> `optional` **onCellHighlightInvalid**: `PaperEventHandler`\<`"cell:highlight:invalid"`\>

#### Inherited from

`PaperEvents.onCellHighlightInvalid`

***

### onCellMouseenter?

> `optional` **onCellMouseenter**: `PaperEventHandler`\<`"cell:mouseenter"`\>

#### Inherited from

`PaperEvents.onCellMouseenter`

***

### onCellMouseleave?

> `optional` **onCellMouseleave**: `PaperEventHandler`\<`"cell:mouseleave"`\>

#### Inherited from

`PaperEvents.onCellMouseleave`

***

### onCellMouseout?

> `optional` **onCellMouseout**: `PaperEventHandler`\<`"cell:mouseout"`\>

#### Inherited from

`PaperEvents.onCellMouseout`

***

### onCellMouseover?

> `optional` **onCellMouseover**: `PaperEventHandler`\<`"cell:mouseover"`\>

#### Inherited from

`PaperEvents.onCellMouseover`

***

### onCellMousewheel?

> `optional` **onCellMousewheel**: `PaperEventHandler`\<`"cell:mousewheel"`\>

#### Inherited from

`PaperEvents.onCellMousewheel`

***

### onCellPointerClick?

> `optional` **onCellPointerClick**: `PaperEventHandler`\<`"cell:pointerclick"`\>

#### Inherited from

`PaperEvents.onCellPointerClick`

***

### onCellPointerdblClick?

> `optional` **onCellPointerdblClick**: `PaperEventHandler`\<`"cell:pointerdblclick"`\>

#### Inherited from

`PaperEvents.onCellPointerdblClick`

***

### onCellPointerdown?

> `optional` **onCellPointerdown**: `PaperEventHandler`\<`"cell:pointerdown"`\>

#### Inherited from

`PaperEvents.onCellPointerdown`

***

### onCellPointermove?

> `optional` **onCellPointermove**: `PaperEventHandler`\<`"cell:pointermove"`\>

#### Inherited from

`PaperEvents.onCellPointermove`

***

### onCellPointerup?

> `optional` **onCellPointerup**: `PaperEventHandler`\<`"cell:pointerup"`\>

#### Inherited from

`PaperEvents.onCellPointerup`

***

### onCellUnhighlight?

> `optional` **onCellUnhighlight**: `PaperEventHandler`\<`"cell:unhighlight"`\>

#### Inherited from

`PaperEvents.onCellUnhighlight`

***

### onCustom?

> `optional` **onCustom**: `PaperEventHandler`\<`"custom"`\>

#### Inherited from

`PaperEvents.onCustom`

***

### onElementContextmenu?

> `optional` **onElementContextmenu**: `PaperEventHandler`\<`"element:contextmenu"`\>

#### Inherited from

`PaperEvents.onElementContextmenu`

***

### onElementMagnetContextmenu?

> `optional` **onElementMagnetContextmenu**: `PaperEventHandler`\<`"element:magnet:contextmenu"`\>

#### Inherited from

`PaperEvents.onElementMagnetContextmenu`

***

### onElementMagnetPointerClick?

> `optional` **onElementMagnetPointerClick**: `PaperEventHandler`\<`"element:magnet:pointerclick"`\>

#### Inherited from

`PaperEvents.onElementMagnetPointerClick`

***

### onElementMagnetPointerdblClick?

> `optional` **onElementMagnetPointerdblClick**: `PaperEventHandler`\<`"element:magnet:pointerdblclick"`\>

#### Inherited from

`PaperEvents.onElementMagnetPointerdblClick`

***

### onElementMouseenter?

> `optional` **onElementMouseenter**: `PaperEventHandler`\<`"element:mouseenter"`\>

#### Inherited from

`PaperEvents.onElementMouseenter`

***

### onElementMouseleave?

> `optional` **onElementMouseleave**: `PaperEventHandler`\<`"element:mouseleave"`\>

#### Inherited from

`PaperEvents.onElementMouseleave`

***

### onElementMouseout?

> `optional` **onElementMouseout**: `PaperEventHandler`\<`"element:mouseout"`\>

#### Inherited from

`PaperEvents.onElementMouseout`

***

### onElementMouseover?

> `optional` **onElementMouseover**: `PaperEventHandler`\<`"element:mouseover"`\>

#### Inherited from

`PaperEvents.onElementMouseover`

***

### onElementMousewheel?

> `optional` **onElementMousewheel**: `PaperEventHandler`\<`"element:mousewheel"`\>

#### Inherited from

`PaperEvents.onElementMousewheel`

***

### onElementPointerClick?

> `optional` **onElementPointerClick**: `PaperEventHandler`\<`"element:pointerclick"`\>

#### Inherited from

`PaperEvents.onElementPointerClick`

***

### onElementPointerdblClick?

> `optional` **onElementPointerdblClick**: `PaperEventHandler`\<`"element:pointerdblclick"`\>

#### Inherited from

`PaperEvents.onElementPointerdblClick`

***

### onElementPointerdown?

> `optional` **onElementPointerdown**: `PaperEventHandler`\<`"element:pointerdown"`\>

#### Inherited from

`PaperEvents.onElementPointerdown`

***

### onElementPointermove?

> `optional` **onElementPointermove**: `PaperEventHandler`\<`"element:pointermove"`\>

#### Inherited from

`PaperEvents.onElementPointermove`

***

### onElementPointerup?

> `optional` **onElementPointerup**: `PaperEventHandler`\<`"element:pointerup"`\>

#### Inherited from

`PaperEvents.onElementPointerup`

***

### onLinkConnect?

> `optional` **onLinkConnect**: `PaperEventHandler`\<`"link:connect"`\>

#### Inherited from

`PaperEvents.onLinkConnect`

***

### onLinkContextmenu?

> `optional` **onLinkContextmenu**: `PaperEventHandler`\<`"link:contextmenu"`\>

#### Inherited from

`PaperEvents.onLinkContextmenu`

***

### onLinkDisconnect?

> `optional` **onLinkDisconnect**: `PaperEventHandler`\<`"link:disconnect"`\>

#### Inherited from

`PaperEvents.onLinkDisconnect`

***

### onLinkMouseenter?

> `optional` **onLinkMouseenter**: `PaperEventHandler`\<`"link:mouseenter"`\>

#### Inherited from

`PaperEvents.onLinkMouseenter`

***

### onLinkMouseleave?

> `optional` **onLinkMouseleave**: `PaperEventHandler`\<`"link:mouseleave"`\>

#### Inherited from

`PaperEvents.onLinkMouseleave`

***

### onLinkMouseout?

> `optional` **onLinkMouseout**: `PaperEventHandler`\<`"link:mouseout"`\>

#### Inherited from

`PaperEvents.onLinkMouseout`

***

### onLinkMouseover?

> `optional` **onLinkMouseover**: `PaperEventHandler`\<`"link:mouseover"`\>

#### Inherited from

`PaperEvents.onLinkMouseover`

***

### onLinkMousewheel?

> `optional` **onLinkMousewheel**: `PaperEventHandler`\<`"link:mousewheel"`\>

#### Inherited from

`PaperEvents.onLinkMousewheel`

***

### onLinkPointerClick?

> `optional` **onLinkPointerClick**: `PaperEventHandler`\<`"link:pointerclick"`\>

#### Inherited from

`PaperEvents.onLinkPointerClick`

***

### onLinkPointerdblClick?

> `optional` **onLinkPointerdblClick**: `PaperEventHandler`\<`"link:pointerdblclick"`\>

#### Inherited from

`PaperEvents.onLinkPointerdblClick`

***

### onLinkPointerdown?

> `optional` **onLinkPointerdown**: `PaperEventHandler`\<`"link:pointerdown"`\>

#### Inherited from

`PaperEvents.onLinkPointerdown`

***

### onLinkPointermove?

> `optional` **onLinkPointermove**: `PaperEventHandler`\<`"link:pointermove"`\>

#### Inherited from

`PaperEvents.onLinkPointermove`

***

### onLinkPointerup?

> `optional` **onLinkPointerup**: `PaperEventHandler`\<`"link:pointerup"`\>

#### Inherited from

`PaperEvents.onLinkPointerup`

***

### onLinkSnapConnect?

> `optional` **onLinkSnapConnect**: `PaperEventHandler`\<`"link:snap:connect"`\>

#### Inherited from

`PaperEvents.onLinkSnapConnect`

***

### onLinkSnapDisconnect?

> `optional` **onLinkSnapDisconnect**: `PaperEventHandler`\<`"link:snap:disconnect"`\>

#### Inherited from

`PaperEvents.onLinkSnapDisconnect`

***

### onPaperPan?

> `optional` **onPaperPan**: `PaperEventHandler`\<`"paper:pan"`\>

#### Inherited from

`PaperEvents.onPaperPan`

***

### onPaperPinch?

> `optional` **onPaperPinch**: `PaperEventHandler`\<`"paper:pinch"`\>

#### Inherited from

`PaperEvents.onPaperPinch`

***

### onReady()?

> `readonly` `optional` **onReady**: () => `void`

Defined in: [src/components/paper/paper.tsx:57](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L57)

A function that is called when the paper is ready.

#### Returns

`void`

***

### onRenderDone?

> `optional` **onRenderDone**: `PaperEventHandler`\<`"render:done"`\>

#### Inherited from

`PaperEvents.onRenderDone`

***

### onResize?

> `optional` **onResize**: `PaperEventHandler`\<`"resize"`\>

#### Inherited from

`PaperEvents.onResize`

***

### onScale?

> `optional` **onScale**: `PaperEventHandler`\<`"scale"`\>

#### Inherited from

`PaperEvents.onScale`

***

### onTransform?

> `optional` **onTransform**: `PaperEventHandler`\<`"transform"`\>

#### Inherited from

`PaperEvents.onTransform`

***

### onTranslate?

> `optional` **onTranslate**: `PaperEventHandler`\<`"translate"`\>

#### Inherited from

`PaperEvents.onTranslate`

***

### renderElement?

> `readonly` `optional` **renderElement**: [`RenderElement`](../type-aliases/RenderElement.md)\<`ElementItem`\>

Defined in: [src/components/paper/paper.tsx:53](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L53)

A function that renders the element.

Note: Jointjs works by default with SVG's so by default renderElement is append inside the SVGElement node.
To use HTML elements, you need to use the `HtmlNode` component or `foreignObject` element.

This is called when the data from `elementSelector` changes.

#### Examples

Example with `global component`:
```tsx
type BaseElementWithData = InferElement<typeof initialElements>
function RenderElement({ data }: BaseElementWithData) {
 return <HtmlElement className="node">{data.label}</HtmlElement>
}
```

Example with `local component`:
```tsx

 type BaseElementWithData = InferElement<typeof initialElements>
 const renderElement: RenderElement<BaseElementWithData> = useCallback(
     (element) => <HtmlElement className="node">{element.data.label}</HtmlElement>,
     []
 )
 * ```

***

### scale?

> `readonly` `optional` **scale**: `number`

Defined in: [src/components/paper/paper.tsx:79](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L79)

The scale of the paper. It's useful to create for example a zoom feature or minimap Paper.

***

### style?

> `readonly` `optional` **style**: `CSSProperties`

Defined in: [src/components/paper/paper.tsx:62](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L62)

The style of the paper element.
