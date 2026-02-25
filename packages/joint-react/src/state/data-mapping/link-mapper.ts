import type { attributes } from '@joint/core';
import { type dia } from '@joint/core';
import type { GraphLink } from '../../types/link-types';
import { getTargetOrSource } from '../../utils/cell/get-link-targe-and-source-ids';
import { DEFAULT_LINK_THEME } from '../../theme/link-theme';
import { resolveMarker } from '../../theme/markers';
import type {
  LinkToGraphOptions,
  GraphToLinkOptions,
} from '../graph-state-selectors';
import { pickPreviousKeys } from './pick-previous-keys';

/**
 * Maps flat link data to JointJS cell attributes.
 *
 * Extracts theme props (`color`, `width`, `sourceMarker`, `targetMarker`, `pattern`, `className`)
 * with `DEFAULT_LINK_THEME` fallbacks. Builds `attrs.line`.
 * Remaining user + theme data go to `cell.data`.
 * @param options - The link id and data to convert
 * @returns The JointJS cell JSON attributes
 */
export function defaultMapDataToLinkAttributes<Link extends GraphLink>(
  options: Pick<LinkToGraphOptions<Link>, 'id' | 'data'>
): dia.Cell.JSON {
  const { id, data } = options;
  // Extract built-in JointJS link properties, remaining properties are user data
  const {
    source: linkSource,
    target: linkTarget,
    z,
    layer,
    markup,
    defaultLabel,
    labels,
    vertices,
    router,
    connector,
    // Styling properties with theme defaults
    color = DEFAULT_LINK_THEME.color,
    width = DEFAULT_LINK_THEME.width,
    sourceMarker = DEFAULT_LINK_THEME.sourceMarker,
    targetMarker = DEFAULT_LINK_THEME.targetMarker,
    className = DEFAULT_LINK_THEME.className,
    pattern = DEFAULT_LINK_THEME.pattern,
    ...userData
  } = data;

  // Read styling properties with theme defaults
  const source = getTargetOrSource(linkSource);
  const target = getTargetOrSource(linkTarget);

  // Build theme-based line attributes
  const resolvedLineAttributes: attributes.SVGAttributes = {
    stroke: color,
    strokeWidth: width,
  };
  if (sourceMarker !== 'none') {
    resolvedLineAttributes.sourceMarker = resolveMarker(sourceMarker);
  }

  // Explicitly set to null to override the standard.Link default arrowhead
  resolvedLineAttributes.targetMarker =
    targetMarker === 'none' ? null : resolveMarker(targetMarker);

  if (className) {
    resolvedLineAttributes.class = className;
  }
  if (pattern) {
    resolvedLineAttributes.strokeDasharray = pattern;
  }

  const attributes: dia.Cell.JSON = {
    id,
    type: 'standard.Link',
    source,
    target,
    attrs: {
      line: {
        connection: true,
        strokeLinejoin: 'round',
        ...resolvedLineAttributes,
      },
      wrapper: {
        connection: true,
        strokeWidth: 10,
        strokeLinejoin: 'round',
      },
    },
  };

  if (z !== undefined) attributes.z = z;
  if (layer !== undefined) attributes.layer = layer;
  if (markup !== undefined) attributes.markup = markup;
  if (defaultLabel !== undefined) attributes.defaultLabel = defaultLabel;
  if (labels !== undefined) attributes.labels = labels;
  if (vertices !== undefined) attributes.vertices = vertices;
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
  const { cell, previousData } = options;
  const { data, ...attributes } = cell.attributes;

  const cellData: Record<string, unknown> = {
    ...attributes,
    source: cell.get('source') as dia.Cell.ID,
    target: cell.get('target') as dia.Cell.ID,
    z: cell.get('z'),
    layer: cell.get('layer'),
    markup: cell.get('markup'),
    defaultLabel: cell.get('defaultLabel'),
  };

  // Spread user data from data property to top level
  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      cellData[key] = value;
    }
  }

  // Shape preservation
  if (previousData !== undefined) {
    return pickPreviousKeys(cellData, previousData);
  }

  return cellData as Link;
}
