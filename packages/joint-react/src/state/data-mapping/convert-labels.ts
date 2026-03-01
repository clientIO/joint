import { type dia } from '@joint/core';
import type { GraphLinkLabel } from '../../types/link-types';
import { defaultLinkTheme, type LinkTheme } from '../../theme/link-theme';

/**
 * Converts a simplified GraphLinkLabel into a JointJS dia.Link.Label
 * using the ReactLink's defaultLabel selectors (labelText, labelBody).
 * @param label - The simplified label definition
 * @param theme - The link theme providing label styling defaults
 * @returns The full JointJS label definition
 */
export function convertLabel(label: GraphLinkLabel, theme: LinkTheme = defaultLinkTheme): dia.Link.Label {
  const {
    text,
    position = theme.labelPosition,
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
    ref: 'labelText',
    fill: backgroundColor,
    stroke: backgroundStroke,
    strokeWidth: backgroundStrokeWidth,
    rx: backgroundBorderRadius,
    ry: backgroundBorderRadius,
    x: `calc(x - ${px})`,
    y: `calc(y - ${py})`,
    width: `calc(w + ${px * 2})`,
    height: `calc(h + ${py * 2})`,
  };
  if (backgroundOpacity !== undefined) {
    labelBodyAttributes.opacity = backgroundOpacity;
  }
  if (backgroundClassName) {
    labelBodyAttributes.class = backgroundClassName;
  }

  return {
    markup: [
      { tagName: 'rect', selector: 'labelBody' },
      { tagName: 'text', selector: 'labelText' },
    ],
    attrs: {
      labelText: labelTextAttributes,
      labelBody: labelBodyAttributes,
    },
    position: { distance: position },
  };
}
