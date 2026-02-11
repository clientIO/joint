/* eslint-disable unicorn/consistent-function-scoping */
import { render, waitFor } from '@testing-library/react';
import { getTestGraph, paperRenderElementWrapper } from '../../../utils/test-wrappers';
import { PortItem } from '../port-item';
import { PortGroup } from '../port-group';
import { runStorybookSnapshot } from '../../../utils/run-storybook-snapshot';
import * as stories from '../port-item.stories';
import type { dia } from '@joint/core';
import { PORTAL_SELECTOR } from '../../../store';

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

  const TestComponent = ({ x }: { readonly x: number }) => (
    <PortGroup id="test-group" position="absolute">
      <PortItem id="test-port" x={x} />
    </PortGroup>
  );

  it('should update port props without error when props change', async () => {
    const { graph, wrapper } = getTestWrapper();

    const { rerender } = render(<TestComponent x={0} />, { wrapper });

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) throw new Error('Element not found');
      expect(element.hasPort('test-port')).toBe(true);
    });

    // Changing props should NOT remove and re-add the port (no error)
    rerender(<TestComponent x={50} />);

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) throw new Error('Element not found');
      expect(element.hasPort('test-port')).toBe(true);
    });
  });

  it('should remove port on unmount after props have been changed', async () => {
    const { graph, wrapper } = getTestWrapper();

    const { rerender, unmount } = render(<TestComponent x={0} />, { wrapper });

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) throw new Error('Element not found');
      expect(element.hasPort('test-port')).toBe(true);
    });

    // Change props first
    rerender(<TestComponent x={50} />);

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) throw new Error('Element not found');
      expect(element.hasPort('test-port')).toBe(true);
    });

    // Then unmount - port should be cleaned up
    unmount();

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) throw new Error('Element not found');
      expect(element.hasPort('test-port')).toBe(false);
    });
  });

  it('should set magnet to true by default in port attrs', async () => {
    const { graph, wrapper } = getTestWrapper();
    render(
      <PortGroup id="test-group" position="absolute">
        <PortItem id="test-port" />
      </PortGroup>,
      { wrapper }
    );

    await waitFor(() => {
      const element = graph.getCell('element-1') as dia.Element;
      const port = element.getPort('test-port');
      expect(port.attrs?.[PORTAL_SELECTOR]?.magnet).toBe(true);
    });
  });

  it('should set magnet to "passive" when magnet="passive" is passed', async () => {
    const { graph, wrapper } = getTestWrapper();
    render(
      <PortGroup id="test-group" position="absolute">
        <PortItem id="test-port" magnet="passive" />
      </PortGroup>,
      { wrapper }
    );

    await waitFor(() => {
      const element = graph.getCell('element-1') as dia.Element;
      const port = element.getPort('test-port');
      expect(port.attrs?.[PORTAL_SELECTOR]?.magnet).toBe('passive');
    });
  });

  it('should set magnet to boolean true when magnet={true} is passed', async () => {
    const { graph, wrapper } = getTestWrapper();
    render(
      <PortGroup id="test-group" position="absolute">
        <PortItem id="test-port" magnet={true} />
      </PortGroup>,
      { wrapper }
    );

    await waitFor(() => {
      const element = graph.getCell('element-1') as dia.Element;
      const port = element.getPort('test-port');
      expect(port.attrs?.[PORTAL_SELECTOR]?.magnet).toBe(true);
    });
  });

  it('should set magnet to boolean false when magnet={false} is passed', async () => {
    const { graph, wrapper } = getTestWrapper();
    render(
      <PortGroup id="test-group" position="absolute">
        <PortItem id="test-port" magnet={false} />
      </PortGroup>,
      { wrapper }
    );

    await waitFor(() => {
      const element = graph.getCell('element-1') as dia.Element;
      const port = element.getPort('test-port');
      expect(port.attrs?.[PORTAL_SELECTOR]?.magnet).toBe(false);
    });
  });

  it('should only remove unmounted port, keeping others', async () => {
    const { graph, wrapper } = getTestWrapper();

    const TogglePortComponent = ({ showSecondPort }: { showSecondPort: boolean }) => (
      <PortGroup id="test-group" position="absolute">
        <PortItem id="port-1" />
        {showSecondPort && <PortItem id="port-2" />}
      </PortGroup>
    );

    const { rerender } = render(<TogglePortComponent showSecondPort={true} />, { wrapper });

    await waitFor(() => {
      const element = graph.getCell('element-1');
      if (!element?.isElement()) {
        throw new Error('Element not found');
      }
      expect(element.hasPort('port-1')).toBe(true);
      expect(element.hasPort('port-2')).toBe(true);
    });

    // Remove only the second port
    rerender(<TogglePortComponent showSecondPort={false} />);

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
