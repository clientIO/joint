import { type dia } from '@joint/core';
import type { Link } from '../../types/data-types';
import { defaultLinkStyle, LINK_PRESENTATION_KEYS } from '../../theme/link-theme';
import { PORTAL_LINK_TYPE } from '../../models/portal-link';
import { convertLabel } from './convert-labels';
import { mergeLabelsFromAttributes } from './convert-labels-reverse';
import {
  assignEndDataProperties,
  SOURCE_KEYS,
  TARGET_KEYS,
  toLinkEndAttribute,
  toLinkEndData,
  buildLinkPresentationAttributes,
} from './link-attributes';
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
  const {
    source,
    target,
    sourcePort,
    targetPort,
    sourceAnchor,
    targetAnchor,
    sourceConnectionPoint,
    targetConnectionPoint,
    sourceMagnet,
    targetMagnet,
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
    type = PORTAL_LINK_TYPE,
    ...rest
  } = link;

  const attributes: CellAttributes = {
    id,
    type,
    source: source
      ? toLinkEndAttribute(source, {
          port: sourcePort,
          anchor: sourceAnchor,
          connectionPoint: sourceConnectionPoint,
          magnet: sourceMagnet,
        })
      : undefined,
    target: target
      ? toLinkEndAttribute(target, {
          port: targetPort,
          anchor: targetAnchor,
          connectionPoint: targetConnectionPoint,
          magnet: targetMagnet,
        })
      : undefined,
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

  const presentationData: Record<string, unknown> = {};
  for (const key of LINK_PRESENTATION_KEYS) {
    if (link[key] !== undefined) presentationData[key] = link[key];
  }

  attributes.data = {
    ...rest,
    labels,
    labelStyle,
    ...presentationData,
  };

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
  const {
    data: cellData,
    source,
    target,
    z,
    layer,
    parent,
    vertices,
    router,
    connector,
    labels: attributeLabels,
    attrs,
    type,
  } = attributes;

  const sourceData = toLinkEndData(source);
  const targetData = toLinkEndData(target);

  const result: Record<string, unknown> = {
    source: sourceData.end,
    target: targetData.end,
  };

  assignEndDataProperties(result, sourceData, SOURCE_KEYS);
  assignEndDataProperties(result, targetData, TARGET_KEYS);

  if (type !== undefined) result.type = type;
  if (attrs) result.attrs = attrs;
  if (z !== undefined) result.z = z;
  if (layer !== undefined) result.layer = layer;
  if (parent) result.parent = parent;
  if (Array.isArray(vertices) && vertices.length > 0) {
    result.vertices = vertices;
  }
  if (router !== undefined) result.router = router;
  if (connector !== undefined) result.connector = connector;

  const dataLabels = cellData?.labels;
  if (dataLabels && Array.isArray(attributeLabels)) {
    result.labels = mergeLabelsFromAttributes(dataLabels, attributeLabels);
  }

  const { layouts, ...data } = cellData || {}; // Ensure cellData is an object to avoid spreading undefined
  return {
    data: data as LinkData,
    layout: layouts as Record<string, LinkLayout> | undefined,
    ...result,
  } as Link<LinkData>;
}

export type MapAttributesToLink<LinkData extends object | undefined = undefined> =
  typeof attributesToLink<LinkData>;

export type MapLinkToAttributes<LinkData extends object | undefined = undefined> =
  typeof linkToAttributes<LinkData>;

export type MapLinkToAttributesOptions<LinkData extends object | undefined = undefined> =
  Parameters<MapLinkToAttributes<LinkData>>[0];
