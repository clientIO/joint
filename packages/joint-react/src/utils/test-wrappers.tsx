import { useCallback } from 'react';
import { GraphProvider, Paper, type GraphProviderProps, type PaperProps } from '../components';
import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE } from '../store/graph-store';
import { ELEMENT_MODEL_TYPE } from '../models/element-model';
import { LINK_MODEL_TYPE } from '../models/link-model';
import type { CellRecord } from '../types/cell.types';

/**
 * Testing helper to create a new JointJS graph instance.
 * @returns A new JointJS graph.
 * @internal
 * @group utils
 */
export function getTestGraph() {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}
/**
 * Testing helper to render a `GraphProvider` provider.
 * @param props - Props forwarded to the `GraphProvider` root component.
 * @returns A component that wraps children with `GraphProvider`.
 * @internal
 * @group utils
 */
export function graphProviderWrapper(props: GraphProviderProps): React.JSXElementConstructor<{
  children: React.ReactNode;
}> {
  return function GraphProviderWrapper({ children }) {
    return <GraphProvider {...props}>{children}</GraphProvider>;
  };
}

interface Options {
  paperProps?: PaperProps;
  graphProviderProps?: GraphProviderProps;
}
/**
 * Testing helper to render a `Paper` inside a `GraphProvider` provider.
 * @param options - Wrapper options.
 * @param options.paperProps - Props for `Paper`.
 * @param options.graphProps - Props for the `GraphProvider` root.
 * @returns A component that wraps children inside `GraphProvider` + `Paper`.
 * @internal
 * @group utils
 */
export function paperRenderElementWrapper(options: Options): React.JSXElementConstructor<{
  children: React.ReactNode;
}> {
  const { paperProps, graphProviderProps } = options;
  return function GraphProviderWrapper({ children }) {
    const renderElement = useCallback(() => {
      return children;
    }, [children]);
    return (
      <GraphProvider {...graphProviderProps}>
        <Paper {...paperProps} width={100} height={100} renderElement={renderElement}></Paper>
      </GraphProvider>
    );
  };
}

export const simpleRenderElementWrapper = paperRenderElementWrapper({
  graphProviderProps: {
    initialCells: [
      {
        id: '1',
        type: ELEMENT_MODEL_TYPE,
        size: { width: 97, height: 99 },
      } as CellRecord,
      {
        id: '2',
        type: ELEMENT_MODEL_TYPE,
        size: { width: 50, height: 50 },
      } as CellRecord,
      {
        id: '3',
        type: LINK_MODEL_TYPE,
        source: { id: '1' },
        target: { id: '2' },
      } as CellRecord,
    ],
  },
});

/**
 * Testing helper to render a `Paper` inside a `GraphProvider` provider with renderLink support.
 * @param options - Wrapper options.
 * @param options.paperProps - Props for `Paper`.
 * @param options.graphProviderProps - Props for the `GraphProvider` root.
 * @returns A component that wraps children inside `GraphProvider` + `Paper` with renderLink.
 * @internal
 * @group utils
 */
export function paperRenderLinkWrapper(options: Options): React.JSXElementConstructor<{
  children: React.ReactNode;
}> {
  const { paperProps, graphProviderProps } = options;
  return function GraphProviderWrapper({ children }) {
    const renderLink = useCallback(() => {
      return children;
    }, [children]);
    return (
      <GraphProvider {...graphProviderProps}>
        <Paper
          {...paperProps}
          width={100}
          height={100}
          renderLink={renderLink}
          // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
          renderElement={() => <rect width={100} height={100} />}
        ></Paper>
      </GraphProvider>
    );
  };
}
