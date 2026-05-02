import { util } from '@joint/core';
import { linkLabels } from './link-labels';
import { linkStyle } from './link-style';
import type { dia } from '@joint/core';
import type { LinkStyle } from './link-style';
import type { LinkLabel } from './link-labels';

/**
 * React-side declarative fields the preset adds on top of `dia.Link.Attributes`.
 * Composed orthogonally into both `LinkAttributes` (preset input) and
 * `LinkJSONInit` (record/mapper boundary).
 */
export interface LinkPresetAttributes {
  style?: LinkStyle;
  labelMap?: Record<string, LinkLabel>;
  labelStyle?: Partial<LinkLabel>;
}

/**
 * Loose preset input — no `type` required. `dia.Link.Attributes` plus the
 * React preset extras (`style`, `labelMap`, `labelStyle`).
 */
export interface LinkAttributes extends dia.Link.Attributes, LinkPresetAttributes {}

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
export function linkAttributes(link: LinkAttributes): dia.Link.Attributes {
  if (!util.isObject(link)) {
    throw new TypeError('Invalid link data: expected an object with link properties.');
  }

  const { style, labelMap, labels, ...attributes } = link;

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
