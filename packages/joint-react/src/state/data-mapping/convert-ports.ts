import { type dia } from '@joint/core';
import type { GraphElementPort } from '../../types/element-types';
import { DEFAULT_ELEMENT_THEME } from '../../theme/element-theme';

/**
 * Converts a simplified GraphElementPort to a full JointJS port definition.
 * @param port - The simplified port definition
 * @returns The full JointJS port definition
 */
function convertPort(port: GraphElementPort): dia.Element.Port {
  const {
    id,
    cx,
    cy,
    width = DEFAULT_ELEMENT_THEME.portWidth,
    height = DEFAULT_ELEMENT_THEME.portHeight,
    color = DEFAULT_ELEMENT_THEME.portColor,
    shape = DEFAULT_ELEMENT_THEME.portShape,
    className,
    magnet = DEFAULT_ELEMENT_THEME.portMagnet,
    label,
    labelPosition = DEFAULT_ELEMENT_THEME.portLabelPosition,
    labelColor = DEFAULT_ELEMENT_THEME.portLabelColor,
    labelClassName,
  } = port;

  const result: dia.Element.Port = {
    group: 'main',
    size: { width, height },
    position: { args: { x: cx, y: cy }},
  };

  const isEllipse = shape === 'ellipse';

  const portBodyAttributes: Record<string, unknown> = {
    fill: color,
    magnet,
  };

  if (isEllipse) {
    portBodyAttributes.rx = width / 2;
    portBodyAttributes.ry = height / 2;
  } else {
    portBodyAttributes.width = width;
    portBodyAttributes.height = height;
    portBodyAttributes.x = -width / 2;
    portBodyAttributes.y = -height / 2;
  }

  if (className) {
    portBodyAttributes.class = className;
  }

  result.markup = [
    {
      tagName: isEllipse ? 'ellipse' : 'rect',
      selector: 'portBody',
    },
  ];
  result.attrs = { portBody: portBodyAttributes };

  if (label) {
    result.label = {
      position: { name: labelPosition },
      markup: [{ tagName: 'text', selector: 'text', attributes: {
        fill: labelColor,
      }}],
    };
    const labelAttributes: Record<string, unknown> = { text: label };
    if (labelClassName) {
      labelAttributes.class = labelClassName;
    }
    result.attrs.text = labelAttributes;
  }

  if (id !== undefined) {
    result.id = id;
  }

  return result;
}

/**
 * Converts a simplified GraphElementPort array to the full JointJS ports object.
 * @param ports - The array of simplified port definitions
 * @returns The full JointJS ports object with groups and items
 */
export function convertPorts(ports: GraphElementPort[]): {
  groups: Record<string, dia.Element.PortGroup>;
  items: dia.Element.Port[];
} {
  return {
    groups: {
      main: {
        position: { name: 'absolute' },
      },
    },
    items: ports.map(convertPort),
  };
}
