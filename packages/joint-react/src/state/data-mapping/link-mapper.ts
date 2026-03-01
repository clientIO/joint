import { type dia } from '@joint/core';
import type { GraphLink } from '../../types/link-types';
import { defaultLinkTheme, type LinkTheme } from '../../theme/link-theme';
import { REACT_LINK_TYPE } from '../../models/react-link';
import type {
  LinkToGraphOptions,
  GraphToLinkOptions,
} from '../graph-state-selectors';
import { convertLabel } from './convert-labels';
import { normalizeLinkEnd, buildLinkPresentationAttributes } from './link-attributes';

// ────────────────────────────────────────────────────────────────────────────
// React → JointJS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Maps flat link data to JointJS cell attributes.
 *
 * Properties are grouped by sync direction:
 * - **↔ Two-way** — synced back to React state when the graph changes
 *   (`source`, `target`, `z`, `layer`, `parent`, `vertices`)
 * - **→ One-way** — consumed during forward mapping only
 *   (`labels`, `router`, `connector`)
 * - **→ Presentation** — converted to `attrs.line` / `attrs.wrapper` via theme,
 *   then stored in `cell.data` for round-trip preservation
 *   (`color`, `width`, `sourceMarker`, `targetMarker`, `className`, `pattern`,
 *    `lineCap`, `lineJoin`, `wrapperBuffer`, `wrapperColor`)
 *
 * Any remaining properties are treated as user data and stored in `cell.data`.
 * @param options - The link id, data, and optional theme to convert
 * @returns The JointJS cell JSON attributes
 */
export function defaultMapDataToLinkAttributes<Link extends GraphLink>(
  options: Pick<LinkToGraphOptions<Link>, 'id' | 'data'> & { readonly theme?: LinkTheme }
): dia.Cell.JSON {
  const { id, data, theme = defaultLinkTheme } = options;

  const {
    // ↔ Two-way: synced back from graph → React state
    source,
    target,
    z,
    layer,
    parent,
    vertices,

    // → One-way: consumed here, not synced back
    labels,
    router,
    connector,

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

    // Everything else is user data
    ...userData
  } = data;

  // ── Assemble cell JSON ──────────────────────────────────────────────────

  const attributes: dia.Cell.JSON = {
    id,
    type: REACT_LINK_TYPE,
    // ↔ Two-way properties
    source: normalizeLinkEnd(source),
    target: normalizeLinkEnd(target),
    // → Presentation → attrs
    attrs: buildLinkPresentationAttributes({ color, width, sourceMarker, targetMarker, className, pattern, lineCap, lineJoin, wrapperBuffer, wrapperColor }),
  };

  // ↔ Two-way (optional)
  if (z !== undefined) attributes.z = z;
  if (layer !== undefined) attributes.layer = layer;
  if (parent !== undefined) attributes.parent = parent;
  if (vertices !== undefined) attributes.vertices = vertices;

  // → One-way
  if (Array.isArray(labels)) {
    attributes.labels = labels.map((label) => convertLabel(label, theme));
  }
  if (router !== undefined) attributes.router = router;
  if (connector !== undefined) attributes.connector = connector;

  // Presentation props + user data stored for round-trip (graph → React)
  attributes.data = {
    ...userData,
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
 * One-way properties (`labels`, `router`, `connector`) and internal
 * properties (`type`, `attrs`, `markup`) are not mapped back.
 * @param options - The JointJS cell and optional previous data for shape preservation
 * @returns The flat link data
 */
export function defaultMapLinkAttributesToData<Link extends GraphLink>(
  options: Pick<GraphToLinkOptions<Link>, 'cell' | 'previousData'>
): Link {
  const { cell } = options;
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
  } = cell.attributes;

  const linkData: Record<string, unknown> = {
    source,
    target,
  };

  // ↔ Two-way (optional)
  if (z !== undefined) {
    // @todo if the `z` is the same as the model default, we should not include it in the data
    // to detect it we need to check a default value of the model
    // we can get the class from the cell's type and check the default value of the `z` property
    // const defaults = util.result(graph.layerCollection.cellNamespace[nodeType].prototype, 'defaults', {});
    // We can create utility function to get the default value of the property for the given cell type
    // It would cache the default values for each type to avoid performance issues
    linkData.z = z;
  }
  if (layer !== undefined) {
    // @todo same as `z`
    linkData.layer = layer;
  }
  if (parent) {
    linkData.parent = parent;
  }
  if (Array.isArray(vertices) && vertices.length > 0) {
    linkData.vertices = vertices;
  }

  return {
    ...userData,
    ...linkData,
  } as Link;
}
