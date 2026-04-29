import { util } from '@joint/core';
import type { DiaLinkAttributes } from '../types/cell.types';
import { linkLabels } from './link-labels';
import { linkStyle } from './link-style';

/**
 * Converts a `LinkAttributes` record to JointJS cell attributes.
 *
 * - `style` → converted to SVG `attrs` via `linkStyle()`.
 * - `labelMap` → converted to native `labels` array via `linkLabels()`.
 * - `labels` (array) → passed through as-is.
 * - Both `labelMap` and `labels` → throws.
 * @param link - The link record to convert.
 * @returns JointJS-compatible cell attributes.
 */
export function linkAttributes(link: DiaLinkAttributes): DiaLinkAttributes {
  if (!util.isObject(link)) {
    throw new TypeError('Invalid link data: expected an object with link properties.');
  }

  const { data = {}, type, style, labelMap, labels, ...rest } = link;
  const attributes: Record<string, unknown> = {
    ...rest,
    ...(type && { type }),
    data,
  };

  if (style) {
    attributes.attrs = linkStyle(style);
    attributes.style = style;
  }

  if (labelMap) {
    if (labels) {
      throw new Error('Cannot use both "labelMap" and "labels" on the same link.');
    }
    attributes.labels = linkLabels(labelMap, link.labelStyle);
    attributes.labelMap = labelMap;
  } else if (labels) {
    attributes.labels = labels;
  }

  return attributes;
}
