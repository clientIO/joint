/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-shadow */
import type { dia } from '@joint/core';
import { memo, useLayoutEffect } from 'react';
import { useCellId } from '../../hooks';
import { useGraphStore } from '../../hooks/use-graph-store';
import { PortGroupContext } from '../../context/port-group-context';
import type { PortLayout, Position } from './port.types';

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
function getGroupBody(props: Partial<PortLayout>): dia.Element.PortGroup {
  const { position = 'absolute', ...args } = props;
  return typeof position === 'function'
    ? { position }
    : {
        position: {
          name: position,
          args: args as dia.Element.PortPositionCallback,
        },
      };
}
// eslint-disable-next-line jsdoc/require-jsdoc
function Component(props: PortGroupProps) {
  const {
    id,
    children,
    // destructure every single layout prop so we can list them individually
    position,
    width,
    height,
  } = props;
  type Coordinate = number | string | undefined;
  let angle: number | undefined;
  let x: Coordinate = undefined;
  let y: Coordinate = undefined;
  let dx: Coordinate = undefined;
  let dy: Coordinate = undefined;
  let start: Position | undefined = undefined;
  let end: Position | undefined = undefined;
  let dr: number | undefined = undefined;
  let startAngle: number | undefined = undefined;
  let step: number | undefined = undefined;
  let compensateRotation: boolean | undefined = undefined;

  switch (position) {
    case 'absolute': {
      angle = props.angle;
      x = props.x;
      y = props.y;
      break;
    }
    case 'bottom':
    case 'top':
    case 'left':
    case 'right': {
      dx = props.dx;
      dy = props.dy;
      x = props.x;
      y = props.y;
      angle = props.angle;
      break;
    }
    case 'line': {
      // Only assign start/end if both x and y are defined
      if (props.start?.x != undefined && props.start.y != undefined) {
        start = props.start as Position;
      }
      if (props.end?.x != undefined && props.end.y != undefined) {
        end = props.end as Position;
      }
      break;
    }
    case 'ellipse':
    case 'ellipseSpread': {
      dx = props.dx;
      dy = props.dy;
      x = props.x;
      y = props.y;
      dr = props.dr;
      startAngle = props.startAngle;
      step = props.step;
      compensateRotation = props.compensateRotation;
    }
  }
  const cellId = useCellId();
  const graphStore = useGraphStore();
  const { graph } = graphStore;

  useLayoutEffect(() => {
    const cell = graph.getCell(cellId);
    if (!cell?.isElement()) return;

    const newGroup = getGroupBody({
      position,
      width,
      height,
      angle,
      x,
      y,
      dx,
      dy,
      start,
      end,
      dr,
      startAngle,
      step,
      compensateRotation,
    });

    // Set port group via graphStore for batching
    const groupData: dia.Element.PortGroup = {
      ...newGroup,
      size: {
        height: typeof height === 'number' ? height : Number(height) || 0,
        width: typeof width === 'number' ? width : Number(width) || 0,
      },
    };
    graphStore.setPortGroup(cellId, id, groupData);
    graphStore.flushPendingUpdates();

    return () => {
      // Remove port group via graphStore for batching
      graphStore.removePortGroup(cellId, id);
    };
  }, [
    angle,
    cellId,
    compensateRotation,
    dr,
    dx,
    dy,
    end,
    graph,
    graphStore,
    height,
    id,
    position,
    start,
    startAngle,
    step,
    width,
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
 *        <rect width={10} height={10} fill="red" />
 *     </Port.Item>
 * </Port.Group>
 * ```
 */

export const PortGroup = memo(Component);
