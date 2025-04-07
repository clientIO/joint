[**@joint/react**](../../../../README.md)

***

[@joint/react](../../../../README.md) / [Port](../README.md) / Group

# Variable: Group

> `const` **Group**: `MemoExoticComponent`\<(`props`) => `Element`\> = `Component.PortGroup`

Defined in: [joint-react/src/components/port/index.ts:81](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/port/index.ts#L81)

**`Experimental`**

Portal group is a container for ports. It can be used to group ports together and apply transformations to them.
 This feature is experimental and may change in the future.

## Returns

## Example

```tsx
import { Port } from '@joint/react';

<Port.Group
  id="group-one"
  angle={0}>
    <Port.Item id="port-one" x={0} y={0}>
      <foreignObject className="size-5 bg-sky-200 rounded-full" />
    </Port.Item>
</Port.Group>
```
