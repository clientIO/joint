import { render, waitFor } from '@testing-library/react';
import { Port } from '..';
import {
  paperRenderElementWrapper,
  simpleRenderElementWrapper,
} from '../../../utils/test-wrappers';
import { dia } from '@joint/core';
import { ReactElement } from '../../../models/react-element';

describe('port', () => {
  it('should render port - check if react element is properly rendered to the dom via portals', async () => {
    render(
      <Port.Item id="port-one" x={0} y={0}>
        <rect id="myRect" width={10} height={10} fill="red" />
      </Port.Item>,
      { wrapper: simpleRenderElementWrapper }
    );

    await waitFor(() => {
      const port = document.querySelector('rect#myRect');
      expect(port).toBeInTheDocument();
      expect(port?.getAttribute('width')).toBe('10');
      expect(port?.getAttribute('height')).toBe('10');
      expect(port?.getAttribute('fill')).toBe('red');
    });
  });
  it('should check if the port is created on the graph instance properly', async () => {
    const graph = new dia.Graph({}, { cellNamespace: { ReactElement } });
    const wrapper = paperRenderElementWrapper({
      graphProps: {
        graph,
        initialElements: [
          {
            id: 'element-1',
          },
        ],
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
  it('should render group with port - check if react element is properly rendered to the dom via portals', async () => {
    render(
      <Port.Group position="bottom" id="group-one" angle={0}>
        <Port.Item id="port-one" x={0} y={0}>
          <rect id="myRect1" width={10} height={10} fill="red" />
        </Port.Item>
        <Port.Item id="port-two" x={0} y={0}>
          <rect id="myRect2" width={10} height={10} fill="red" />
        </Port.Item>
      </Port.Group>,
      { wrapper: simpleRenderElementWrapper }
    );

    await waitFor(() => {
      const port1 = document.querySelector('rect#myRect1');
      const port2 = document.querySelector('rect#myRect2');
      expect(port1).toBeInTheDocument();
      expect(port2).toBeInTheDocument();
      expect(port1?.getAttribute('width')).toBe('10');
      expect(port1?.getAttribute('height')).toBe('10');
      expect(port1?.getAttribute('fill')).toBe('red');
      expect(port2?.getAttribute('width')).toBe('10');
      expect(port2?.getAttribute('height')).toBe('10');
      expect(port2?.getAttribute('fill')).toBe('red');
    });
  });
  it('should check if the group with port is created on the graph instance properly', async () => {
    const graph = new dia.Graph({}, { cellNamespace: { ReactElement } });
    const wrapper = paperRenderElementWrapper({
      graphProps: {
        graph,
        initialElements: [
          {
            id: 'element-1',
          },
        ],
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
});
