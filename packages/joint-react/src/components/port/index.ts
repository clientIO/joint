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
 * Ports are not positions by default, they are not part of the `real` element node,
 * so when need to position the ports, you need to use the `Port.Group` component with positioning inside.
 * So you can set the position of the group and the ports will be positioned according to the group.
 * @group Components
 * @experimental This feature is experimental and may change in the future.
 */
export namespace Port {
  export const Item = Component.PortItem;
  export const Group = Component.PortGroup;
}
