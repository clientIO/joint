import { type dia } from '@joint/core';
import type { FlatElementPort } from '../../types/element-types';
import { defaultElementTheme } from '../../theme/element-theme';

/**
 * Converts a simplified FlatElementPort to a full JointJS port definition.
 * @param id - The port identifier
 * @param port - The simplified port definition
 * @returns The full JointJS port definition
 */
function convertPort(id: string, port: FlatElementPort): dia.Element.Port {
  const {
    cx,
    cy,
    width = defaultElementTheme.portWidth,
    height = defaultElementTheme.portHeight,
    color = defaultElementTheme.portColor,
    shape = defaultElementTheme.portShape,
    stroke = defaultElementTheme.portStroke,
    strokeWidth = defaultElementTheme.portStrokeWidth,
    className,
    label,
    labelPosition = defaultElementTheme.portLabelPosition,
    labelColor = defaultElementTheme.portLabelColor,
    labelFontSize,
    labelFontFamily,
    labelClassName,
    labelOffsetX,
    labelOffsetY,
    passive = defaultElementTheme.portPassive,
  } = port;

  const result: dia.Element.Port = {
    group: 'main',
    size: { width, height },
    position: { args: { x: cx, y: cy }},
  };

  const portBodyAttributes: Record<string, unknown> = {
    fill: color,
    stroke,
    strokeWidth,
    magnet: passive ? 'passive' : 'active',
  };

  let bodyTagName: string;
  if (shape === 'ellipse') {
    bodyTagName = 'ellipse';
    portBodyAttributes.rx = width / 2;
    portBodyAttributes.ry = height / 2;
  } else if (shape === 'rect') {
    bodyTagName = 'rect';
    portBodyAttributes.width = width;
    portBodyAttributes.height = height;
    portBodyAttributes.x = -width / 2;
    portBodyAttributes.y = -height / 2;
  } else {
    bodyTagName = 'path';
    portBodyAttributes.d = shape;
  }

  if (className) {
    portBodyAttributes.class = className;
  }

  result.markup = [
    {
      tagName: bodyTagName,
      selector: 'portBody',
    },
  ];
  result.attrs = { portBody: portBodyAttributes };

  if (label) {
    result.label = {
      position: { name: labelPosition, args: { x: labelOffsetX, y: labelOffsetY } },
      markup: [{ tagName: 'text', selector: 'text', attributes: {
        fill: labelColor,
      }}],
    };
    const labelAttributes: Record<string, unknown> = { text: label };
    if (labelFontSize !== undefined) {
      labelAttributes.fontSize = labelFontSize;
    }
    if (labelFontFamily !== undefined) {
      labelAttributes.fontFamily = labelFontFamily;
    }
    if (labelClassName) {
      labelAttributes.class = labelClassName;
    }
    result.attrs.text = labelAttributes;
  } else {
    result.label = { markup: [] };
  }

  result.id = id;

  return result;
}

/**
 * Creates the default port group configuration.
 *
 * Used as `portDefaults` on elements that have ports.
 * @returns The port defaults object with the `main` group
 */
export function createPortDefaults(): { groups: Record<string, dia.Element.PortGroup> } {
  return {
    groups: {
      main: {
        position: { name: 'absolute' },
      },
    },
  };
}

/**
 * Converts a simplified FlatElementPort record to the full JointJS ports object.
 * @param ports - Record of simplified port definitions keyed by port ID
 * @returns The full JointJS ports object with groups and items
 */
export function convertPorts(ports: Record<string, FlatElementPort>): {
  groups: Record<string, dia.Element.PortGroup>;
  items: dia.Element.Port[];
} {
  return {
    ...createPortDefaults(),
    items: Object.entries(ports).map(([id, port]) => convertPort(id, port)),
  };
}
