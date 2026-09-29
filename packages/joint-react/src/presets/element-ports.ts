import { type dia } from '@joint/core';
import type { LiteralUnion } from '../types/index';

/**
 * Shape of a port's body.
 * - `'ellipse'` renders an ellipse.
 * - `'rect'` renders a rectangle.
 * - Any other string is used directly as the SVG path `d` attribute.
 * @group Types
 */
export type ElementPortShape = LiteralUnion<'ellipse' | 'rect'>;

/**
 * Declarative port description for {@link elementPort} and {@link elementPorts}.
 * Captures the common port styling and label options in a flat shape, which the
 * presets expand into a full `dia.Element.Port`.
 * @group Types
 */
export interface ElementPort {
  /**
   * Horizontal position of the port, relative to the element, for absolute
   * placement. Accepts a number or a `calc()` expression such as `'calc(w)'`.
   * Omit to let the port group position the port instead.
   */
  cx?: number | string;
  /**
   * Vertical position of the port, relative to the element, for absolute
   * placement. Accepts a number or a `calc()` expression such as `'calc(h)'`.
   * Omit to let the port group position the port instead.
   */
  cy?: number | string;
  /** Width of the port shape, in pixels. @default 8 */
  width?: number;
  /** Height of the port shape, in pixels. @default 8 */
  height?: number;
  /** Fill color of the port shape. Any CSS color; when empty the port inherits the `jj-port` stylesheet fill. @default '' */
  color?: string;
  /** Shape of the port body. @default 'ellipse' */
  shape?: ElementPortShape;
  /** Outline (stroke) color of the port shape. Any CSS color; when empty the stroke comes from the stylesheet. @default '' */
  outline?: string;
  /** Outline (stroke) width of the port shape, in pixels. Empty leaves the stroke width unset. @default '' */
  outlineWidth?: number;
  /** Extra CSS class added to the port shape alongside the built-in `jj-port` class. @default '' */
  className?: string;
  /** Restricts the port to being a link target only; links cannot be started from it. @default false */
  passive?: boolean;
  /** Text label rendered next to the port. Omit for an unlabeled port. */
  label?: string;
  /** Placement of the label relative to the port, e.g. `'outside'`, `'inside'`, or a side name. @default 'outside' */
  labelPosition?: string;
  /** Color of the label text. Any CSS color; when empty the color comes from the stylesheet. @default '' */
  labelColor?: string;
  /** Font size of the label text, in pixels. When empty the size comes from the stylesheet. @default '' */
  labelFontSize?: number;
  /** Font family of the label text. When empty the family comes from the stylesheet. @default '' */
  labelFontFamily?: string;
  /** Extra CSS class added to the label alongside the built-in `jj-port-label` class. @default '' */
  labelClassName?: string;
  /** Horizontal offset of the label from its computed position, in pixels. */
  labelOffsetX?: number;
  /** Vertical offset of the label from its computed position, in pixels. */
  labelOffsetY?: number;
}

const defaultPortStyle = {
  width: 8,
  height: 8,
  color: '' as string,
  shape: 'ellipse' as ElementPortShape,
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
 * Builds a full `dia.Element.Port` from a declarative {@link ElementPort}.
 * When `cx`/`cy` are set the port is placed absolutely; when they are omitted the
 * port relies on the positioning of whatever group it is placed in.
 * @param port - The declarative port description to expand.
 * @returns A JointJS port object ready to drop into an element's `ports.items`.
 * @example
 * ```tsx
 * import { elementPort } from '@joint/react';
 *
 * // Absolute placement via calc() expressions, relative to the element size.
 * const outlet = elementPort({ cx: 'calc(w)', cy: 'calc(h/2)', color: 'red' });
 *
 * // No cx/cy: the port group decides where it sits.
 * const inlet = elementPort({ shape: 'rect', width: 12, height: 12 });
 * ```
 * @group Presets
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

  const portAttributes: Record<string, unknown> = {
    style: { fill: color, stroke: outline, strokeWidth: outlineWidth },
    magnet: passive ? 'passive' : 'active',
  };

  let bodyTagName: string;
  if (shape === 'ellipse') {
    bodyTagName = 'ellipse';
    portAttributes.rx = width / 2;
    portAttributes.ry = height / 2;
  } else if (shape === 'rect') {
    bodyTagName = 'rect';
    portAttributes.width = width;
    portAttributes.height = height;
    portAttributes.x = -width / 2;
    portAttributes.y = -height / 2;
    // default border radius for rect ports
    portAttributes.rx = 1;
    portAttributes.ry = 1;
  } else {
    bodyTagName = 'path';
    portAttributes.d = shape;
  }

  result.markup = [
    {
      tagName: bodyTagName,
      selector: 'port',
      className: `jj-port ${className}`.trim(),
    },
  ];
  result.attrs = { port: portAttributes };

  if (label) {
    result.label = {
      position: { name: labelPosition, args: { x: labelOffsetX, y: labelOffsetY } },
      markup: [{
        tagName: 'text',
        selector: 'label',
        className: `jj-port-label ${labelClassName}`.trim(),
      }],
    };
    const labelAttributes: Record<string, unknown> = {
      text: label,
      style: { fill: labelColor, fontSize: labelFontSize, fontFamily: labelFontFamily },
    };
    result.attrs.label = labelAttributes;
  } else {
    result.label = { markup: [] };
  }

  return result;
}

const PORT_GROUP = 'main';

/**
 * Expands a map of declarative {@link ElementPort}s into a full JointJS `ports`
 * object (a `groups` definition plus the `items` array). Every port is placed
 * absolutely under a single `'main'` group, keyed by its map id.
 * @param ports - Map of port id to its {@link ElementPort} description.
 * @param portStyle - Shared defaults merged under each port; per-port values win.
 * @returns The `ports` object to assign to an element's attributes.
 * @example
 * ```tsx
 * import { elementPorts } from '@joint/react';
 *
 * // One output port on the right edge, vertically centered.
 * const ports = elementPorts({ out: { cx: 'calc(w)', cy: 'calc(h/2)' } });
 * ```
 * @group Presets
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
