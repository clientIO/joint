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

• **ElementItem** *extends* [`RequiredCell`](RequiredCell.md) = [`BaseElement`](BaseElement.md)

## Indexable

\[`key`: `string`\]: `any`

## Properties

### children?

> `readonly` `optional` **children**: `ReactNode`

Defined in: [packages/joint-react/src/components/paper.tsx:62](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L62)

Children to render. Paper automatically wrap the children with the PaperContext, if there is no PaperContext in the parent tree.

***

### className?

> `readonly` `optional` **className**: `string`

Defined in: [packages/joint-react/src/components/paper.tsx:41](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L41)

Class name of the paper element.

#### Overrides

`dia.Paper.Options.className`

***

### elementSelector()?

> `readonly` `optional` **elementSelector**: (`item`) => `ElementItem`

Defined in: [packages/joint-react/src/components/paper.tsx:48](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L48)

A function that selects the elements to be rendered.
It defaults to the `defaultElementSelector` function which return `BaseElement` because dia.Element is not a valid React element (it do not change reference after update).

#### Parameters

##### item

`Cell`

#### Returns

`ElementItem`

#### Default

(item: dia.Cell) => `BaseElement`

***

### isFitContentOnLoadEnabled?

> `readonly` `optional` **isFitContentOnLoadEnabled**: `boolean`

Defined in: [packages/joint-react/src/components/paper.tsx:76](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L76)

Function that is called when the paper is resized.

***

### noDataPlaceholder?

> `readonly` `optional` **noDataPlaceholder**: `ReactNode`

Defined in: [packages/joint-react/src/components/paper.tsx:57](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L57)

Placeholder to be rendered when there is no data (no nodes or elements to render).

***

### onEvent()?

> `readonly` `optional` **onEvent**: (`paper`, `eventName`, ...`args`) => `void`

Defined in: [packages/joint-react/src/components/paper.tsx:71](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L71)

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

Defined in: [packages/joint-react/src/components/paper.tsx:32](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L32)

A function that is called when the paper is ready.

#### Returns

`void`

***

### renderElement?

> `readonly` `optional` **renderElement**: [`RenderElement`](../type-aliases/RenderElement.md)\<`ElementItem`\>

Defined in: [packages/joint-react/src/components/paper.tsx:28](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L28)

A function that renders the element. It is called every time the element is rendered.

#### Default

```ts
(element: ElementItem) => BaseElement
```

***

### scale?

> `readonly` `optional` **scale**: `number`

Defined in: [packages/joint-react/src/components/paper.tsx:53](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L53)

The scale of the paper. It's useful to create for example a zoom feature or minimap Paper.

***

### style?

> `readonly` `optional` **style**: `CSSProperties`

Defined in: [packages/joint-react/src/components/paper.tsx:37](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper.tsx#L37)

The style of the paper element.
