[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / TextNodeProps

# Interface: TextNodeProps

Defined in: [joint-react/src/components/text-node/text-node.tsx:7](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/text-node/text-node.tsx#L7)

## Extends

- `SVGTextElementAttributes`\<[`SVGTextElement`](https://developer.mozilla.org/docs/Web/API/SVGTextElement)\>.`TextOptions`

## Properties

### annotations?

> `optional` **annotations**: `TextAnnotation`[]

Defined in: [joint-core/types/vectorizer.d.ts:27](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/vectorizer.d.ts#L27)

#### Inherited from

`Vectorizer.TextOptions.annotations`

***

### displayEmpty?

> `optional` **displayEmpty**: `boolean`

Defined in: [joint-core/types/vectorizer.d.ts:29](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/vectorizer.d.ts#L29)

#### Inherited from

`Vectorizer.TextOptions.displayEmpty`

***

### eol?

> `readonly` `optional` **eol**: `string`

Defined in: [joint-react/src/components/text-node/text-node.tsx:10](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/text-node/text-node.tsx#L10)

#### Overrides

`Vectorizer.TextOptions.eol`

***

### height?

> `readonly` `optional` **height**: `number`

Defined in: [joint-react/src/components/text-node/text-node.tsx:12](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/text-node/text-node.tsx#L12)

#### Overrides

`SVGTextElementAttributes.height`

***

### includeAnnotationIndices?

> `optional` **includeAnnotationIndices**: `boolean`

Defined in: [joint-core/types/vectorizer.d.ts:28](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/vectorizer.d.ts#L28)

#### Inherited from

`Vectorizer.TextOptions.includeAnnotationIndices`

***

### lineHeight?

> `optional` **lineHeight**: `string` \| `number`

Defined in: [joint-core/types/vectorizer.d.ts:25](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/vectorizer.d.ts#L25)

#### Inherited from

`Vectorizer.TextOptions.lineHeight`

***

### textPath?

> `optional` **textPath**: `string` \| \{\}

Defined in: [joint-core/types/vectorizer.d.ts:26](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/vectorizer.d.ts#L26)

#### Inherited from

`Vectorizer.TextOptions.textPath`

***

### textVerticalAnchor?

> `optional` **textVerticalAnchor**: `string` \| `number`

Defined in: [joint-core/types/vectorizer.d.ts:24](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/vectorizer.d.ts#L24)

#### Inherited from

`Vectorizer.TextOptions.textVerticalAnchor`

***

### textWrap

> `readonly` **textWrap**: `boolean` \| `BreakTextOptions`

Defined in: [joint-react/src/components/text-node/text-node.tsx:13](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/text-node/text-node.tsx#L13)

***

### width?

> `readonly` `optional` **width**: `number`

Defined in: [joint-react/src/components/text-node/text-node.tsx:11](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/text-node/text-node.tsx#L11)

#### Overrides

`SVGTextElementAttributes.width`
