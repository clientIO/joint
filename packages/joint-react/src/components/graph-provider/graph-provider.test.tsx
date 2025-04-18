import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { GraphStoreContext } from '../../context/graph-store-context';
import { GraphProvider } from './graph-provider';
import type { Store } from '../../data/create-store';
import { dia } from '@joint/core';
import { useElements, useLinks } from '../../hooks';
import { createElements } from '../../utils/create';
import * as stories from './graph-provider.stories';
import { runStorybookSnapshot } from '../../utils/run-storybook-snapshot';

runStorybookSnapshot({
  Component: GraphProvider,
  stories,
  name: 'GraphProvider',
});
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
    let contextGraph: Store | undefined;
    function TestComponent() {
      contextGraph = React.useContext(GraphStoreContext);
      return null;
    }
    render(
      <GraphProvider>
        <TestComponent />
      </GraphProvider>
    );
    expect(contextGraph).toBeInstanceOf(Object);
  });

  it('should render graph provider with links and elements', async () => {
    const elements = createElements([
      {
        width: 100,
        height: 100,
        id: 'element1',
      },
    ]);
    const link = new dia.Link({ id: 'link1', type: 'standard.Link', source: { id: 'element1' } });
    let linkCount = 0;
    let elementCount = 0;
    function TestComponent() {
      linkCount = useElements((items) => items.size);
      elementCount = useLinks((items) => {
        return items.size;
      });
      return null;
    }
    render(
      // eslint-disable-next-line react-perf/jsx-no-new-array-as-prop
      <GraphProvider defaultElements={elements} defaultLinks={[link]}>
        <TestComponent />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(linkCount).toBe(1);
      expect(elementCount).toBe(1);
    });
  });
  it('should add elements and links after initial load and useElements and useLinks should catch them', async () => {
    const graph = new dia.Graph();
    let linkCount = 0;
    let elementCount = 0;
    // eslint-disable-next-line sonarjs/no-identical-functions
    function TestComponent() {
      linkCount = useElements((items) => items.size);
      elementCount = useLinks((items) => {
        return items.size;
      });
      return null;
    }
    render(
      <GraphProvider graph={graph}>
        <TestComponent />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(linkCount).toBe(0);
      expect(elementCount).toBe(0);
    });

    act(() => {
      graph.addCells([
        new dia.Element({ id: 'element1', type: 'standard.Rectangle' }),
        new dia.Link({ id: 'link1', type: 'standard.Link', source: { id: 'element1' } }),
      ]);
    });

    await waitFor(() => {
      expect(linkCount).toBe(1);
      expect(elementCount).toBe(1);
    });
  });
});
