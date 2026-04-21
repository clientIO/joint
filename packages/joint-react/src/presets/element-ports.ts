import { type dia } from '@joint/core';
import type { LiteralUnion } from '../types/index';

/**
 * Shape of a port.
 * - `'ellipse'` — ellipse
 * - `'rect'` — rectangle
 * - Any other string — interpreted as SVG path `d` commands
 */
export type PortShape = LiteralUnion<'ellipse' | 'rect'>;

/**
 * Simplified port definition for declarative port configuration.
 * Converted to full JointJS port format by the element mapper.
 * @group Graph
 */
export interface ElementPort {
  /**
   * X position of the port (absolute positioning).
   * Supports calc() expressions (e.g., 'calc(w)').
   * Optional when using group-based positioning.
   */
  cx?: number | string;
  /**
   * Y position of the port (absolute positioning).
   * Supports calc() expressions (e.g., 'calc(h)').
   * Optional when using group-based positioning.
   */
  cy?: number | string;
  /** Width of the port shape. @default 10 */
  width?: number;
  /** Height of the port shape. @default 10 */
  height?: number;
  /** Fill color of the port shape. @default '#333333' */
  color?: string;
  /** Shape of the port. @default 'ellipse' */
  shape?: PortShape;
  /** Outline color of the port shape. Accepts any CSS color. @default 'transparent' */
  outline?: string;
  /** Outline width of the port shape in px. @default 0 */
  outlineWidth?: number;
  /** CSS class name to apply to the port shape. */
  className?: string;
  /** Whether the port is limited to only being a target (not source) for links. @default false */
  passive?: boolean;
  /** Label displayed next to the port. */
  label?: string;
  /** Position of the port label. @default 'outside' */
  labelPosition?: string;
  /** Color of the port label text. @default '#333333' */
  labelColor?: string;
  /** Font size of the port label text. */
  labelFontSize?: number;
  /** Font family of the port label text. */
  labelFontFamily?: string;
  /** CSS class name to apply to the port label. */
  labelClassName?: string;
  /** Horizontal offset of the port label in pixels. */
  labelOffsetX?: number;
  /** Vertical offset of the port label in pixels. */
  labelOffsetY?: number;
}

const defaultPortStyle = {
  width: 10,
  height: 10,
  color: '' as string,
  shape: 'ellipse' as PortShape,
  outline: '' as string,
  outlineWidth: '' as number | string,
  className: '',
  passive: false,
  labelPosition: 'outside',
  labelColor: '' as string,
  labelFontSize: '' as number | string,
  labelFontFamily: '' as string,
  labelClassName: '',
} as const;

/**
 * Creates a JointJS port definition from simplified options.
 *
 * When `cx`/`cy` are provided, the port uses absolute positioning.
 * When omitted, position is left to the port group (e.g. `'left'`, `'right'`).
 * @param port
 * @example
 * ```ts
 * // Absolute positioned
 * elementPort({ cx: 'calc(w)', cy: 'calc(h/2)', color: 'red' })
 *
 * // Group-positioned (no cx/cy)
 * elementPort({ color: 'blue', shape: 'rect', width: 12, height: 12 })
 * ```
 */
export function elementPort(port: ElementPort): dia.Element.Port {
  const {
    cx,
    cy,
    width = defaultPortStyle.width,
    height = defaultPortStyle.height,
    color = defaultPortStyle.color,
    shape = defaultPortStyle.shape,
    outline = defaultPortStyle.outline,
    outlineWidth = defaultPortStyle.outlineWidth,
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
    size: { width, height },
  };

  // Only set position when cx/cy are provided (absolute positioning).
  // Otherwise, position comes from the port group.
  if (cx !== undefined || cy !== undefined) {
    result.position = { args: { x: cx, y: cy } };
  }

  const portBodyAttributes: Record<string, unknown> = {
    style: { fill: color, stroke: outline, strokeWidth: outlineWidth },
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
    // default border radius for rect ports
    portBodyAttributes.rx = 1;
    portBodyAttributes.ry = 1;
  } else {
    bodyTagName = 'path';
    portBodyAttributes.d = shape;
  }

  result.markup = [
    {
      tagName: bodyTagName,
      selector: 'portBody',
      className: `jj-port-body ${className}`.trim(),
    },
  ];
  result.attrs = { portBody: portBodyAttributes };

  if (label) {
    result.label = {
      position: { name: labelPosition, args: { x: labelOffsetX, y: labelOffsetY } },
      markup: [{
        tagName: 'text',
        selector: 'text',
        className: `jj-port-label ${labelClassName}`.trim(),
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

  return result;
}

const PORT_GROUP = 'main';

/**
 * Converts a record of simplified ElementPort definitions to the full JointJS ports object.
 * Each port gets absolute positioning under the `'main'` group.
 * @param ports
 * @param portStyle
 * @example
 * ```ts
 * elementPorts({ out: { cx: 'calc(w)', cy: 'calc(h/2)' } })
 * ```
 */
export function elementPorts(ports: Record<string, ElementPort>, portStyle?: Partial<ElementPort>): {
  groups: Record<string, dia.Element.PortGroup>;
  items: dia.Element.Port[];
} {
  return {
    groups: {
      [PORT_GROUP]: {
        position: { name: 'absolute' },
      },
    },
    items: Object.entries(ports).map(([id, rawPort]) => {
      const port = portStyle ? { ...portStyle, ...rawPort } : rawPort;
      return {
        id,
        group: PORT_GROUP,
        ...elementPort(port),
      };
    }),
  };
}
