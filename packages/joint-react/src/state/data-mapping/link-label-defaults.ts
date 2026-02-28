import { type dia } from '@joint/core';
import type { LinkTheme } from '../../theme/link-theme';

/**
 * Creates the default label configuration for links.
 *
 * Builds markup, attrs, and position from the provided theme constants.
 * Used as `defaultLabel` on links that have labels.
 * @param theme - The link theme to use for label styling
 * @returns The full JointJS default label definition
 */
export function createDefaultLabel(theme: LinkTheme): dia.Link.Label {
  return {
    markup: [
      {
        tagName: 'rect',
        selector: 'labelBody',
        attributes: {
          fill: theme.labelBackgroundColor,
          stroke: theme.labelBackgroundStroke,
          strokeWidth: theme.labelBackgroundStrokeWidth,
          rx: theme.labelBackgroundBorderRadius,
          ry: theme.labelBackgroundBorderRadius,
        },
      },
      {
        tagName: 'text',
        selector: 'labelText',
        attributes: {
          fill: theme.labelColor,
          fontSize: theme.labelFontSize,
          fontFamily: theme.labelFontFamily,
          textAnchor: 'middle',
          pointerEvents: 'none',
        },
      },
    ],
    attrs: {
      labelText: {
        textVerticalAnchor: 'middle',
      },
      labelBody: {
        ref: 'labelText',
        x: `calc(x - ${theme.labelBackgroundPadding.x})`,
        y: `calc(y - ${theme.labelBackgroundPadding.y})`,
        width: `calc(w + ${theme.labelBackgroundPadding.x * 2})`,
        height: `calc(h + ${theme.labelBackgroundPadding.y * 2})`,
      },
    },
    position: {
      distance: theme.labelPosition,
    },
  };
}
