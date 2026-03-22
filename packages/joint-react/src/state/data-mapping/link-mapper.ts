
import { type dia, util } from '@joint/core';
import type { FlatLinkData, FlatLinkLabel } from '../../types/data-types';
import { defaultLinkStyle, LINK_PRESENTATION_KEYS } from '../../theme/link-theme';
import { PORTAL_LINK_TYPE } from '../../models/portal-link';
import { convertLabel } from './convert-labels';
import { mergeLabelsFromAttributes } from './convert-labels-reverse';

export interface ToLinkAttributesOptions<LinkData = FlatLinkData> {
  readonly id: string;
  readonly data: LinkData;
  readonly graph: dia.Graph;
}

export interface ToLinkDataOptions<LinkData = FlatLinkData> {
  readonly id: string;
  readonly attributes: dia.Link.Attributes;
  readonly defaultAttributes: dia.Link.Attributes;
  readonly link: dia.Link;
  readonly previousData?: LinkData;
  readonly graph: dia.Graph;
}
import {
  assignEndDataProperties,
  SOURCE_KEYS,
  TARGET_KEYS,
  toLinkEndAttribute,
  toLinkEndData,
  buildLinkPresentationAttributes,
} from './link-attributes';
import { isRecord } from '../../utils/is';
import type { CellAttributes } from './index';

// ────────────────────────────────────────────────────────────────────────────
// React → JointJS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Type guard to check if data is link data.
 * @param data - The data to check.
 * @returns True if the data is a record (link data).
 */
function isLinkData(data: unknown): data is FlatLinkData {
  return isRecord(data);
}
/**
 * Maps flat link data to JointJS cell attributes.
 *
 * Properties are grouped by sync direction:
 * - **↔ Two-way** — synced back to React state when the graph changes
 *   (`source`, `target`, `z`, `layer`, `parent`, `vertices`, `router`, `connector`, `labels`)
 * - **→ Presentation** — converted to `attrs.line` / `attrs.wrapper`,
 *   then stored in `cell.data` for round-trip preservation
 *   (`color`, `width`, `sourceMarker`, `targetMarker`, `className`, `dasharray`,
 *    `linecap`, `linejoin`, `wrapperWidth`, `wrapperColor`, `wrapperClassName`)
 *
 * Any remaining properties are treated as user data and stored in `cell.data`.
 * @param options - The link id and data to convert
 * @returns The JointJS cell JSON attributes
 */
export function flatMapDataToLinkAttributes<Link = FlatLinkData>(
  options: Pick<ToLinkAttributesOptions<Link>, 'id' | 'data'>
): CellAttributes {
  const { id, data } = options;
  if (!isLinkData(data)) {
    throw new Error('Invalid link data: expected an object with link properties.');
  }
  const {
    // ↔ Two-way: synced back from graph → React state
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

    // ↔ Two-way: position/offset synced back from graph → React state
    labels,

    // → One-way: consumed here, not synced back
    labelStyle,

    // → Presentation: stored in cell.data for round-trip
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

    // Everything else is user data
    ...userData
  } = data;

  // ── Assemble cell JSON ──────────────────────────────────────────────────

  const attributes: CellAttributes = {
    id,
    type: PORTAL_LINK_TYPE,
    // ↔ Two-way properties
    source: toLinkEndAttribute(source, {
      port: sourcePort,
      anchor: sourceAnchor,
      connectionPoint: sourceConnectionPoint,
      magnet: sourceMagnet,
    }),
    target: toLinkEndAttribute(target, {
      port: targetPort,
      anchor: targetAnchor,
      connectionPoint: targetConnectionPoint,
      magnet: targetMagnet,
    }),
    // → Presentation → attrs
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

  // ↔ Two-way (optional)
  if (z !== undefined) attributes.z = z;
  if (layer !== undefined) attributes.layer = layer;
  if (parent !== undefined) attributes.parent = parent;
  if (vertices !== undefined) attributes.vertices = vertices;
  if (router !== undefined) attributes.router = router;
  if (connector !== undefined) attributes.connector = connector;

  // ↔ Two-way (labels)
  if (labels !== undefined) {
    attributes.labels = Object.entries(labels).map(([labelId, label]) =>
      convertLabel(labelId, label, labelStyle)
    );
  }

  // Only persist presentation props that were explicitly provided (not defaulted)
  const presentationData: Record<string, unknown> = {};
  for (const key of LINK_PRESENTATION_KEYS) {
    if (data[key] !== undefined) presentationData[key] = data[key];
  }

  attributes.data = {
    ...userData,
    labels,
    labelStyle,
    ...presentationData,
  };

  return attributes;
}

// ────────────────────────────────────────────────────────────────────────────
// JointJS → React
// ────────────────────────────────────────────────────────────────────────────

/**
 * Maps JointJS link attributes back to flat link data.
 *
 * Picks the two-way properties (`source`, `target`, `z`, `layer`, `parent`,
 * `vertices`, `labels`) from `cell.attributes` and merges them with `cell.data`
 * (which holds presentation props + user data saved during forward mapping).
 *
 * For labels, position and offset from `attributes.labels` (which may be
 * updated by interactive `labelMove`) are merged with the styling data
 * stored in `cell.data.labels`.
 *
 * Internal properties (`type`, `attrs`, `markup`) are not mapped back.
 * @param options - The JointJS cell and optional previous data for shape preservation
 * @returns The flat link data
 */
export function flatMapLinkAttributesToData<Link = FlatLinkData>(
  options: Pick<ToLinkDataOptions<Link>, 'attributes' | 'defaultAttributes'>
): Link {
  const { attributes, defaultAttributes } = options;
  const {
    // User data + presentation props (saved during forward mapping)
    data: userData,
    // ↔ Two-way
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

  const sourceData = toLinkEndData(source);
  const targetData = toLinkEndData(target);

  const linkData: Record<string, unknown> = {
    source: sourceData.end,
    target: targetData.end,
  };

  // ↔ Two-way (endpoint details — only when present)
  assignEndDataProperties(linkData, sourceData, SOURCE_KEYS);
  assignEndDataProperties(linkData, targetData, TARGET_KEYS);

  // ↔ Two-way (skip when matching model defaults)
  if (z !== undefined && z !== defaultAttributes.z) linkData.z = z;
  if (layer !== undefined && layer !== defaultAttributes.layer) linkData.layer = layer;
  if (parent) {
    linkData.parent = parent;
  }
  if (Array.isArray(vertices) && vertices.length > 0) {
    linkData.vertices = vertices;
  }
  if (router !== undefined && !util.isEqual(router, defaultAttributes.router))
    linkData.router = router;
  if (connector !== undefined && !util.isEqual(connector, defaultAttributes.connector))
    linkData.connector = connector;

  // ↔ Two-way (labels): merge position/offset from attributes back into data
  const dataLabels = userData?.labels as Record<string, FlatLinkLabel> | undefined;
  if (dataLabels && Array.isArray(attributeLabels)) {
    linkData.labels = mergeLabelsFromAttributes(dataLabels, attributeLabels);
  }

  return {
    ...userData,
    ...linkData,
  } as Link;
}

// ────────────────────────────────────────────────────────────────────────────
// Public composable utilities
// ────────────────────────────────────────────────────────────────────────────

/**
 * Converts flat link data to JointJS cell attributes.
 * Public utility — caller provides the `id` separately.
 */
export function flatLinkDataToAttributes(data: FlatLinkData): CellAttributes {
  if (!isLinkData(data)) {
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
    ...userData
  } = data;

  const attributes: Record<string, unknown> = {
    type: PORTAL_LINK_TYPE,
    source: toLinkEndAttribute(source, {
      port: sourcePort,
      anchor: sourceAnchor,
      connectionPoint: sourceConnectionPoint,
      magnet: sourceMagnet,
    }),
    target: toLinkEndAttribute(target, {
      port: targetPort,
      anchor: targetAnchor,
      connectionPoint: targetConnectionPoint,
      magnet: targetMagnet,
    }),
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
    if (data[key] !== undefined) presentationData[key] = data[key];
  }

  attributes.data = {
    ...userData,
    labels,
    labelStyle,
    ...presentationData,
  };

  return attributes as CellAttributes;
}

/**
 * Converts JointJS link attributes back to flat link data.
 * Public utility — purely mechanical (nested → flat), no defaultAttributes filtering.
 */
export function flatAttributesToLinkData<Link = FlatLinkData>(
  attributes: dia.Link.Attributes
): Link {
  const {
    data: userData,
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

  const sourceData = toLinkEndData(source);
  const targetData = toLinkEndData(target);

  const linkData: Record<string, unknown> = {
    source: sourceData.end,
    target: targetData.end,
  };

  assignEndDataProperties(linkData, sourceData, SOURCE_KEYS);
  assignEndDataProperties(linkData, targetData, TARGET_KEYS);

  if (z !== undefined) linkData.z = z;
  if (layer !== undefined) linkData.layer = layer;
  if (parent) linkData.parent = parent;
  if (Array.isArray(vertices) && vertices.length > 0) {
    linkData.vertices = vertices;
  }
  if (router !== undefined) linkData.router = router;
  if (connector !== undefined) linkData.connector = connector;

  const dataLabels = userData?.labels as Record<string, FlatLinkLabel> | undefined;
  if (dataLabels && Array.isArray(attributeLabels)) {
    linkData.labels = mergeLabelsFromAttributes(dataLabels, attributeLabels);
  }

  return {
    ...userData,
    ...linkData,
  } as Link;
}
