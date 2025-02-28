[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / Highlighter

# Variable: Highlighter

> `const` **Highlighter**: `object`

Defined in: [packages/joint-react/src/components/highlighters/index.tsx:16](https://github.com/samuelgja/joint/blob/9749094e6efe2db40c6881d5ffe1569d905db73f/packages/joint-react/src/components/highlighters/index.tsx#L16)

Highlighter components.

## Type declaration

### Mask

> **Mask**: `ForwardRefExoticComponent`\<[`Omit`](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)\<`MaskHighlighterProps`, `"ref"`\> & `RefAttributes`\<[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)\>\>

### Opacity

> **Opacity**: `ForwardRefExoticComponent`\<`OpacityHighlighterProps` & `RefAttributes`\<[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)\>\>

### Stroke

> **Stroke**: `ForwardRefExoticComponent`\<[`Omit`](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)\<`StrokeHighlighterProps`, `"ref"`\> & `RefAttributes`\<[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)\>\>

## Example

```tsx
import { Highlighter } from '@client/components/highlighters'
return <Highlighter.Mask />
```
