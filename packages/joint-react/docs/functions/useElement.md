[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useElement

# Function: useElement()

> **useElement**\<`Element`, `ReturnedElements`\>(`selector`, `isEqual`): `ReturnedElements`

Defined in: [packages/joint-react/src/hooks/use-element.ts:31](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-element.ts#L31)

A hook to access `dia.graph` element inside the Paper context (`renderElement`).
It throw error if it's not used inside the `<Paper renderElement />`.

## Type Parameters

• **Element** = [`BaseElement`](../interfaces/BaseElement.md)\<`unknown`\>

• **ReturnedElements** = `Element`

## Parameters

### selector

(`items`) => `ReturnedElements`

The selector function to pick elements.

### isEqual

(`a`, `b`) => `boolean`

The function used to decide equality.

## Returns

`ReturnedElements`

The selected element.

## Examples

Using without a selector (returns all elements):
```tsx
const element = useElement();
```

Using with a selector (extract part of each element):
```tsx
const elementId = useElement((element) => element.id);
```

## Default

```ts
defaultElementSelector
```
