import { type dia } from '@joint/core';
import type { Link } from '../../types/data-types';
import { defaultLinkStyle, LINK_PRESENTATION_KEYS } from '../../theme/link-theme';
import { PORTAL_LINK_TYPE } from '../../models/portal-link';
import { convertLabel } from './convert-labels';
import { mergeLabelsFromAttributes } from './convert-labels-reverse';
import { buildLinkPresentationAttributes } from './link-attributes';
import { isRecord } from '../../utils/is';
import type { CellAttributes } from '.';
import type { LinkLayout } from '../../types/cell-data';

/**
 * Type guard to check if data is link data.
 * @param data - The data to check.
 * @returns True if the data is a record (link data).
 */
function isLinkData(data: unknown): data is Link {
  return isRecord(data);
}

export function linkToAttributes<LinkData extends object | undefined = undefined>(options: {
  id?: string;
  link: Link<LinkData>;
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
    source,
    target,
    data,
    z,
    layer,
    parent,
    vertices,
    router,
    connector,
    labels,
    labelStyle,
    color = defaultLinkStyle.color,
    width = defaultLinkStyle.width,
    sourceMarker = defaultLinkStyle.sourceMarker,
    targetMarker = defaultLinkStyle.targetMarker,
    className = defaultLinkStyle.className,
    dasharray = defaultLinkStyle.dasharray,
    linecap = defaultLinkStyle.linecap,
    linejoin = defaultLinkStyle.linejoin,
    wrapperWidth = defaultLinkStyle.wrapperWidth,
    wrapperColor = defaultLinkStyle.wrapperColor,
    wrapperClassName = defaultLinkStyle.wrapperClassName,
    attrs,
    type: _type,
    ...rest
  } = link;

  const attributes: CellAttributes = {
    id,
    type,
    source,
    target,
    attrs: buildLinkPresentationAttributes({
      color,
      width,
      sourceMarker,
      targetMarker,
      className,
      dasharray,
      linecap,
      linejoin,
      wrapperWidth,
      wrapperColor,
      wrapperClassName,
    }),
  };

  if (attrs !== undefined) attributes.attrs = { ...attributes.attrs, ...attrs };
  if (z !== undefined) attributes.z = z;
  if (layer !== undefined) attributes.layer = layer;
  if (parent !== undefined) attributes.parent = parent;
  if (vertices !== undefined) attributes.vertices = vertices;
  if (router !== undefined) attributes.router = router;
  if (connector !== undefined) attributes.connector = connector;

  if (labels !== undefined) {
    attributes.labels = Object.entries(labels).map(([labelId, label]) =>
      convertLabel(labelId, label, labelStyle)
    );
  }

  // Collect explicit presentation keys for round-trip
  const presentation: Record<string, unknown> = {};
  for (const key of LINK_PRESENTATION_KEYS) {
    if (link[key] !== undefined) presentation[key] = link[key];
  }
  if (labels !== undefined) presentation.labels = labels;
  if (labelStyle !== undefined) presentation.labelStyle = labelStyle;
  attributes.presentation = presentation;

  // User data goes directly into attributes.data (no nesting)
  attributes.data = { ...rest, ...data };

  return attributes;
}

/**
 * Converts JointJS link attributes back to flat link data.
 * Public utility — purely mechanical (nested → flat), no defaultAttributes filtering.
 * @param attributes
 */
export function attributesToLink<LinkData extends object | undefined = undefined>(
  attributes: dia.Link.Attributes
): Link<LinkData> {

  const { type } = attributes;

  // Non-portal: shallow copy so the container gets a new reference on each call,
  // which allows connected-link re-renders when a neighbor element moves.
  if (type !== PORTAL_LINK_TYPE) {
    return { ...attributes } as Link<LinkData>;
  }

  // PortalLink mapping
  const {
    data: cellData,
    presentation,
    source,
    target,
    z,
    layer,
    parent,
    vertices,
    router,
    connector,
    labels: attributeLabels,
  } = attributes;

  const result: Record<string, unknown> = {
    source,
    target,
  };

  // Note: `attrs` is intentionally omitted — for PortalLinks, attrs are computed
  // from presentation fields (color, width, etc.) and must not be round-tripped,
  // otherwise stale computed attrs would override freshly-computed values.
  if (z !== undefined) result.z = z;
  if (layer !== undefined) result.layer = layer;
  if (parent) result.parent = parent;
  if (Array.isArray(vertices) && vertices.length > 0) {
    result.vertices = vertices;
  }
  if (router !== undefined) result.router = router;
  if (connector !== undefined) result.connector = connector;

  // Presentation fields come from attributes.presentation
  const presentationData = presentation || {};
  const dataLabels = presentationData.labels;
  if (dataLabels && Array.isArray(attributeLabels)) {
    result.labels = mergeLabelsFromAttributes(dataLabels, attributeLabels);
  }

  // Spread presentation keys (color, width, etc.) back to top level
  for (const key of LINK_PRESENTATION_KEYS) {
    if (presentationData[key] !== undefined) result[key] = presentationData[key];
  }
  if (presentationData.labelStyle !== undefined) result.labelStyle = presentationData.labelStyle;

  // Extract user data — remove internal 'layouts' field
  const { layouts, ...userData } = cellData || {};

  return {
    ...result,
    data: userData as LinkData,
    layout: layouts as Record<string, LinkLayout> | undefined,
  } as Link<LinkData>;
}

export type MapAttributesToLink<LinkData extends object | undefined = undefined> =
  typeof attributesToLink<LinkData>;

export type MapLinkToAttributes<LinkData extends object | undefined = undefined> =
  typeof linkToAttributes<LinkData>;

export type MapLinkToAttributesOptions<LinkData extends object | undefined = undefined> =
  Parameters<MapLinkToAttributes<LinkData>>[0];
