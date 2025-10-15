import { useCallback } from 'react';
import { GraphProvider, Paper, type GraphProps, type PaperProps } from '../components';

/**
 * Testing helper to render a `GraphProvider` provider.
 * @param props - Props forwarded to the `GraphProvider` root component.
 * @returns A component that wraps children with `GraphProvider`.
 * @internal
 * @group utils
 */
export function graphProviderWrapper(props: GraphProps): React.JSXElementConstructor<{
  children: React.ReactNode;
}> {
  return function GraphProviderWrapper({ children }) {
    return <GraphProvider {...props}>{children}</GraphProvider>;
  };
}

interface Options {
  paperProps?: PaperProps;
  graphProviderProps?: GraphProps;
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
    elements: [
      {
        id: '1',
        width: 97,
        height: 99,
      },
    ],
    links: [
      {
        id: '3',
        source: '1',
        target: '2',
      },
    ],
  },
});
