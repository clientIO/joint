import type { dia } from '@joint/core';
import { memo, useContext, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useCellId, usePaper } from '../../hooks';
import { PortGroupContext } from '../../context/port-group-context';
import { useGraphStore } from '../../hooks/use-graph-store';
import { PORTAL_SELECTOR } from '../../data/create-ports-data';
import { jsx } from '../../utils/joint-jsx/jsx-to-markup';
import { createElements } from '../../utils/create';

const elementMarkup = jsx(<g joint-selector={PORTAL_SELECTOR} />);

export enum Magnet {
  PASSIVE = 'passive',
}
export interface PortItemProps {
  /**
   * Magnet - define if the port is passive or not. It can be set to any value inside the paper.
   * @default true
   */
  readonly magnet?: string;
  /**
   * The id of the port. It must be unique within the cell.
   */
  readonly id: string;
  /**
   * The group id of the port. It must be unique within the cell.
   */
  readonly groupId?: string;
  /**
   * The z-index of the port. It must be unique within the cell.
   */
  readonly z?: number | 'auto';
  /*
   * The x position of the port. It can be a number or a string.
   */
  readonly children?: React.ReactNode;
  /**
   * The y position of the port. It can be a number or a string.
   */
  readonly x?: number | string;
  /**
   * The y position of the port. It can be a number or a string.
   */
  readonly y?: number | string;
  /**
   * The x offset of the port. It can be a number or a string.
   */
  readonly dx?: number | string;
  /**
   * The y offset of the port. It can be a number or a string.
   */
  readonly dy?: number | string;
}

// eslint-disable-next-line jsdoc/require-jsdoc
function Component(props: PortItemProps) {
  const { magnet, id, children, groupId, z, x, y, dx, dy } = props;
  const cellId = useCellId();
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
        dx,
        dy,
        x,
        y,
      },
      attrs: {
        [PORTAL_SELECTOR]: {
          magnet: magnet ?? true,
        },
      },
      markup: elementMarkup,
    };

    cell.addPort(port);
    return () => {
      cell.removePort(id);
    };
  }, [cellId, contextGroupId, graph, groupId, paper, id, x, y, z, magnet, dx, dy]);

  const portalNode = useSyncExternalStore(
    subscribeToPorts,
    () => getPortElement(cellId, id),
    () => getPortElement(cellId, id)
  );

  useEffect(() => {
    if (!portalNode) {
      return;
    }

    const elementView = paper.findViewByModel(cellId);

    elementView.cleanNodesCache();
    for (const link of graph.getConnectedLinks(elementView.model)) {
      const target = link.target();
      const source = link.source();

      const isElementLink = target.id === cellId || source.id === cellId;
      if (!isElementLink) {
        continue;
      }

      const isPortLink = target.port === id || source.port === id;
      if (!isPortLink) {
        continue;
      }
      // @ts-expect-error we use private jointjs api method, it throw error here.
      link.findView(paper).requestConnectionUpdate({ async: false });
    }
  }, [cellId, graph, id, paper, portalNode]);

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

createElements([
  {
    id: 'port-one',
  },
]);
