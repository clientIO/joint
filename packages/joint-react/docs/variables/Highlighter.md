[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / Highlighter

# Variable: Highlighter

> `const` **Highlighter**: `object`

Defined in: [packages/joint-react/src/components/highlighters/index.tsx:16](https://github.com/samuelgja/joint/blob/e106840dde5e040ebb90e3a712443b6737a1bf58/packages/joint-react/src/components/highlighters/index.tsx#L16)

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
