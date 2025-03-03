[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / InferElement

# Type Alias: InferElement\<T\>

> **InferElement**\<`T`\>: `T` *extends* infer U[] ? [`Readonly`](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype)\<`U`\> : `never`

Defined in: [packages/joint-react/src/utils/create.ts:35](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/create.ts#L35)

Infer element based on typeof createElements

## Type Parameters

• **T**

## Example

```ts
const elements = createElements([
{ id: '1', type: 'rect', x: 10, y: 10 ,data : { label: 'Node 1' }, width: 100, height: 100 },
{ id: '2', type: 'circle', x: 200, y: 200, data : { label: 'Node 2' }, width: 100, height: 100 },
]);

type BaseElementWithData = InferElement<typeof elements>;
```
