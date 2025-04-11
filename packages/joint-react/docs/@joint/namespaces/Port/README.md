[**@joint/react**](../../../README.md)

***

[@joint/react](../../../README.md) / Port

# Port

**`Experimental`**

Joint js [Ports](https://resources.jointjs.com/tutorial/ports) in react.
Ports are used to create connection points on elements.
They are used to create links between elements.
Ports are not positions by default, they are not part of the `real` element node,
so when need to position the ports, you need to use the `Port.Group` component with positioning inside.
So you can set the position of the group and the ports will be positioned according to the group.

## Example

```tsx
import { Port } from '@joint/react';

function RenderElement() {
 return (
   <Port.Group position="right" x={0} dy={0}>
     <Port.Item id="port1">
      <foreignObject width={20} height={20}>
        <div style={{ width: 20, height: 20, backgroundColor: 'red' }} />
      </foreignObject>
     </Port.Item>
   </Port.Group>
```

## Port

- [Group](variables/Group.md)
- [Item](variables/Item.md)
