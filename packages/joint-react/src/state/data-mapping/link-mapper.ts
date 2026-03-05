import { type dia, util } from '@joint/core';
import type { FlatLinkData, FlatLinkLabel } from '../../types/link-types';
import { defaultLinkTheme, type LinkTheme } from '../../theme/link-theme';
import { REACT_LINK_TYPE } from '../../models/react-link';
import type { LinkToGraphOptions, GraphToLinkOptions } from '../graph-state-selectors';
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


// ────────────────────────────────────────────────────────────────────────────
// React → JointJS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Maps flat link data to JointJS cell attributes.
 *
 * Properties are grouped by sync direction:
 * - **↔ Two-way** — synced back to React state when the graph changes
 *   (`source`, `target`, `z`, `layer`, `parent`, `vertices`, `router`, `connector`, `labels`)
 * - **→ Presentation** — converted to `attrs.line` / `attrs.wrapper` via theme,
 *   then stored in `cell.data` for round-trip preservation
 *   (`color`, `width`, `sourceMarker`, `targetMarker`, `className`, `pattern`,
 *    `lineCap`, `lineJoin`, `wrapperBuffer`, `wrapperColor`, `wrapperClassName`)
 *
 * Any remaining properties are treated as user data and stored in `cell.data`.
 * @param options - The link id, data, and optional theme to convert
 * @returns The JointJS cell JSON attributes
 */
export function defaultMapDataToLinkAttributes<Link extends FlatLinkData>(
  options: Pick<LinkToGraphOptions<Link>, 'id' | 'data'> & { readonly theme?: LinkTheme }
): dia.Cell.JSON {
  const { id, data, theme = defaultLinkTheme } = options;
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

    // → Presentation: theme-driven, stored in cell.data for round-trip
    color = theme.color,
    width = theme.width,
    sourceMarker = theme.sourceMarker,
    targetMarker = theme.targetMarker,
    className = theme.className,
    pattern = theme.pattern,
    lineCap = theme.lineCap,
    lineJoin = theme.lineJoin,
    wrapperBuffer = theme.wrapperBuffer,
    wrapperColor = theme.wrapperColor,
    wrapperClassName = theme.wrapperClassName,

    // Everything else is user data
    ...userData
  } = data;

  // ── Assemble cell JSON ──────────────────────────────────────────────────

  const attributes: dia.Cell.JSON = {
    id,
    type: REACT_LINK_TYPE,
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
      pattern,
      lineCap,
      lineJoin,
      wrapperBuffer,
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
    attributes.labels = Object.entries(labels).map(([labelId, label]) => convertLabel(labelId, label, theme));
  }

  // Presentation props + one-way props + user data stored for round-trip (graph → React)
  attributes.data = {
    ...userData,
    labels,
    color,
    width,
    sourceMarker,
    targetMarker,
    className,
    pattern,
    lineCap,
    lineJoin,
    wrapperBuffer,
    wrapperColor,
    wrapperClassName,
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
export function defaultMapLinkAttributesToData<Link extends FlatLinkData>(
  options: Pick<GraphToLinkOptions<Link>, 'attributes' | 'defaultAttributes'>
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
  if (router !== undefined && !util.isEqual(router, defaultAttributes.router)) linkData.router = router;
  if (connector !== undefined && !util.isEqual(connector, defaultAttributes.connector)) linkData.connector = connector;

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
