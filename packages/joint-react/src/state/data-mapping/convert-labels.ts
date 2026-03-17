import { type dia, util } from '@joint/core';
import type { FlatLinkLabel } from '../../types/link-types';
import { defaultLinkTheme, type LinkTheme } from '../../theme/link-theme';

/**
 * Converts a simplified FlatLinkLabel into a JointJS dia.Link.Label
 * using the PortalLink's defaultLabel selectors (labelText, labelBody).
 * @param id - The unique identifier for the label
 * @param label - The simplified label definition
 * @param theme - The link theme providing label styling defaults
 * @returns The full JointJS label definition
 */
export function convertLabel(id: string, label: FlatLinkLabel, theme: LinkTheme = defaultLinkTheme): dia.Link.Label & { id: string } {
  const {
    text,
    position = theme.labelPosition,
    offset,
    color = theme.labelColor,
    fontSize = theme.labelFontSize,
    fontFamily = theme.labelFontFamily,
    backgroundColor = theme.labelBackgroundColor,
    backgroundPadding = theme.labelBackgroundPadding,
    backgroundStroke = theme.labelBackgroundStroke,
    backgroundStrokeWidth = theme.labelBackgroundStrokeWidth,
    backgroundBorderRadius = theme.labelBackgroundBorderRadius,
    backgroundOpacity,
    className,
    backgroundClassName,
    backgroundShape = 'rect',
  } = label;

  const px = typeof backgroundPadding === 'number' ? backgroundPadding : backgroundPadding.x;
  const py = typeof backgroundPadding === 'number' ? backgroundPadding : backgroundPadding.y;

  const labelTextAttributes: Record<string, unknown> = {
    text,
    fill: color,
    fontSize,
    fontFamily,
    textAnchor: 'middle',
    textVerticalAnchor: 'middle',
    pointerEvents: 'none',
  };
  if (className) {
    labelTextAttributes.class = className;
  }

  const labelBodyAttributes: Record<string, unknown> = {
    fill: backgroundColor,
    stroke: backgroundStroke,
    strokeWidth: backgroundStrokeWidth,
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
  if (backgroundClassName) {
    labelBodyAttributes.class = backgroundClassName;
  }

  const labelPosition: Record<string, unknown> = { distance: position };
  if (offset !== undefined) labelPosition.offset = offset;

  return {
    id,
    markup: [
      { tagName: bodyTagName, selector: 'labelBody' },
      { tagName: 'text', selector: 'labelText' },
    ],
    attrs: {
      labelText: labelTextAttributes,
      labelBody: labelBodyAttributes,
    },
    position: labelPosition,
  };
}
