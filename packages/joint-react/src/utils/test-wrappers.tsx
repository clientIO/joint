import { useCallback } from 'react';
import { GraphProvider, Paper, type GraphProps, type PaperProps } from '../components';

/**
 * This wrapper is used to render a graph provider.
 * It is used in the tests to render a graph provider.
 * @param props - The props for the graph provider.
 * @returns - The wrapper.
 * @internal
 * @group utils
 * @description
 * This wrapper is used to render a graph provider.
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
  graphProps?: GraphProps;
}
/**
 * This wrapper is used to render a paper with a graph provider.
 * It is used in the tests to render a paper with a graph provider.
 * @param options - The options for the wrapper.
 * @param options.paperProps - The props for the paper.
 * @param options.graphProps - The props for the graph provider.
 * @returns - The wrapper.
 * @internal
 * @group utils
 */
export function paperRenderElementWrapper(options: Options): React.JSXElementConstructor<{
  children: React.ReactNode;
}> {
  const { paperProps, graphProps } = options;
  return function GraphProviderWrapper({ children }) {
    const renderElement = useCallback(() => {
      return children;
    }, [children]);
    return (
      <GraphProvider {...graphProps}>
        <Paper {...paperProps} renderElement={renderElement}></Paper>
      </GraphProvider>
    );
  };
}

export const simpleRenderElementWrapper = paperRenderElementWrapper({
  graphProps: {
    initialElements: [
      {
        id: '1',
        width: 97,
        height: 99,
      },
    ],
  },
});
