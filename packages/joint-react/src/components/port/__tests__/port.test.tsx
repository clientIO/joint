/* eslint-disable sonarjs/no-nested-functions */
import { render, waitFor, act } from '@testing-library/react';
import { useState } from 'react';
import { Port } from '..';
import { paperRenderElementWrapper } from '../../../utils/test-wrappers';
import { dia } from '@joint/core';
import { ReactElement } from '../../../models/react-element';
import '@testing-library/jest-dom';

describe('port', () => {
  it('should render port content via portal (portalNode is created)', async () => {
    const graph = new dia.Graph({}, { cellNamespace: { ReactElement } });
    const { container } = render(
      <Port.Item id="port-test" x={10} y={11}>
        <rect data-testid="port-rect" width={10} height={10} fill="red" />
      </Port.Item>,
      {
        wrapper: paperRenderElementWrapper({
          graphProviderProps: {
            graph,
            elements: {
              'element-1': {
                id: 'element-1',
                width: 100,
                height: 100,
              },
            },
          },
        }),
      }
    );

    // Wait for the port to be created in the graph
    await waitFor(() => {
      const element = graph.getCell('element-1');
      expect(element?.isElement() && element.hasPort('port-test')).toBe(true);
    });

    // Wait for the portal node to be created and port content to be rendered
    await waitFor(
      () => {
        // The port's rect should be rendered in the DOM via portal
        const portRect = container.querySelector('[data-testid="port-rect"]');
        expect(portRect).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should check if the port is created on the graph instance properly', async () => {
    const graph = new dia.Graph({}, { cellNamespace: { ReactElement } });
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': {
            id: 'element-1',
          },
        },
      },
    });
    render(
      <Port.Item id="port-one" x={10} y={11} dx={1} dy={1}>
        <rect id="myRect" width={10} height={10} fill="red" />
      </Port.Item>,
      { wrapper }
    );

    await waitFor(() => {
      const element = graph.getCell('element-1');
      expect(element).toBeInstanceOf(dia.Element);
      if (!element.isElement()) {
        throw new Error('Element is not an instance of dia.Element');
      }

      const port = element.getPort('port-one');
      expect(port).toBeDefined();
      expect(port.id).toBe('port-one');
      // eslint-disable-next-line sonarjs/deprecation
      expect(port.args).toEqual({
        x: 10,
        y: 11,
        dx: 1,
        dy: 1,
      });
    });
  });

  it('should check if the group with port is created on the graph instance properly', async () => {
    const graph = new dia.Graph({}, { cellNamespace: { ReactElement } });
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': {
            id: 'element-1',
          },
        },
      },
    });
    render(
      <Port.Group position="bottom" id="group-one" angle={0}>
        <Port.Item id="port-one" x={0} y={1} dx={2} dy={3}>
          <rect id="myRect" width={10} height={10} fill="red" />
        </Port.Item>
      </Port.Group>,
      { wrapper }
    );

    await waitFor(() => {
      const element = graph.getCell('element-1');
      expect(element).toBeInstanceOf(dia.Element);
      if (!element.isElement()) {
        throw new Error('Element is not an instance of dia.Element');
      }

      const ports = element.getGroupPorts('group-one');
      expect(ports).toHaveLength(1);
      const [port] = ports;
      expect(port.id).toBe('port-one');
      // eslint-disable-next-line sonarjs/deprecation
      expect(port.args).toEqual({
        x: 0,
        y: 1,
        dx: 2,
        dy: 3,
      });
    });
  });

  it('should add ports dynamically without causing infinite loop (Maximum call stack)', async () => {
    const graph = new dia.Graph({}, { cellNamespace: { ReactElement } });

    // Track how many times addPort is called externally
    let addPortTrigger: (() => void) | null = null;

    function DynamicPorts() {
      const [ports, setPorts] = useState([{ id: 'port-1' }]);

       
      addPortTrigger = () => {
        setPorts((previous) => [...previous, { id: `port-${previous.length + 1}` }]);
      };

      return (
        <Port.Group id="dynamic-group" position="bottom">
          {ports.map((port, index) => (
            <Port.Item key={port.id} id={port.id} x={index * 50}>
              <rect data-testid={`port-rect-${port.id}`} width={10} height={10} fill="red" />
            </Port.Item>
          ))}
        </Port.Group>
      );
    }

    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': {
            id: 'element-1',
            width: 200,
            height: 100,
          },
        },
      },
    });

    const { container } = render(<DynamicPorts />, { wrapper });

    // Wait for initial port to be created
    await waitFor(() => {
      const element = graph.getCell('element-1');
      expect(element?.isElement() && element.hasPort('port-1')).toBe(true);
    });

    // Wait for initial port to render via portal
    await waitFor(
      () => {
        const portRect = container.querySelector('[data-testid="port-rect-port-1"]');
        expect(portRect).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Add a second port dynamically - this should NOT cause Maximum call stack exceeded
    act(() => {
      addPortTrigger?.();
    });

    // Wait for second port to be created in the graph
    await waitFor(
      () => {
        const element = graph.getCell('element-1');
        expect(element?.isElement() && element.hasPort('port-2')).toBe(true);
      },
      { timeout: 2000 }
    );

    // Wait for second port to render via portal
    await waitFor(
      () => {
        const portRect = container.querySelector('[data-testid="port-rect-port-2"]');
        expect(portRect).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Add a third port to ensure no infinite loop
    act(() => {
      addPortTrigger?.();
    });

    await waitFor(
      () => {
        const element = graph.getCell('element-1');
        expect(element?.isElement() && element.hasPort('port-3')).toBe(true);
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        const portRect = container.querySelector('[data-testid="port-rect-port-3"]');
        expect(portRect).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should position ports at bottom when position="bottom" is set', async () => {
    const graph = new dia.Graph({}, { cellNamespace: { ReactElement } });

    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': {
            id: 'element-1',
            width: 200,
            height: 100,
            x: 0,
            y: 0,
          },
        },
      },
    });

    render(
      <Port.Group id="bottom-group" position="bottom">
        <Port.Item id="bottom-port">
          <rect data-testid="bottom-port-rect" width={10} height={10} fill="red" />
        </Port.Item>
      </Port.Group>,
      { wrapper }
    );

    // Wait for port to be created
    await waitFor(() => {
      const element = graph.getCell('element-1');
      expect(element?.isElement() && element.hasPort('bottom-port')).toBe(true);
    });

    // Wait for port to render
    await waitFor(
      () => {
        const portRect = document.querySelector('[data-testid="bottom-port-rect"]');
        expect(portRect).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Check port group position is set correctly
    await waitFor(() => {
      const element = graph.getCell('element-1') as dia.Element;
      const portGroups = element.get('ports')?.groups;
      const position = portGroups?.['bottom-group']?.position;
      // Position can be a string or an object with name property
      const positionName = typeof position === 'string' ? position : position?.name;
      expect(positionName).toBe('bottom');
    });
  });
});
