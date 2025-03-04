import React from 'react';
import { render } from '@testing-library/react';
import { GraphStoreContext } from '../../context/graph-store-context';
import type { GraphStore } from '../../hooks/use-create-graph-store';
import { GraphProvider } from './graph-provider';

describe('graph-provider', () => {
  it('should render children and match snapshot', () => {
    const { asFragment, getByText } = render(
      <GraphProvider>
        <div>Child Content</div>
      </GraphProvider>
    );
    expect(getByText('Child Content')).toMatchSnapshot();
    expect(asFragment()).toMatchSnapshot();
  });

  it('should provide a graph instance in context', () => {
    let contextGraph: GraphStore | undefined;
    function TestComponent() {
      contextGraph = React.use(GraphStoreContext);
      return null;
    }
    render(
      <GraphProvider>
        <TestComponent />
      </GraphProvider>
    );
    expect(contextGraph).toBeInstanceOf(Object);
  });
});
