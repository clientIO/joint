import { type dia, util } from '@joint/core';
import type { FlatLinkData } from '../../types/link-types';
import { defaultLinkTheme, type LinkTheme } from '../../theme/link-theme';
import { REACT_LINK_TYPE } from '../../models/react-link';
import type { LinkToGraphOptions, GraphToLinkOptions } from '../graph-state-selectors';
import { convertLabel } from './convert-labels';
import {
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
 *   (`source`, `target`, `z`, `layer`, `parent`, `vertices`, `router`, `connector`)
 * - **→ One-way** — consumed during forward mapping only
 *   (`labels`)
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

    // → One-way: consumed here, not synced back
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

  // → One-way
  if (Array.isArray(labels)) {
    attributes.labels = labels.map((label) => convertLabel(label, theme));
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
 * `vertices`) from `cell.attributes` and merges them with `cell.data`
 * (which holds presentation props + user data saved during forward mapping).
 *
 * One-way properties (`labels`) and internal properties (`type`, `attrs`,
 * `markup`) are not mapped back.
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
  } = attributes;

  const sourceData = toLinkEndData(source);
  const targetData = toLinkEndData(target);

  const linkData: Record<string, unknown> = {
    source: sourceData.end,
    target: targetData.end,
  };

  // ↔ Two-way (endpoint details — only when present)
  if (sourceData.port) linkData.sourcePort = sourceData.port;
  if (sourceData.anchor) linkData.sourceAnchor = sourceData.anchor;
  if (sourceData.connectionPoint) linkData.sourceConnectionPoint = sourceData.connectionPoint;
  if (sourceData.magnet) linkData.sourceMagnet = sourceData.magnet;
  if (targetData.port) linkData.targetPort = targetData.port;
  if (targetData.anchor) linkData.targetAnchor = targetData.anchor;
  if (targetData.connectionPoint) linkData.targetConnectionPoint = targetData.connectionPoint;
  if (targetData.magnet) linkData.targetMagnet = targetData.magnet;

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

  return {
    ...userData,
    ...linkData,
  } as Link;
}
