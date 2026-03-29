import { type dia, util } from '@joint/core';
import type { LinkRecordLabel } from '../../types/data-types';
import { defaultLabelStyle } from '../../theme/link-theme';

/**
 * Converts a simplified LinkRecordLabel into a JointJS dia.Link.Label
 * using the PortalLink's defaultLabel selectors (labelText, labelBody).
 * @param id - The unique identifier for the label
 * @param rawLabel - The simplified label definition
 * @param labelStyle - Optional style defaults for label properties
 * @returns The full JointJS label definition
 */
export function convertLabel(
  id: string,
  rawLabel: LinkRecordLabel,
  labelStyle?: Partial<LinkRecordLabel>
): dia.Link.Label & { id: string } {
  const label = labelStyle ? { ...labelStyle, ...rawLabel } : rawLabel;
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
    labelBodyAttributes.cx = 'calc(0.5 * w)';
    labelBodyAttributes.cy = 'calc(0.5 * h)';
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
    id,
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
