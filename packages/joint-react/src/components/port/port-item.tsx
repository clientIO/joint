import type { dia } from '@joint/core';
import { memo, useContext, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCellId } from '../../hooks';
import { PortGroupContext } from '../../context/port-group-context';
import { useGraphStore } from '../../hooks/use-graph-store';
import { jsx } from '../../utils/joint-jsx/jsx-to-markup';
import { PaperStoreContext } from '../../context';
import { useGraphInternalStoreSelector } from '../../hooks/use-graph-store-selector';
import { PORTAL_SELECTOR } from '../../store';

const elementMarkup = jsx(<g joint-selector={PORTAL_SELECTOR} />);

export enum Magnet {
  PASSIVE = 'passive',
}

export interface PortItemProps {
  /**
   * Magnet - define if the port is passive or not. It can be set to any value inside the paper.
   * @default true
   */
  readonly magnet?: 'passive' | 'true' | 'false';
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
  readonly dx?: number;
  /**
   * The y offset of the port. It can be a number or a string.
   */
  readonly dy?: number;
}

// eslint-disable-next-line jsdoc/require-jsdoc
function Component(props: PortItemProps) {
  const { magnet, id, children, groupId, z, x, y, dx, dy } = props;
  const cellId = useCellId();
  const paperStore = useContext(PaperStoreContext);
  if (!paperStore) {
    throw new Error('PortItem must be used within a Paper context');
  }
  const { paperId } = paperStore;
  const graphStore = useGraphStore();
  const { graph } = graphStore;

  const contextGroupId = useContext(PortGroupContext);

  useLayoutEffect(() => {
    const cell = graph.getCell(cellId);
    if (!cell) {
      throw new Error(`Cell with id ${cellId} not found`);
    }
    if (!cell.isElement()) {
      return;
    }
    if (!id) {
      throw new Error('Port id is required');
    }

    const alreadyExists = cell.hasPort(id);
    if (alreadyExists) {
      throw new Error(`Port with id ${id} already exists in cell ${cellId}`);
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

    // Add port via graphStore for batching
    graphStore.setPort(cellId, id, port);
    graphStore.flushPendingUpdates();

    return () => {
      // Remove port via graphStore for batching
      graphStore.removePort(cellId, id);
    };
  }, [cellId, contextGroupId, graph, graphStore, groupId, id, x, y, z, magnet, dx, dy]);

  const portalNode = useGraphInternalStoreSelector((state) => {
    const portId = paperStore.getPortId(cellId, id);
    return state.papers[paperId]?.portsData?.[portId];
  });

  useLayoutEffect(() => {
    if (!portalNode) {
      return;
    }

    graphStore.scheduleClearView({
      cellId,
      onValidateLink: (link) => {
        const target = link.target();
        const source = link.source();
        const isPortLink = target.port === id || source.port === id;
        return isPortLink;
      },
    });
    graphStore.flushPendingUpdates();
  }, [cellId, graphStore, id, portalNode]);

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
