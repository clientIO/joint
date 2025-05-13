/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-shadow */
import type { dia } from '@joint/core';
import { memo, useEffect } from 'react';
import { useCellId, useGraph } from '../../hooks';
import { PortGroupContext } from '../../context/port-group-context';
import type { PortLayout } from './port.types';

export type PortGroupProps = {
  readonly id: string;
  readonly children?: React.ReactNode;
} & PortLayout; // PortLayout now includes compensateRotation and all layout props

/**
 * Get the group body for the port group.
 * @param props - The properties of the port group.
 * @returns The group body for the port group.
 * @group utils
 * @description
 * This function is used to get the group body for the port group.
 */
function getGroupBody(props: PortLayout): dia.Element.PortGroup {
  const { position = 'absolute', ...args } = props;
  return typeof position === 'function'
    ? { position }
    : {
        position: {
          name: position,
          args,
        },
      };
}
// eslint-disable-next-line jsdoc/require-jsdoc
function Component(props: PortGroupProps) {
  const { id, children, width, height, ...rest } = props;
  const cellId = useCellId();
  const graph = useGraph();

  useEffect(() => {
    const cell = graph.getCell(cellId);
    if (!cell?.isElement()) return;

    const ports = cell.get('ports') || {};
    const groups = ports.groups || {};
    const newGroup = getGroupBody(rest);
    cell.set('ports', {
      ...ports,
      groups: {
        ...groups,
        [id]: {
          ...newGroup,
          size: { height, width },
        },
      },
    });

    return () => {
      const ports = cell.get('ports') || {};
      const groups = { ...ports.groups };
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete groups[id];
      cell.set('ports', { ...ports, groups });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellId, graph, height, id, width]);

  return <PortGroupContext.Provider value={id}>{children}</PortGroupContext.Provider>;
}
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
 *        <rect width={10} height={10} fill="red" />
 *     </Port.Item>
 * </Port.Group>
 * ```
 */

export const PortGroup = memo(Component);
