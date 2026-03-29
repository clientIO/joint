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
 * Type guard to check if data is link data.
 * @param data - The data to check.
 * @returns True if the data is a record (link data).
 */
function isLinkData(data: unknown): data is LinkRecord {
  return isRecord(data);
}

/**
 * Forward mapper: converts a LinkRecord to JointJS cell attributes.
 *
 * - `labelMap` → converted to native `labels` array, stored as `labelMap` on the model for reverse mapping.
 * - `labels` (array) → passed through as-is (native JointJS format).
 * - Both present → throws an error.
 * - `style` → converted to SVG `attrs` via `buildLinkPresentationAttributes`.
 */
export function linkToAttributes<LinkData extends object = Record<string, unknown>>(options: {
  id?: string;
  link: LinkRecord<LinkData>;
}): CellAttributes {
  const { id, link } = options;
  if (!isLinkData(link)) {
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
    type = PORTAL_LINK_TYPE,
    ...linkAttributes
  } = link;

  const presentation: Record<string, unknown> = {};
  if (style) presentation.style = style;
  if (labelStyle) presentation.labelStyle = labelStyle;
  if (labelMap) presentation.labelMap = labelMap;

  const attributes: CellAttributes = {
    ...linkAttributes,
    id,
    type,
    data,
    presentation,
    attrs: style
      ? buildLinkPresentationAttributes(style, defaultLinkStyle)
      : linkAttributes.attrs,
    labels: labelMap
      ? Object.entries(labelMap).map(
          ([labelId, label]) => convertLabel(labelId, label, labelStyle)
        )
      : link.labels ?? [],
  };

  return attributes;
}

/**
 * Converts JointJS link attributes back to a LinkRecord.
 *
 * - `labelMap` on model → return `labelMap` (ignore native `labels`).
 * - No `labelMap` → return `labels` as-is.
 * - `style` → return from presentation.
 */
export function attributesToLink<LinkData extends object = Record<string, unknown>>(
  attributes: dia.Link.Attributes
): LinkRecord<LinkData> {

  const {
    data,
    presentation,
    source,
    target,
    z,
    layer,
    parent,
    vertices,
    router,
    connector,
    type,
    labels: attributeLabels,
  } = attributes;

  const linkRecord: LinkRecord<LinkData> = {
    data,
    source,
    target,
    z,
    layer,
    parent,
    vertices,
    router,
    connector,
  };

  // Restore style from presentation
  if (presentation?.style) {
    linkRecord.style = presentation.style;
  }
  if (presentation?.labelStyle) {
    linkRecord.labelStyle = presentation.labelStyle;
  }

  // Restore labelMap from presentation, merging updated positions from native labels
  if (presentation?.labelMap && Array.isArray(attributeLabels)) {
    linkRecord.labelMap = mergeLabelsFromAttributes(presentation.labelMap, attributeLabels);
  } else if (Array.isArray(attributeLabels)) {
    linkRecord.labels = attributeLabels;
  }

  // Only include type if it's not the default portal type.
  if (type && type !== PORTAL_LINK_TYPE) {
    linkRecord.type = type;
  }

  return { ...linkRecord };
}

export type MapAttributesToLink<LinkData extends object = Record<string, unknown>> =
  typeof attributesToLink<LinkData>;

export type MapLinkToAttributes<LinkData extends object = Record<string, unknown>> =
  typeof linkToAttributes<LinkData>;
