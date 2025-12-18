import { render, waitFor } from '@testing-library/react';
import { Port } from '..';
import { paperRenderElementWrapper } from '../../../utils/test-wrappers';
import { dia } from '@joint/core';
import { ReactElement } from '../../../models/react-element';

describe('port', () => {
  it('should check if the port is created on the graph instance properly', async () => {
    const graph = new dia.Graph({}, { cellNamespace: { ReactElement } });
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        graph,
        elements: [
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

  it('should check if the group with port is created on the graph instance properly', async () => {
    const graph = new dia.Graph({}, { cellNamespace: { ReactElement } });
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        graph,
        elements: [
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
