import { dia } from '@joint/core';
import { memo, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PortGroupContext } from 'src/context/port-group-context';
import { useCellId, usePaper } from 'src/hooks';
import { useGraphStore } from 'src/hooks/use-graph-store';
import { jsx } from 'src/utils/joint-jsx/jsx-to-markup';
import { useSyncExternalStore } from 'use-sync-external-store';

export const PORTAL_SELECTOR = 'portalis';
// eslint-disable-next-line @eslint-react/dom/no-unknown-property
const elementMarkup = jsx(<g joint-selector={PORTAL_SELECTOR} />);
export interface PortItemProps {
  readonly isPassive?: boolean;
  readonly id: string;
  readonly groupId?: string;
  readonly z?: number | 'auto';
  readonly children?: React.ReactNode;
  readonly x?: number | string;
  readonly y?: number | string;
}
/**
 * Generate a unique port id based on the cell id and the port id.
 * @param id - The port id.
 * @returns The unique port id.
 * @group Hooks
 */
export function usePortId(id: string) {
  const cellId = useCellId();
  return `${cellId}-${id}`;
}

// eslint-disable-next-line jsdoc/require-jsdoc
function Component(props: PortItemProps) {
  const { isPassive, children, groupId, z, x, y } = props;
  const cellId = useCellId();

  const id = usePortId(props.id);
  const paper = usePaper();
  const { graph, subscribeToPorts, getPortElement } = useGraphStore();

  const contextGroupId = useContext(PortGroupContext);

  useEffect(() => {
    const cell = graph.getCell(cellId);
    if (!cell) {
      throw new Error(`Cell with id ${cellId} not found`);
    }
    if (!cell.isElement()) {
      return;
    }
    if (!id) {
      throw new Error(`Port id is required`);
    }

    const alreadyExists = cell.getPorts().some((p) => p.id === id);
    if (alreadyExists) {
      throw new Error(`Port with id ${id} already exists`);
    }

    const port: dia.Element.Port = {
      group: groupId ?? contextGroupId,
      z,
      id,
      args: {
        x,
        y,
      },
      attrs: {
        [PORTAL_SELECTOR]: {
          magnet: isPassive ? 'passive' : true,
        },
      },
      markup: elementMarkup,
    };

    cell.addPort(port);

    const elementView = cell.findView(paper);
    if (!(elementView instanceof dia.ElementView)) {
      return;
    }

    return () => {
      cell.removePort(id);
    };
  }, [cellId, contextGroupId, graph, groupId, isPassive, paper, id, x, y, z]);

  const portalNode = useSyncExternalStore(
    subscribeToPorts,
    () => getPortElement(id),
    () => getPortElement(id)
  );

  if (!portalNode) {
    return null;
  }

  return createPortal(children, portalNode);
}

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
export const PortItem = memo(Component);
