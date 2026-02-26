import { type dia } from '@joint/core';
import type { GraphLinkLabel } from '../../types/link-types';

/**
 * Converts a simplified GraphLinkLabel into a JointJS dia.Link.Label
 * using the ReactLink's defaultLabel selectors (labelText, labelBody).
 * @param label - The simplified label definition
 * @returns The full JointJS label definition
 */
export function convertLabel(label: GraphLinkLabel): dia.Link.Label {
  const {
    text,
    position,
    color,
    backgroundColor,
    backgroundPadding,
    className,
    backgroundClassName,
  } = label;

  const labelTextAttributes: Record<string, unknown> = {
    text,
  };
  if (color) {
    labelTextAttributes.fill = color;
  }
  if (className) {
    labelTextAttributes.class = className;
  }

  const labelBodyAttributes: Record<string, unknown> = {};
  if (backgroundColor) {
    labelBodyAttributes.fill = backgroundColor;
  }
  if (backgroundClassName) {
    labelBodyAttributes.class = backgroundClassName;
  }
  if (backgroundPadding !== undefined) {
    const px = typeof backgroundPadding === 'number' ? backgroundPadding : backgroundPadding.x;
    const py = typeof backgroundPadding === 'number' ? backgroundPadding : backgroundPadding.y;
    labelBodyAttributes.x = `calc(x - ${px})`;
    labelBodyAttributes.y = `calc(y - ${py})`;
    labelBodyAttributes.width = `calc(w + ${px * 2})`;
    labelBodyAttributes.height = `calc(h + ${py * 2})`;
  }

  const result: dia.Link.Label = {
    attrs: {
      labelText: labelTextAttributes,
      labelBody: labelBodyAttributes,
    },
  };

  if (position !== undefined) {
    result.position = { distance: position };
  }

  return result;
}
