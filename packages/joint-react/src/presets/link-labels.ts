import { type dia, util } from '@joint/core';
import type { LiteralUnion } from '../types';

/**
 * Simplified label definition for graph links.
 * @group Graph
 */
export interface LinkLabel {
  /** Label text content. */
  text: string;
  /** Position along the link. 0–1 is a ratio, >1 is absolute distance in px. */
  position?: number;
  /** Offset perpendicular to the link path. A number or `{ x, y }` object. */
  offset?: number | { x: number; y: number };
  /** Text color. */
  color?: string;
  /** Background color of the label rectangle. */
  backgroundColor?: string;
  /**
   * Padding between text and background.
   * A number (applied on both axes) or `{ horizontal, vertical }`.
   * @default { horizontal: 4, vertical: 2 }
   */
  backgroundPadding?: number | { horizontal?: number; vertical?: number };
  /** Font size of the label text. */
  fontSize?: number;
  /** Font family of the label text. */
  fontFamily?: string;
  /** CSS class name applied to the label text element. */
  className?: string;
  /** Outline (stroke) color of the label background. */
  backgroundOutline?: string;
  /** Outline (stroke) width of the label background. */
  backgroundOutlineWidth?: number;
  /** Border radius of the label background. */
  backgroundBorderRadius?: number;
  /** Opacity of the label background (0–1). */
  backgroundOpacity?: number;
  /** CSS class name applied to the label background. */
  backgroundClassName?: string;
  /** Shape of the label background: `'rect'`, `'ellipse'`, or SVG path `d` commands. @default 'rect' */
  backgroundShape?: LiteralUnion<'rect' | 'ellipse'>;
}

const defaultLabelStyle = {
  color: '' as string,
  fontSize: '' as number | string,
  fontFamily: '' as string,
  backgroundColor: '' as string,
  backgroundOutline: '' as string,
  backgroundOutlineWidth: '' as number | string,
  backgroundBorderRadius: 4,
  backgroundPadding: { horizontal: 4, vertical: 2 } as { readonly horizontal: number; readonly vertical: number },
  position: 0.5,
  className: '',
  backgroundClassName: '',
} as const;

/**
 * Creates a JointJS link label from simplified options.
 * @param label
 * @example
 * ```ts
 * linkLabel({ text: 'Hello', color: '#333', position: 0.5 })
 * ```
 */
export function linkLabel(label: LinkLabel): dia.Link.Label {
  const {
    text,
    position = defaultLabelStyle.position,
    offset,
    color = defaultLabelStyle.color,
    fontSize = defaultLabelStyle.fontSize,
    fontFamily = defaultLabelStyle.fontFamily,
    backgroundColor = defaultLabelStyle.backgroundColor,
    backgroundPadding = defaultLabelStyle.backgroundPadding,
    backgroundOutline = defaultLabelStyle.backgroundOutline,
    backgroundOutlineWidth = defaultLabelStyle.backgroundOutlineWidth,
    backgroundBorderRadius = defaultLabelStyle.backgroundBorderRadius,
    backgroundOpacity,
    className = defaultLabelStyle.className,
    backgroundClassName = defaultLabelStyle.backgroundClassName,
    backgroundShape = 'rect',
  } = label;

  const ph = typeof backgroundPadding === 'number' ? backgroundPadding : backgroundPadding.horizontal ?? 0;
  const pv = typeof backgroundPadding === 'number' ? backgroundPadding : backgroundPadding.vertical ?? 0;

  const labelTextAttributes: Record<string, unknown> = {
    text,
    style: { fill: color, fontSize, fontFamily },
    textAnchor: 'middle',
    textVerticalAnchor: 'middle',
    pointerEvents: 'none',
  };

  const labelBodyAttributes: Record<string, unknown> = {
    style: {
      fill: backgroundColor,
      stroke: backgroundOutline,
      strokeWidth: backgroundOutlineWidth,
    },
  };

  let bodyTagName: string;
  if (backgroundShape === 'rect') {
    bodyTagName = 'rect';
    labelBodyAttributes.ref = 'labelText';
    labelBodyAttributes.rx = backgroundBorderRadius;
    labelBodyAttributes.ry = backgroundBorderRadius;
    labelBodyAttributes.x = `calc(x - ${ph})`;
    labelBodyAttributes.y = `calc(y - ${pv})`;
    labelBodyAttributes.width = `calc(w + ${ph * 2})`;
    labelBodyAttributes.height = `calc(h + ${pv * 2})`;
  } else if (backgroundShape === 'ellipse') {
    bodyTagName = 'ellipse';
    labelBodyAttributes.ref = 'labelText';
    labelBodyAttributes.cx = '0';
    labelBodyAttributes.cy = '0';
    labelBodyAttributes.rx = `calc(0.5 * w + ${ph})`;
    labelBodyAttributes.ry = `calc(0.5 * h + ${pv})`;
  } else {
    bodyTagName = 'path';
    labelBodyAttributes.d = backgroundShape;
    if (util.isCalcExpression(backgroundShape)) {
      labelBodyAttributes.ref = 'labelText';
    }
  }

  if (backgroundOpacity !== undefined) {
    labelBodyAttributes.opacity = backgroundOpacity;
  }

  const labelPosition: Record<string, unknown> = { distance: position };
  if (offset !== undefined) labelPosition.offset = offset;

  return {
    markup: [
      {
        tagName: bodyTagName,
        selector: 'labelBody',
        className: `jj-link-label-body ${backgroundClassName}`.trim(),
      },
      {
        tagName: 'text',
        selector: 'labelText',
        className: `jj-link-label-text ${className}`.trim(),
      },
    ],
    attrs: {
      labelText: labelTextAttributes,
      labelBody: labelBodyAttributes,
    },
    position: labelPosition,
  };
}

/**
 * Converts a record of simplified LinkLabel definitions to an array of JointJS labels.
 * @param labels
 * @param labelStyle
 * @example
 * ```ts
 * linkLabels({ main: { text: 'Hello', fontSize: 12 } })
 * ```
 */
export function linkLabels(
  labels: Record<string, LinkLabel>,
  labelStyle?: Partial<LinkLabel>
): Array<dia.Link.Label & { id: string }> {
  return Object.entries(labels).map(([id, rawLabel]) => {
    const label = labelStyle ? { ...labelStyle, ...rawLabel } : rawLabel;
    return {
      id,
      ...linkLabel(label),
    };
  });
}
