import { util } from '@joint/core';
import { linkLabels } from './link-labels';
import { linkStyle } from './link-style';
import type { dia } from '@joint/core';
import type { LinkStyle } from './link-style';
import type { LinkLabel} from './link-labels';


export interface LinkJSONInit extends dia.Link.JSONInit {
  style?: LinkStyle;
  labelMap?: Record<string, LinkLabel>;
  labelStyle?: Partial<LinkLabel>;
}

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
export function linkAttributes(link: LinkJSONInit): LinkJSONInit {
  if (!util.isObject(link)) {
    throw new TypeError('Invalid link data: expected an object with link properties.');
  }

  const { type, style, labelMap, labels, ...rest } = link;
  const attributes: LinkJSONInit = {
    ...rest,
    type,
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
