[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / InferElement

# Type Alias: InferElement\<T\>

> **InferElement**\<`T`\> = `T`\[`number`\]

Defined in: [joint-react/src/utils/create.ts:57](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/create.ts#L57)

Infer element based on typeof createElements

## Type Parameters

### T

`T` *extends* [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>[]

## Example

```ts
const elements = createElements([
{ id: '1', type: 'rect', x: 10, y: 10 ,data : { label: 'Node 1' }, width: 100, height: 100 },
{ id: '2', type: 'circle', x: 200, y: 200, data : { label: 'Node 2' }, width: 100, height: 100 },
]);

type BaseElementWithData = InferElement<typeof elements>;
```
