import { type dia } from '@joint/core';
import type { GraphLink } from '../../types/link-types';
import { defaultLinkTheme, type LinkTheme } from '../../theme/link-theme';
import { REACT_LINK_TYPE } from '../../models/react-link';
import type {
  LinkToGraphOptions,
  GraphToLinkOptions,
} from '../graph-state-selectors';
import { convertLabel } from './convert-labels';
import { createDefaultLabel } from './link-label-defaults';
import { normalizeLinkEnd, buildLinePresentationAttributes, buildLinkPresentationAttributes } from './link-attributes';

/**
 * Maps flat link data to JointJS cell attributes.
 *
 * Extracts theme props (`color`, `width`, `sourceMarker`, `targetMarker`, `pattern`, `className`)
 * with theme fallbacks. Builds `attrs.line`.
 * Remaining user + theme data go to `cell.data`.
 * @param options - The link id, data, and optional theme to convert
 * @returns The JointJS cell JSON attributes
 */
export function defaultMapDataToLinkAttributes<Link extends GraphLink>(
  options: Pick<LinkToGraphOptions<Link>, 'id' | 'data'> & { readonly theme?: LinkTheme }
): dia.Cell.JSON {
  const { id, data, theme = defaultLinkTheme } = options;
  // Extract built-in JointJS link properties, remaining properties are user data
  const {
    // 2-way link properties
    source,
    target,
    z,
    layer,
    parent,
    vertices,
    // 1-way link properties
    labels,
    router,
    connector,

    // User data
    // Styling properties with theme defaults
    color = theme.color,
    width = theme.width,
    sourceMarker = theme.sourceMarker,
    targetMarker = theme.targetMarker,
    className = theme.className,
    pattern = theme.pattern,
    wrapperBuffer = theme.wrapperBuffer,
    wrapperColor = theme.wrapperColor,
    // Rest of user data
    ...userData

  } = data;

  // Build theme-based attributes
  const lineAttributes = buildLinePresentationAttributes({ color, width, sourceMarker, targetMarker, className, pattern });

  const attributes: dia.Cell.JSON = {
    id,
    type: REACT_LINK_TYPE,
    source: normalizeLinkEnd(source),
    target: normalizeLinkEnd(target),
    attrs: buildLinkPresentationAttributes(lineAttributes, width, wrapperBuffer, wrapperColor),
  };

  // Link attributes
  if (vertices !== undefined) attributes.vertices = vertices;

  // Cell attributes
  if (z !== undefined) attributes.z = z;
  if (layer !== undefined) attributes.layer = layer;
  if (parent !== undefined) attributes.parent = parent;

  if (Array.isArray(labels)) {
    attributes.labels = labels.map(convertLabel);
    attributes.defaultLabel = createDefaultLabel(theme);
  }

  if (router !== undefined) attributes.router = router;
  if (connector !== undefined) attributes.connector = connector;

  // Store theme properties and user data in the data property
  // so they can be retrieved when mapping back from graph to React state
  attributes.data = {
    ...userData,
    color,
    width,
    sourceMarker,
    targetMarker,
    className,
    pattern,
    wrapperBuffer,
    wrapperColor,
  };

  return attributes;
}

/**
 * Maps JointJS link attributes back to flat link data.
 *
 * Extracts source/target, spreads `cell.data` to top level.
 * Shape preservation via `previousData`.
 * @param options - The JointJS cell and optional previous data for shape preservation
 * @returns The flat link data
 */
export function defaultMapLinkAttributesToData<Link extends GraphLink>(
  options: Pick<GraphToLinkOptions<Link>, 'cell' | 'previousData'>
): Link {
  const { cell } = options;
  const {
    data: userData,
    z, parent, layer,
    vertices,
    ...rest
  } = cell.attributes;

  const linkData: Record<string, unknown> = {
    ...rest
  };

  // Cell attributes
  if (z !== undefined) linkData.z = z;
  if (layer !== undefined) linkData.layer = layer;
  if (parent !== undefined) linkData.parent = parent;
  if (vertices !== undefined) linkData.vertices = vertices;

  // @todo: what if user dat contains keys that conflict top-level keys
  // like source/target?
  return {
    ...linkData,
    ...userData,
  } as Link;
}
