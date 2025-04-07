/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-shadow */
import type { dia } from '@joint/core';
import { memo, useEffect } from 'react';
import { PortGroupContext } from 'src/context/port-group-context';
import { useCellId, useGraph } from 'src/hooks';
import type { PortGroupBase } from './port.types';
export interface PortGroupProps extends PortGroupBase {
  readonly id: string;
  readonly children?: React.ReactNode;
}
/**
 * Get the group body for the port group.
 * @param props - The properties of the port group.
 * @returns The group body for the port group.
 * @group utils
 * @description
 * This function is used to get the group body for the port group.
 */
function getGroupBody(props: PortGroupBase): dia.Element.PortGroup {
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
  const {
    id,
    children,
    angle,
    compensateRotation,
    dx,
    dy,
    end,
    position,
    start,
    startAngle,
    step,
    x,
    y,
  } = props;
  const cellId = useCellId();
  const graph = useGraph();

  useEffect(() => {
    const cell = graph.getCell(cellId);
    if (!cell?.isElement()) return;

    const ports = cell.get('ports') || {};
    const groups = ports.groups || {};
    const newGroup = getGroupBody({
      angle,
      compensateRotation,
      dx,
      dy,
      end,
      position,
      start,
      startAngle,
      step,
      x,
      y,
    });
    cell.set('ports', {
      ...ports,
      groups: {
        ...groups,
        [id]: newGroup,
      },
    });

    return () => {
      const ports = cell.get('ports') || {};
      const groups = { ...ports.groups };
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete groups[id];
      cell.set('ports', { ...ports, groups });
    };
  }, [
    angle,
    cellId,
    compensateRotation,
    dx,
    dy,
    end,
    graph,
    id,
    position,
    start,
    startAngle,
    step,
    x,
    y,
  ]);

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
 *       <foreignObject className="size-5 bg-sky-200 rounded-full" />
 *     </Port.Item>
 * </Port.Group>
 * ```
 */
export const PortGroup = memo(Component);
