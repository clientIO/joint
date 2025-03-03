[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / PaperProps

# Interface: PaperProps\<ElementItem\>

Defined in: [packages/joint-react/src/components/paper.tsx:22](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L22)

The props for the Paper component. Extend the `dia.Paper.Options` interface.
For more information, see the JointJS documentation.

## See

https://docs.jointjs.com/api/dia/Paper

## Extends

- `Options`

## Type Parameters

• **ElementItem** *extends* [`GraphElementBase`](GraphElementBase.md) = [`GraphElementBase`](GraphElementBase.md)

## Indexable

\[`key`: `string`\]: `any`

## Properties

### children?

> `readonly` `optional` **children**: `ReactNode`

Defined in: [packages/joint-react/src/components/paper.tsx:82](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L82)

Children to render. Paper automatically wrap the children with the PaperContext, if there is no PaperContext in the parent tree.

***

### className?

> `readonly` `optional` **className**: `string`

Defined in: [packages/joint-react/src/components/paper.tsx:60](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L60)

Class name of the paper element.

#### Overrides

`dia.Paper.Options.className`

***

### elementSelector()?

> `readonly` `optional` **elementSelector**: (`item`) => `ElementItem`

Defined in: [packages/joint-react/src/components/paper.tsx:68](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L68)

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

### isFitContentOnLoadEnabled?

> `readonly` `optional` **isFitContentOnLoadEnabled**: `boolean`

Defined in: [packages/joint-react/src/components/paper.tsx:96](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L96)

Function that is called when the paper is resized.

***

### noDataPlaceholder?

> `readonly` `optional` **noDataPlaceholder**: `ReactNode`

Defined in: [packages/joint-react/src/components/paper.tsx:77](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L77)

Placeholder to be rendered when there is no data (no nodes or elements to render).

***

### onEvent()?

> `readonly` `optional` **onEvent**: (`paper`, `eventName`, ...`args`) => `void`

Defined in: [packages/joint-react/src/components/paper.tsx:91](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L91)

Function that is called when an event is triggered on the paper.

#### Parameters

##### paper

`Paper`

##### eventName

`string`

##### args

...`unknown`[]

#### Returns

`void`

***

### onReady()?

> `readonly` `optional` **onReady**: () => `void`

Defined in: [packages/joint-react/src/components/paper.tsx:51](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L51)

A function that is called when the paper is ready.

#### Returns

`void`

***

### renderElement?

> `readonly` `optional` **renderElement**: [`RenderElement`](../type-aliases/RenderElement.md)\<`ElementItem`\>

Defined in: [packages/joint-react/src/components/paper.tsx:47](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L47)

A function that renders the element. It is called every time the element is rendered.

#### Default

```ts
(element: ElementItem) => BaseElement
 *
```

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
```

***

### scale?

> `readonly` `optional` **scale**: `number`

Defined in: [packages/joint-react/src/components/paper.tsx:73](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L73)

The scale of the paper. It's useful to create for example a zoom feature or minimap Paper.

***

### style?

> `readonly` `optional` **style**: `CSSProperties`

Defined in: [packages/joint-react/src/components/paper.tsx:56](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L56)

The style of the paper element.
