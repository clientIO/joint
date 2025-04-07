[**@joint/react**](../../../../README.md)

***

[@joint/react](../../../../README.md) / [Port](../README.md) / Item

# Variable: Item

> `const` **Item**: `MemoExoticComponent`\<(`props`) => `null` \| `ReactPortal`\> = `Component.PortItem`

Defined in: [joint-react/src/components/port/index.ts:61](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/port/index.ts#L61)

**`Experimental`**

Create portal based on react component,
 This feature is experimental and may change in the future.

## Returns

## Examples

With any html element:
```tsx
import { Port } from '@joint/react';
<Port.Item id="port-one" x={0} y={0}>
 <foreignObject  />
</Port.Item>
```

With SVG element:
```tsx
import { Port } from '@joint/react';
<Port.Item id="port-one" x={0} y={0}>
 <circle cx={0} cy={0} r={5} fill="red" />
</Port.Item>
```
