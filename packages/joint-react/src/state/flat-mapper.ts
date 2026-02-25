import type { attributes } from '@joint/core';
import { type dia } from '@joint/core';
import type { GraphElement, GraphElementPort } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
import { getTargetOrSource } from '../utils/cell/get-link-targe-and-source-ids';
import { REACT_TYPE } from '../models/react-element';
import { DEFAULT_LINK_THEME, resolveMarker } from '../theme/link-theme';
import type {
  ElementToGraphOptions,
  GraphToElementOptions,
  LinkToGraphOptions,
  GraphToLinkOptions,
  MapperPreset,
} from './graph-state-selectors';

/**
 * Converts a simplified GraphElementPort to a full JointJS port definition.
 */
function convertPort(port: GraphElementPort): dia.Element.Port {
  const {
    id,
    cx,
    cy,
    width = 1,
    height = 1,
    color = '#333333',
    shape = 'ellipse',
    className,
    magnet = true,
    label,
    labelPosition = 'outside',
    labelColor = '#333333',
    labelClassName,
  } = port;

  const result: dia.Element.Port = {
    group: 'main',
    size: { width, height },
    position: { args: { x: cx, y: cy }},
  };

  const isEllipse = shape === 'ellipse';

  const portBodyAttributes: Record<string, unknown> = {
    fill: color,
    magnet,
  };

  if (isEllipse) {
    portBodyAttributes.rx = width / 2;
    portBodyAttributes.ry = height / 2;
  } else {
    portBodyAttributes.width = width;
    portBodyAttributes.height = height;
    portBodyAttributes.x = -width / 2;
    portBodyAttributes.y = -height / 2;
  }

  if (className) {
    portBodyAttributes.class = className;
  }

  result.markup = [
    {
      tagName: isEllipse ? 'ellipse' : 'rect',
      selector: 'portBody',
    },
  ];
  result.attrs = { portBody: portBodyAttributes };

  if (label) {
    result.label = {
      position: { name: labelPosition },
      markup: [{ tagName: 'text', selector: 'text', attributes: {
        fill: labelColor,
      }}],
    };
    const labelAttributes: Record<string, unknown> = { text: label };
    if (labelClassName) {
      labelAttributes.class = labelClassName;
    }
    result.attrs.text = labelAttributes;
  }

  if (id !== undefined) {
    result.id = id;
  }

  return result;
}

/**
 * Converts a simplified GraphElementPort array to the full JointJS ports object.
 */
function convertPorts(ports: GraphElementPort[]): {
  groups: Record<string, dia.Element.PortGroup>;
  items: dia.Element.Port[];
} {
  return {
    groups: {
      main: {
        position: { name: 'absolute' },
      },
    },
    items: ports.map(convertPort),
  };
}

/**
 * Applies shape preservation by filtering cellData to only include keys from previous data state.
 * @param cellData - The cell data extracted from the graph
 * @param previousData - The previous element data state used as shape template
 * @returns The filtered element with only properties from the previous data state
 */
function applyShapePreservation<T extends GraphElement | GraphLink>(
  cellData: Record<string, unknown>,
  previousData: T
): T {
  const filtered: Record<string, unknown> = {};
  const previousRecord = previousData as Record<string, unknown>;
  for (const key in previousRecord) {
    if (Object.prototype.hasOwnProperty.call(previousRecord, key)) {
      filtered[key] = key in cellData ? cellData[key] : previousRecord[key];
    }
  }
  return filtered as T;
}

/**
 * Maps flat element data to JointJS cell attributes.
 *
 * Extracts flat `{x, y, width, height}` to nested `{position, size}`.
 * Converts simplified `GraphElementPort[]` to full JointJS port format.
 * Remaining user props go to `cell.data`. Sets `type: REACT_TYPE`.
 */
function mapDataToElementAttributes<Element extends GraphElement>(
  options: ElementToGraphOptions<Element>
): dia.Cell.JSON {
  const { id, data } = options;
  // Extract built-in JointJS element properties
  // Support both flat format (x, y, width, height) and nested format (position, size)
  const { x, y, width, height, angle, z, ports, position, size, parent, layer, ...userData } =
    data as GraphElement & {
      position?: { x: number; y: number };
      size?: { width: number; height: number };
    };
  const { attrs: elementAttributes, markup, ...restUserData } = userData as GraphElement;

  const attributes: dia.Cell.JSON = {
    id,
    type: REACT_TYPE,
  };

  // Position: prefer nested position object, fallback to flat x, y
  const positionX = position?.x ?? x;
  const positionY = position?.y ?? y;
  if (positionX !== undefined && positionY !== undefined) {
    attributes.position = { x: positionX, y: positionY };
  }

  // Size: prefer nested size object, fallback to flat width, height
  const sizeWidth = size?.width ?? width;
  const sizeHeight = size?.height ?? height;
  if (sizeWidth !== undefined && sizeHeight !== undefined) {
    attributes.size = { width: sizeWidth, height: sizeHeight };
  }
  if (parent !== undefined) attributes.parent = parent;
  if (layer !== undefined) attributes.layer = layer;
  if (angle !== undefined) attributes.angle = angle;
  if (z !== undefined) attributes.z = z;
  if (ports !== undefined) {
    attributes.ports = convertPorts(ports);
  }
  if (elementAttributes !== undefined) attributes.attrs = elementAttributes;
  if (markup !== undefined) attributes.markup = markup;

  if (Object.keys(restUserData).length > 0) {
    attributes.data = restUserData;
  }

  return attributes;
}

/**
 * Extracts base cell data from a JointJS Element in flat format.
 * @param cell - The JointJS Element cell
 * @returns The extracted cell data as a record
 */
function extractBaseCellData(cell: dia.Element): Record<string, unknown> {
  const { size, position, data, angle, z, ports, parent, layer } = cell.attributes;

  const cellData: Record<string, unknown> = {};

  if (position) {
    cellData.x = position.x;
    cellData.y = position.y;
  }

  if (size) {
    cellData.width = size.width;
    cellData.height = size.height;
  }

  if (angle !== undefined) cellData.angle = angle;
  if (z !== undefined) cellData.z = z;
  if (ports !== undefined) cellData.ports = ports;
  if (parent !== undefined) cellData.parent = parent;
  if (layer !== undefined) cellData.layer = layer;
  // Spread user data from data property to top level
  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      cellData[key] = value;
    }
  }

  return cellData;
}

/**
 * Maps JointJS element attributes back to flat element data.
 *
 * Extracts `position` to `{x, y}`, `size` to `{width, height}`.
 * Spreads `cell.data` to top level. Shape preservation via `previousData`.
 */
function mapElementAttributesToData<Element extends GraphElement>(
  options: GraphToElementOptions<Element>
): Element {
  const { cell, previousData } = options;
  const cellData = extractBaseCellData(cell);

  if (previousData !== undefined) {
    return applyShapePreservation(cellData, previousData);
  }

  return cellData as Element;
}

/**
 * Maps flat link data to JointJS cell attributes.
 *
 * Extracts theme props (`color`, `width`, `sourceMarker`, `targetMarker`, `pattern`, `className`)
 * with `DEFAULT_LINK_THEME` fallbacks. Builds `attrs.line`.
 * Remaining user + theme data go to `cell.data`.
 */
function mapDataToLinkAttributes<Link extends GraphLink>(
  options: LinkToGraphOptions<Link>
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
 */
function mapLinkAttributesToData<Link extends GraphLink>(
  options: GraphToLinkOptions<Link>
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
    for (const [key, value] of Object.entries(data)) {
      cellData[key] = value;
    }
  }

  // Shape preservation
  if (previousData !== undefined) {
    return applyShapePreservation(cellData, previousData);
  }

  return cellData as Link;
}

/**
 * Flat mapper preset.
 *
 * Uses a flat data format where `position` is `{x, y}` and `size` is `{width, height}`
 * at the top level. Ports use the simplified `GraphElementPort[]` format and are
 * converted to full JointJS port definitions. Links use a theme system with
 * `color`, `width`, `sourceMarker`, `targetMarker`, `pattern`, and `className` props.
 *
 * This is the default mapper used when no mapper is specified.
 */
export const flatMapper: MapperPreset = {
  mapDataToElementAttributes,
  mapDataToLinkAttributes,
  mapElementAttributesToData,
  mapLinkAttributesToData,
};
