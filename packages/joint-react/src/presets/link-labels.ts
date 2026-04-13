import { type dia, util } from '@joint/core';
import type { LinkLabel } from '../types/data-types';
import { defaultLabelStyle } from '../theme/link-theme';

/**
 * Creates a JointJS link label from simplified options.
 *
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

  const px = typeof backgroundPadding === 'number' ? backgroundPadding : backgroundPadding.x;
  const py = typeof backgroundPadding === 'number' ? backgroundPadding : backgroundPadding.y;

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
    labelBodyAttributes.x = `calc(x - ${px})`;
    labelBodyAttributes.y = `calc(y - ${py})`;
    labelBodyAttributes.width = `calc(w + ${px * 2})`;
    labelBodyAttributes.height = `calc(h + ${py * 2})`;
  } else if (backgroundShape === 'ellipse') {
    bodyTagName = 'ellipse';
    labelBodyAttributes.ref = 'labelText';
    labelBodyAttributes.cx = '0';
    labelBodyAttributes.cy = '0';
    labelBodyAttributes.rx = `calc(0.5 * w + ${px})`;
    labelBodyAttributes.ry = `calc(0.5 * h + ${py})`;
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
        className: `jr-link-label-body ${backgroundClassName}`.trim(),
      },
      {
        tagName: 'text',
        selector: 'labelText',
        className: `jr-link-label-text ${className}`.trim(),
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
 *
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
