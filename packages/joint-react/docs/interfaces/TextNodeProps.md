[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / TextNodeProps

# Interface: TextNodeProps

Defined in: [joint-react/src/components/text-node/text-node.tsx:5](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/text-node/text-node.tsx#L5)

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

### ellipsis?

> `readonly` `optional` **ellipsis**: `string` \| `boolean`

Defined in: [joint-react/src/components/text-node/text-node.tsx:14](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/text-node/text-node.tsx#L14)

***

### eol?

> `readonly` `optional` **eol**: `string`

Defined in: [joint-react/src/components/text-node/text-node.tsx:8](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/text-node/text-node.tsx#L8)

#### Overrides

`Vectorizer.TextOptions.eol`

***

### height?

> `readonly` `optional` **height**: `number`

Defined in: [joint-react/src/components/text-node/text-node.tsx:11](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/text-node/text-node.tsx#L11)

#### Overrides

`SVGTextElementAttributes.height`

***

### hyphen?

> `readonly` `optional` **hyphen**: `string` \| [`RegExp`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

Defined in: [joint-react/src/components/text-node/text-node.tsx:16](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/text-node/text-node.tsx#L16)

***

### includeAnnotationIndices?

> `optional` **includeAnnotationIndices**: `boolean`

Defined in: [joint-core/types/vectorizer.d.ts:28](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/vectorizer.d.ts#L28)

#### Inherited from

`Vectorizer.TextOptions.includeAnnotationIndices`

***

### isTextWrapEnabled?

> `readonly` `optional` **isTextWrapEnabled**: `boolean`

Defined in: [joint-react/src/components/text-node/text-node.tsx:13](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/text-node/text-node.tsx#L13)

***

### lineHeight?

> `optional` **lineHeight**: `string` \| `number`

Defined in: [joint-core/types/vectorizer.d.ts:25](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/vectorizer.d.ts#L25)

#### Inherited from

`Vectorizer.TextOptions.lineHeight`

***

### maxLineCount?

> `readonly` `optional` **maxLineCount**: `number`

Defined in: [joint-react/src/components/text-node/text-node.tsx:17](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/text-node/text-node.tsx#L17)

***

### preserveSpaces?

> `readonly` `optional` **preserveSpaces**: `boolean`

Defined in: [joint-react/src/components/text-node/text-node.tsx:18](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/text-node/text-node.tsx#L18)

***

### separator?

> `readonly` `optional` **separator**: `unknown`

Defined in: [joint-react/src/components/text-node/text-node.tsx:19](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/text-node/text-node.tsx#L19)

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

### textWrapEol?

> `readonly` `optional` **textWrapEol**: `string`

Defined in: [joint-react/src/components/text-node/text-node.tsx:15](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/text-node/text-node.tsx#L15)

***

### width?

> `readonly` `optional` **width**: `number`

Defined in: [joint-react/src/components/text-node/text-node.tsx:10](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/text-node/text-node.tsx#L10)

#### Overrides

`SVGTextElementAttributes.width`
