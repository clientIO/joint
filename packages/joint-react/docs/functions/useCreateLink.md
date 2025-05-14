[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useCreateLink

# Function: useCreateLink()

> **useCreateLink**\<`T`\>(): (`link`) => `void`

Defined in: [joint-react/src/hooks/use-create-link.ts:17](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-create-link.ts#L17)

A custom hook that adds a link to the graph.

## Type Parameters

### T

`T` *extends* `Link`\<`Attributes`, `ModelSetOptions`\> \| [`GraphLink`](../interfaces/GraphLink.md)\<`string`\>

## Returns

`Function`

A function that adds the link to the graph.

### Parameters

#### link

`T`

### Returns

`void`

## Example

```ts
const addLink = useCreateLink();
addLink({ id: '1', source: { id: '2' }, target: { id: '3' } });
```
