[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / MeasuredNode

# Function: MeasuredNode()

> **MeasuredNode**(`props`): `ReactNode`

Defined in: [packages/joint-react/src/components/measured-node/measured-node.tsx:134](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/measured-node/measured-node.tsx#L134)

Measured node component automatically detects the size of its `children` and updates the graph element (node) width and height automatically when elements resize.

It must be used inside `renderElement` context

## Parameters

### props

[`MeasuredNodeProps`](../interfaces/MeasuredNodeProps.md) & `RefAttributes`\<[`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement) \| [`SVGAElement`](https://developer.mozilla.org/docs/Web/API/SVGAElement)\>

## Returns

`ReactNode`

## See

 - Paper
 - PaperProps

## Examples

Example with a simple div:
```tsx
import { MeasuredNode } from '@joint/react';

function RenderElement() {
  return (
    <MeasuredNode>
      <div style={{ width: 100, height: 50 }}>Content</div>
    </MeasuredNode>
  );
}
```

Example with a simple div without explicit size defined:
```tsx
import { MeasuredNode } from '@joint/react';

function RenderElement() {
  return (
    <MeasuredNode>
      <div style={{ padding: 10 }}>Content</div>
    </MeasuredNode>
  );
}
```

Example with custom size handling:
```tsx
import { MeasuredNode } from '@joint/react';
import type { dia } from '@joint/core';

function RenderElement() {
  const handleSizeChange = (element: dia.Cell, size: { width: number; height: number }) => {
    console.log('New size:', size);
    element.set('size', { width: size.width + 10, height: size.height + 10 });
  };

  return (
    <MeasuredNode onSetSize={handleSizeChange}>
      <div style={{ width: 100, height: 50 }}>Content</div>
    </MeasuredNode>
  );
}
```
