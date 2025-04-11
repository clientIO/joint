/* eslint-disable @typescript-eslint/no-namespace */

import { PortGroup } from './port-group';
import { PortItem } from './port-item';
export type { PortItemProps as PortProps } from './port-item';
export type { PortGroupProps } from './port-group';

const Component = {
  PortGroup,
  PortItem,
};

/**
 * Joint js [Ports](https://resources.jointjs.com/tutorial/ports) in react.
 * Ports are used to create connection points on elements.
 * They are used to create links between elements.
 * Ports are not positions by default, they are not part of the `real` element node,
 * so when need to position the ports, you need to use the `Port.Group` component with positioning inside.
 * So you can set the position of the group and the ports will be positioned according to the group.
 * @group Components
 * @experimental This feature is experimental and may change in the future.
 * @example
 * ```tsx
 * import { Port } from '@joint/react';
 *
 * function RenderElement() {
 *  return (
 *    <Port.Group position="right" x={0} dy={0}>
 *      <Port.Item id="port1">
 *       <foreignObject width={20} height={20}>
 *         <div style={{ width: 20, height: 20, backgroundColor: 'red' }} />
 *       </foreignObject>
 *      </Port.Item>
 *    </Port.Group>
 * ```
 */
export namespace Port {
  /**
   * Create portal based on react component,
   * @experimental This feature is experimental and may change in the future.
   * @group Components
   * @category Port
   * @returns
   * @example
   * With any html element:
   * ```tsx
   * import { Port } from '@joint/react';
   * <Port.Item id="port-one" x={0} y={0}>
   *  <foreignObject  />
   * </Port.Item>
   * ```
   * @example
   * With SVG element:
   * ```tsx
   * import { Port } from '@joint/react';
   * <Port.Item id="port-one" x={0} y={0}>
   *  <circle cx={0} cy={0} r={5} fill="red" />
   * </Port.Item>
   * ```
   */
  export const Item = Component.PortItem;
  /**
   * Portal group is a container for ports. It can be used to group ports together and apply transformations to them.
   * @experimental This feature is experimental and may change in the future.
   * @group Components
   * @category Port
   * @returns
   * @example
   * ```tsx
   * import { Port } from '@joint/react';
   *
   * <Port.Group
   *   id="group-one"
   *   angle={0}>
   *     <Port.Item id="port-one" x={0} y={0}>
   *       <rect width={10} height={10} fill="red" />
   *     </Port.Item>
   * </Port.Group>
   * ```
   */
  export const Group = Component.PortGroup;
}
