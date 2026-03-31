import { type dia } from '@joint/core';
import type { LinkRecord } from '../../types/data-types';
import { defaultLinkStyle } from '../../theme/link-theme';
import { PORTAL_LINK_TYPE } from '../../models/portal-link';
import { convertLabel } from './convert-labels';
import { mergeLabelsFromAttributes } from './convert-labels-reverse';
import { buildLinkPresentationAttributes } from './link-attributes';
import { isRecord } from '../../utils/is';
import type { CellAttributes } from '.';

/**
 * Forward mapper: converts a LinkRecord to JointJS cell attributes.
 *
 * - `labelMap` → converted to native `labels` array, stored on the model for reverse mapping.
 * - `labels` (array) → passed through as-is (native JointJS format).
 * - Both present → throws an error.
 * - `style` → converted to SVG `attrs` via `buildLinkPresentationAttributes`.
 *
 * All fields are stored directly on the model (1:1 mapping, no `presentation` wrapper).
 */
export function linkToAttributes<LinkData extends object = Record<string, unknown>>(options: {
  id?: string;
  link: LinkRecord<LinkData>;
}): CellAttributes {
  const { id, link } = options;
  if (!isRecord(link)) {
    throw new Error('Invalid link data: expected an object with link properties.');
  }

  if (link.labelMap && link.labels) {
    throw new Error('Cannot use both "labelMap" and "labels" on the same link.');
  }

  const {
    data = {},
    style,
    labelMap,
    labelStyle,
    labels,
    type = PORTAL_LINK_TYPE,
    ...linkAttributes
  } = link;

  const attributes: CellAttributes = {
    ...linkAttributes,
    id,
    type,
    data,
  };

  if (style) {
    attributes.attrs = buildLinkPresentationAttributes(style, defaultLinkStyle);
    attributes.style = style;
  }
  if (labelStyle) attributes.labelStyle = labelStyle;
  if (labelMap) {
    if (labels) {
      throw new Error('Cannot use both "labelMap" and "labels" on the same link.');
    }
    attributes.labels = Object.entries(labelMap).map(
      ([labelId, label]) => convertLabel(labelId, label, labelStyle)
    );
    attributes.labelMap = labelMap;
  } else {
    attributes.labels = labels ?? [];
  }

  return attributes;
}

/**
 * Converts JointJS link attributes back to a LinkRecord.
 *
 * - `style` on model → return in record.
 * - `labelMap` on model → return `labelMap` (merge updated positions from native `labels`).
 * - No `labelMap` → return `labels` as-is.
 *
 * 1:1 mapping — no `presentation` wrapper.
 */
export function attributesToLink<LinkData extends object = Record<string, unknown>>(
  attributes: dia.Link.Attributes
): LinkRecord<LinkData> {

  const {
    type,
    // Labels
    labelMap,
    labels,
    // Link style
    style,
    attrs,
    // 1:1 mapping of all other fields directly on the model
    ...linkRecord
  } = attributes;

  // style/attrs dual-format: if `style` is present, `attrs` was generated from it.
  if (style) {
    linkRecord.style = style;
  } else if (attrs) {
    linkRecord.attrs = attrs;
  }

  // labelMap/labels dual-format: if `labelMap` is present, `labels` was generated from it.
  if (labelMap && Array.isArray(labels)) {
    linkRecord.labelMap = mergeLabelsFromAttributes(labelMap, labels);
  } else if (Array.isArray(labels)) {
    linkRecord.labels = labels;
  }

  // Only a custom type should be included in the link record.
  if (type && type !== PORTAL_LINK_TYPE) {
    linkRecord.type = type;
  }

  return { ...linkRecord };
}

export type MapAttributesToLink<LinkData extends object = Record<string, unknown>> =
  typeof attributesToLink<LinkData>;

export type MapLinkToAttributes<LinkData extends object = Record<string, unknown>> =
  typeof linkToAttributes<LinkData>;
