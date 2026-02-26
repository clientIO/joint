import type { attributes } from '@joint/core';
import { type dia } from '@joint/core';
import type { GraphLink } from '../../types/link-types';
import { getTargetOrSource } from '../../utils/cell/get-link-targe-and-source-ids';
import { defaultLinkTheme } from '../../theme/link-theme';
import { resolveMarker } from '../../theme/markers';
import { REACT_LINK_TYPE } from '../../models/react-link';
import type {
  LinkToGraphOptions,
  GraphToLinkOptions,
} from '../graph-state-selectors';
import { pickPreviousKeys } from './pick-previous-keys';
import { convertLabel } from './convert-labels';

/**
 * Maps flat link data to JointJS cell attributes.
 *
 * Extracts theme props (`color`, `width`, `sourceMarker`, `targetMarker`, `pattern`, `className`)
 * with `defaultLinkTheme` fallbacks. Builds `attrs.line`.
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
    color = defaultLinkTheme.color,
    width = defaultLinkTheme.width,
    sourceMarker = defaultLinkTheme.sourceMarker,
    targetMarker = defaultLinkTheme.targetMarker,
    className = defaultLinkTheme.className,
    pattern = defaultLinkTheme.pattern,
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
    type: REACT_LINK_TYPE,
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
        strokeWidth: defaultLinkTheme.wrapperBuffer + width,
        strokeLinejoin: 'round',
      },
    },
    defaultLabel: defaultLabel ?? {
      markup: [
        {
          tagName: 'rect',
          selector: 'labelBody',
          attributes: {
            fill: defaultLinkTheme.labelBackgroundColor,
            stroke: defaultLinkTheme.labelBackgroundStroke,
            strokeWidth: defaultLinkTheme.labelBackgroundStrokeWidth,
            rx: defaultLinkTheme.labelBackgroundBorderRadius,
            ry: defaultLinkTheme.labelBackgroundBorderRadius,
          },
        },
        {
          tagName: 'text',
          selector: 'labelText',
          attributes: {
            fill: defaultLinkTheme.labelColor,
            fontSize: defaultLinkTheme.labelFontSize,
            fontFamily: defaultLinkTheme.labelFontFamily,
            textAnchor: 'middle',
            pointerEvents: 'none',
          },
        },
      ],
      attrs: {
        labelText: {
          textVerticalAnchor: 'middle',
        },
        labelBody: {
          ref: 'labelText',
          x: `calc(x - ${defaultLinkTheme.labelBackgroundPadding.x})`,
          y: `calc(y - ${defaultLinkTheme.labelBackgroundPadding.y})`,
          width: `calc(w + ${defaultLinkTheme.labelBackgroundPadding.x * 2})`,
          height: `calc(h + ${defaultLinkTheme.labelBackgroundPadding.y * 2})`,
        },
      },
      position: {
        distance: defaultLinkTheme.labelPosition,
      },
    },
  };

  if (z !== undefined) attributes.z = z;
  if (layer !== undefined) attributes.layer = layer;
  if (markup !== undefined) attributes.markup = markup;
  if (Array.isArray(labels)) attributes.labels = labels.map(convertLabel);
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
  const { data, ...rest } = cell.attributes;

  const linkData: Record<string, unknown> = {
    ...rest,
    ...(data as Record<string, unknown>),
  };

  if (previousData !== undefined) {
    return pickPreviousKeys(linkData, previousData);
  }

  return linkData as Link;
}
