import { type dia } from '@joint/core';
import type { FlatElementPort } from '../../types/element-types';
import { defaultPortStyle } from '../../theme/element-theme';

/**
 * Converts a simplified FlatElementPort to a full JointJS port definition.
 * @param id - The port identifier
 * @param rawPort - The simplified port definition
 * @param portStyle - Optional style defaults for port properties
 * @returns The full JointJS port definition
 */
function convertPort(id: string, rawPort: FlatElementPort, portStyle?: Partial<FlatElementPort>): dia.Element.Port {
  const port = portStyle ? { ...portStyle, ...rawPort } : rawPort;
  const {
    cx,
    cy,
    width = defaultPortStyle.width,
    height = defaultPortStyle.height,
    color = defaultPortStyle.color,
    shape = defaultPortStyle.shape,
    stroke = defaultPortStyle.stroke,
    strokeWidth = defaultPortStyle.strokeWidth,
    className = defaultPortStyle.className,
    label,
    labelPosition = defaultPortStyle.labelPosition,
    labelColor = defaultPortStyle.labelColor,
    labelFontSize = defaultPortStyle.labelFontSize,
    labelFontFamily = defaultPortStyle.labelFontFamily,
    labelClassName = defaultPortStyle.labelClassName,
    labelOffsetX,
    labelOffsetY,
    passive = defaultPortStyle.passive,
  } = port;

  const result: dia.Element.Port = {
    group: 'main',
    size: { width, height },
    position: { args: { x: cx, y: cy }},
  };

  const portBodyAttributes: Record<string, unknown> = {
    style: { fill: color, stroke, strokeWidth },
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

  result.markup = [
    {
      tagName: bodyTagName,
      selector: 'portBody',
      className: `joint-port-body ${className}`.trim(),
    },
  ];
  result.attrs = { portBody: portBodyAttributes };

  if (label) {
    result.label = {
      position: { name: labelPosition, args: { x: labelOffsetX, y: labelOffsetY } },
      markup: [{
        tagName: 'text',
        selector: 'text',
        className: `joint-port-label ${labelClassName}`.trim(),
      }],
    };
    const labelAttributes: Record<string, unknown> = {
      text: label,
      style: { fill: labelColor, fontSize: labelFontSize, fontFamily: labelFontFamily },
    };
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
 * @param portStyle - Optional style defaults for port properties
 * @returns The full JointJS ports object with groups and items
 */
export function convertPorts(ports: Record<string, FlatElementPort>, portStyle?: Partial<FlatElementPort>): {
  groups: Record<string, dia.Element.PortGroup>;
  items: dia.Element.Port[];
} {
  return {
    ...createPortDefaults(),
    items: Object.entries(ports).map(([id, port]) => convertPort(id, port, portStyle)),
  };
}
