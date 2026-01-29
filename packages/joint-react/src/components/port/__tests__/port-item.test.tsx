/* eslint-disable unicorn/consistent-function-scoping */
import { render, waitFor } from '@testing-library/react';
import { getTestGraph, paperRenderElementWrapper } from '../../../utils/test-wrappers';
import { PortItem } from '../port-item';
import { PortGroup } from '../port-group';
import { runStorybookSnapshot } from '../../../utils/run-storybook-snapshot';
import * as stories from '../port-item.stories';

// Keep the storybook snapshot tests
runStorybookSnapshot({
  Component: PortItem,
  stories,
  name: 'Port/Item',
  withRenderElementWrapper: true,
});

describe('PortItem cleanup', () => {
  const getTestWrapper = () => {
    const graph = getTestGraph();
    return {
      graph,
      wrapper: paperRenderElementWrapper({
        graphProviderProps: {
          graph,
          elements: {
            'element-1': {
              id: 'element-1',
              x: 0,
              y: 0,
              width: 100,
              height: 100,
            },
          },
        },
      }),
    };
  };

  it('should add port on mount', async () => {
    const { graph, wrapper } = getTestWrapper();
    render(
      <PortGroup id="test-group" position="absolute">
        <PortItem id="test-port" />
      </PortGroup>,
      { wrapper }
    );

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) {
        throw new Error('Element not found');
      }
      expect(element.hasPort('test-port')).toBe(true);
    });
  });

  it('should remove port on unmount', async () => {
    const { graph, wrapper } = getTestWrapper();
    const { unmount } = render(
      <PortGroup id="test-group" position="absolute">
        <PortItem id="test-port" />
      </PortGroup>,
      { wrapper }
    );

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) {
        throw new Error('Element not found');
      }
      expect(element.hasPort('test-port')).toBe(true);
    });

    unmount();

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) {
        throw new Error('Element not found');
      }
      expect(element.hasPort('test-port')).toBe(false);
    });
  });

  it('should remove multiple ports on unmount', async () => {
    const { graph, wrapper } = getTestWrapper();
    const { unmount } = render(
      <PortGroup id="test-group" position="absolute">
        <PortItem id="port-1" />
        <PortItem id="port-2" />
        <PortItem id="port-3" />
      </PortGroup>,
      { wrapper }
    );

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) {
        throw new Error('Element not found');
      }
      expect(element.hasPort('port-1')).toBe(true);
      expect(element.hasPort('port-2')).toBe(true);
      expect(element.hasPort('port-3')).toBe(true);
    });

    unmount();

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) {
        throw new Error('Element not found');
      }
      expect(element.hasPort('port-1')).toBe(false);
      expect(element.hasPort('port-2')).toBe(false);
      expect(element.hasPort('port-3')).toBe(false);
    });
  });

  it('should only remove unmounted port, keeping others', async () => {
    const { graph, wrapper } = getTestWrapper();

    const TestComponent = ({ showSecondPort }: { showSecondPort: boolean }) => (
      <PortGroup id="test-group" position="absolute">
        <PortItem id="port-1" />
        {showSecondPort && <PortItem id="port-2" />}
      </PortGroup>
    );

    const { rerender } = render(<TestComponent showSecondPort={true} />, { wrapper });

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) {
        throw new Error('Element not found');
      }
      expect(element.hasPort('port-1')).toBe(true);
      expect(element.hasPort('port-2')).toBe(true);
    });

    // Remove only the second port
    rerender(<TestComponent showSecondPort={false} />);

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) {
        throw new Error('Element not found');
      }
      expect(element.hasPort('port-1')).toBe(true);
      expect(element.hasPort('port-2')).toBe(false);
    });
  });
});
