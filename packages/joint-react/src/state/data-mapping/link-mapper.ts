import { type dia } from '@joint/core';
import type { MixedLinkRecord } from '../../types/data-types';
import { defaultLinkStyle, LINK_PRESENTATION_KEYS } from '../../theme/link-theme';
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
function isLinkData(data: unknown): data is MixedLinkRecord {
  return isRecord(data);
}

/**
 * Forward mapper: converts a Link record to JointJS cell attributes.
 * @param options
 * @param options.id
 * @param options.link
 * @returns Cell attributes for the given link, with user data wrapped in `data` field for PortalLink.
 */
export function linkToAttributes<LinkData extends object = Record<string, unknown>>(options: {
  id?: string;
  link: MixedLinkRecord<LinkData>;
}): CellAttributes {
  const { id, link } = options;
  if (!isLinkData(link)) {
    throw new Error('Invalid link data: expected an object with link properties.');
  }

  const { type = PORTAL_LINK_TYPE } = link;

  // Non-portal: 1:1 JointJS pass-through (same as elementToAttributes)
  if (type !== PORTAL_LINK_TYPE) {
    return link as CellAttributes;
  }

  // PortalLink mapping
  const {
    data = {},
    // Presentation fields (color, width, etc.)
    labels,
    labelStyle,
    ...linkAttributes
  } = link;

  // Build presentation object from individual fields.
  const presentation: Record<string, unknown> = {};
  if (labelStyle) presentation.labelStyle = labelStyle;
  if (labels) presentation.labels = labels;
  for (const key of LINK_PRESENTATION_KEYS) {
    if (link[key] !== undefined) presentation[key] = link[key];
  }

  const attributes: CellAttributes = {
    ...linkAttributes,
    id,
    type,
    data,
    presentation,
    attrs: buildLinkPresentationAttributes(presentation, defaultLinkStyle),
    labels: labels
      ? Object.entries(labels).map(
          ([labelId, label]) => convertLabel(labelId, label, labelStyle)
        )
      : []
  };

  return attributes;
}

/**
 * Converts JointJS link attributes back to flat link data.
 * Public utility — purely mechanical (nested → flat), no defaultAttributes filtering.
 * @param attributes
 * @returns Link data record with presentation fields (color, width, etc.) spread to top level and user data wrapped in `data` field for PortalLink.
 */
export function attributesToLink<LinkData extends object = Record<string, unknown>>(
  attributes: dia.Link.Attributes
): MixedLinkRecord<LinkData> {

  const { type } = attributes;

  // Non-portal: shallow copy so the container gets a new reference on each call,
  // which allows connected-link re-renders when a neighbor element moves.
  if (type !== PORTAL_LINK_TYPE) {
    return { ...attributes } as MixedLinkRecord<LinkData>;
  }

  // PortalLink mapping
  const {
    data,
    presentation,
    // Supported JointJS link attributes that we want to include
    source,
    target,
    z,
    layer,
    parent,
    vertices,
    router,
    connector,
    // The JointJS labels are used only to get the updated label positions.
    labels: attributeLabels,
  } = attributes;

  const linkRecord: MixedLinkRecord<LinkData> = {
    ...presentation,
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

  // Presentation fields come from attributes.presentation
  if (presentation?.labels && Array.isArray(attributeLabels)) {
    linkRecord.labels = mergeLabelsFromAttributes(presentation.labels, attributeLabels);
  }

  // Filter out undefined values.
  return { ...linkRecord };
}

export type MapAttributesToLink<LinkData extends object = Record<string, unknown>> =
  typeof attributesToLink<LinkData>;

export type MapLinkToAttributes<LinkData extends object = Record<string, unknown>> =
  typeof linkToAttributes<LinkData>;
