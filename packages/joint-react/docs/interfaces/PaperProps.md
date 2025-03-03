[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / PaperProps

# Interface: PaperProps\<T\>

Defined in: [packages/joint-react/src/components/paper.tsx:20](https://github.com/samuelgja/joint/blob/5100bfa1707e62a58cc3b7833d30969c8c4b52ed/packages/joint-react/src/components/paper.tsx#L20)

The props for the Paper component. Extend the `dia.Paper.Options` interface.
For more information, see the JointJS documentation.

## See

https://docs.jointjs.com/api/dia/Paper

## Extends

- `Options`

## Type Parameters

• **T** *extends* [`RequiredCell`](RequiredCell.md) = [`BaseElement`](BaseElement.md)

## Indexable

\[`key`: `string`\]: `any`

## Properties

### children?

> `readonly` `optional` **children**: `ReactNode`

Defined in: [packages/joint-react/src/components/paper.tsx:59](https://github.com/samuelgja/joint/blob/5100bfa1707e62a58cc3b7833d30969c8c4b52ed/packages/joint-react/src/components/paper.tsx#L59)

Children to render. Paper automatically wrap the children with the PaperContext, if there is no PaperContext in the parent tree.

***

### className?

> `readonly` `optional` **className**: `string`

Defined in: [packages/joint-react/src/components/paper.tsx:38](https://github.com/samuelgja/joint/blob/5100bfa1707e62a58cc3b7833d30969c8c4b52ed/packages/joint-react/src/components/paper.tsx#L38)

Class name of the paper element.

#### Overrides

`dia.Paper.Options.className`

***

### elementSelector()?

> `readonly` `optional` **elementSelector**: (`item`) => `T`

Defined in: [packages/joint-react/src/components/paper.tsx:45](https://github.com/samuelgja/joint/blob/5100bfa1707e62a58cc3b7833d30969c8c4b52ed/packages/joint-react/src/components/paper.tsx#L45)

A function that selects the elements to be rendered.
It defaults to the `defaultElementSelector` function which return `BaseElement` because dia.Element is not a valid React element (it do not change reference after update).

#### Parameters

##### item

`Cell`

#### Returns

`T`

#### Default

(item: dia.Cell) => `BaseElement`

***

### isFitContentOnLoadEnabled?

> `readonly` `optional` **isFitContentOnLoadEnabled**: `boolean`

Defined in: [packages/joint-react/src/components/paper.tsx:73](https://github.com/samuelgja/joint/blob/5100bfa1707e62a58cc3b7833d30969c8c4b52ed/packages/joint-react/src/components/paper.tsx#L73)

Function that is called when the paper is resized.

***

### noDataPlaceholder?

> `readonly` `optional` **noDataPlaceholder**: `ReactNode`

Defined in: [packages/joint-react/src/components/paper.tsx:54](https://github.com/samuelgja/joint/blob/5100bfa1707e62a58cc3b7833d30969c8c4b52ed/packages/joint-react/src/components/paper.tsx#L54)

Placeholder to be rendered when there is no data (no nodes or elements to render).

***

### onEvent()?

> `readonly` `optional` **onEvent**: (`paper`, `eventName`, ...`args`) => `void`

Defined in: [packages/joint-react/src/components/paper.tsx:68](https://github.com/samuelgja/joint/blob/5100bfa1707e62a58cc3b7833d30969c8c4b52ed/packages/joint-react/src/components/paper.tsx#L68)

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

Defined in: [packages/joint-react/src/components/paper.tsx:29](https://github.com/samuelgja/joint/blob/5100bfa1707e62a58cc3b7833d30969c8c4b52ed/packages/joint-react/src/components/paper.tsx#L29)

A function that is called when the paper is ready.

#### Returns

`void`

***

### renderElement?

> `readonly` `optional` **renderElement**: [`RenderElement`](../type-aliases/RenderElement.md)\<`T`\>

Defined in: [packages/joint-react/src/components/paper.tsx:25](https://github.com/samuelgja/joint/blob/5100bfa1707e62a58cc3b7833d30969c8c4b52ed/packages/joint-react/src/components/paper.tsx#L25)

A function that renders the element. It is called every time the element is rendered.

#### Default

```ts
(element: T) => BaseElement
```

***

### scale?

> `readonly` `optional` **scale**: `number`

Defined in: [packages/joint-react/src/components/paper.tsx:50](https://github.com/samuelgja/joint/blob/5100bfa1707e62a58cc3b7833d30969c8c4b52ed/packages/joint-react/src/components/paper.tsx#L50)

The scale of the paper. It's useful to create for example a zoom feature or minimap Paper.

***

### style?

> `readonly` `optional` **style**: `CSSProperties`

Defined in: [packages/joint-react/src/components/paper.tsx:34](https://github.com/samuelgja/joint/blob/5100bfa1707e62a58cc3b7833d30969c8c4b52ed/packages/joint-react/src/components/paper.tsx#L34)

The style of the paper element.
