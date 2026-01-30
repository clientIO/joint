
import type { attributes} from '@joint/core';
import { type dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
import { getTargetOrSource } from '../utils/cell/get-link-targe-and-source-ids';
import { REACT_TYPE } from '../models/react-element';
import { DEFAULT_LINK_THEME, resolveMarker } from '../theme/link-theme';

export interface ElementToGraphOptions<Element extends GraphElement> {
  readonly id: string;
  readonly data: Element;
  readonly graph: dia.Graph;
  readonly defaultAttributes: () => dia.Cell.JSON;
}

export interface GraphToElementOptions<Element extends GraphElement> {
  readonly id: string;
  readonly cell: dia.Element;
  readonly previous?: Element;
  readonly graph: dia.Graph;
  readonly defaultAttributes: () => Element;
}

export interface LinkToGraphOptions<Link extends GraphLink> {
  readonly id: string;
  readonly data: Link;
  readonly graph: dia.Graph;
  readonly defaultAttributes: () => dia.Cell.JSON;
}

export interface GraphToLinkOptions<Link extends GraphLink> {
  readonly id: string;
  readonly cell: dia.Link;
  readonly previous?: Link;
  readonly graph: dia.Graph;
  readonly defaultAttributes: () => Link;
}

export type LinkFromGraphSelector<Link extends GraphLink> = (
  options: GraphToLinkOptions<Link>
) => Link;

export interface GraphStateSelectors<Element extends GraphElement, Link extends GraphLink> {
  readonly mapDataToElementAttributes?: (options: ElementToGraphOptions<Element>) => dia.Cell.JSON;
  readonly mapDataToLinkAttributes?: (options: LinkToGraphOptions<Link>) => dia.Cell.JSON;
}

/**
 * Creates the default mapper function for element to graph conversion.
 * Separates user data into the `data` property.
 * Supports both flat format (x, y, width, height) and nested format (position, size).
 * @param id
 * @param data - The element to convert
 * @returns A function that returns the JointJS Cell JSON representation
 */
export function createDefaultElementMapper<Element extends GraphElement>(
  id: string,
  data: Element
): () => dia.Cell.JSON {
  return () => {
    // Extract built-in JointJS element properties
    // Support both flat format (x, y, width, height) and nested format (position, size)
    const { x, y, width, height, angle, z, ports, position, size, ...userData } =
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

    if (angle !== undefined) attributes.angle = angle;
    if (z !== undefined) attributes.z = z;
    if (ports !== undefined) attributes.ports = ports;
    if (elementAttributes !== undefined) attributes.attrs = elementAttributes;
    if (markup !== undefined) attributes.markup = markup;

    if (Object.keys(restUserData).length > 0) {
      attributes.data = restUserData;
    }

    return attributes;
  };
}

/**
 * Applies shape preservation by filtering cellData to only include keys from previous state.
 * @param cellData - The cell data extracted from the graph
 * @param previous - The previous element state used as shape template
 * @returns The filtered element with only properties from the previous state
 */
function applyShapePreservation<Element extends GraphElement>(
  cellData: Record<string, unknown>,
  previous: Element
): Element {
  const filtered: Record<string, unknown> = {};
  const previousRecord = previous as Record<string, unknown>;
  for (const key in previousRecord) {
    if (Object.prototype.hasOwnProperty.call(previousRecord, key)) {
      filtered[key] = key in cellData ? cellData[key] : previousRecord[key];
    }
  }
  return filtered as Element;
}

/**
 * Extracts base cell data from a JointJS Element.
 * @param cell - The JointJS Element cell
 * @returns The extracted cell data as a record
 */
function extractBaseCellData(cell: dia.Element): Record<string, unknown> {
  const { size, position, data, angle, z, ports } = cell.attributes;

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
  // Spread user data from data property to top level
  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      cellData[key] = value;
    }
  }

  return cellData;
}

/**
 * Creates the default mapper function for graph to element conversion.
 * Extracts user data from the `data` property and spreads it to top level.
 * @param cell - The JointJS Element cell
 * @param previous - Optional previous element state for shape preservation
 * @returns A function that returns the GraphElement representation
 */
export function createDefaultGraphToElementMapper<Element extends GraphElement>(
  cell: dia.Element,
  previous?: Element
): () => Element {
  return () => {
    const cellData = extractBaseCellData(cell);

    if (previous !== undefined) {
      return applyShapePreservation(cellData, previous);
    }

    return cellData as Element;
  };
}

/**
 * Creates the default mapper function for link to graph conversion.
 * Extracts styling properties and applies theme defaults.
 * Separates user data into the `data` property.
 * @param id
 * @param data - The link to convert
 * @param graph - The JointJS graph instance
 * @param _graph
 * @returns A function that returns the JointJS Cell JSON representation
 */
export function createDefaultLinkMapper<Link extends GraphLink>(
  id: string,
  data: Link,

  _graph: dia.Graph
): () => dia.Cell.JSON {
  return () => {
    // Extract built-in JointJS link properties, remaining properties are user data
    const {
      source: linkSource,
      target: linkTarget,
      z,
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
      ...userData
    } = data;

    // Read styling properties with theme defaults
    const source = getTargetOrSource(linkSource);
    const target = getTargetOrSource(linkTarget);

    // Build theme-based line attributes
    const resolvedSourceMarker = resolveMarker(sourceMarker);
    const resolvedTargetMarker = resolveMarker(targetMarker);

    const resolvedLineAttributes: attributes.SVGAttributes = {
      stroke: color,
      strokeWidth: width,
    };
    if (resolvedSourceMarker !== null) {
      resolvedLineAttributes.sourceMarker = resolvedSourceMarker;
    }
    if (resolvedTargetMarker !== null) {
      resolvedLineAttributes.targetMarker = resolvedTargetMarker;
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
              ...resolvedLineAttributes
          },
          wrapper: {
              connection: true,
              strokeWidth: 10,
              strokeLinejoin: 'round'
          }
      }
    };

    if (z !== undefined) attributes.z = z;
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
    };

    return attributes;
  };
}

/**
 * Creates the default mapper function for graph to link conversion.
 * Extracts user data from the `data` property and spreads it to top level.
 * @param cell - The JointJS Link cell
 * @param previous - Optional previous link state for shape preservation
 * @returns A function that returns the GraphLink representation
 */
export function createDefaultGraphToLinkMapper<Link extends GraphLink>(
  cell: dia.Link,
  previous?: Link
): () => Link {
  return () => {
    const { data, ...attributes } = cell.attributes;

    const cellData: Record<string, unknown> = {
      ...attributes,
      source: cell.get('source') as dia.Cell.ID,
      target: cell.get('target') as dia.Cell.ID,
      z: cell.get('z'),
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
    if (previous !== undefined) {
      const filtered: Record<string, unknown> = {};
      const previousRecord = previous as Record<string, unknown>;
      for (const key in previousRecord) {
        if (Object.prototype.hasOwnProperty.call(previousRecord, key)) {
          filtered[key] = key in cellData ? cellData[key] : previousRecord[key];
        }
      }
      return filtered as Link;
    }

    return cellData as Link;
  };
}

/**
 * Default selector that converts a Link to a JointJS Cell JSON representation.
 * @param options - The options containing the link, graph, and defaultAttributes.
 * @returns A JointJS Cell JSON representation of the link.
 * @group state
 * @description
 * This selector uses the defaultAttributes to convert the link to a JointJS cell JSON.
 * The defaultAttributes handles source/target extraction, attribute merging, and data separation.
 */
export function defaultMapDataToLinkAttributes<Link extends GraphLink>(
  options: LinkToGraphOptions<Link>
): dia.Cell.JSON {
  const { defaultAttributes } = options;
  return defaultAttributes();
}

/**
 * Default selector that converts an Element to a JointJS Cell JSON representation.
 * @param options - The options containing the element, graph, and defaultAttributes.
 * @returns A JointJS Cell JSON representation of the element.
 * @group state
 * @description
 * This selector uses the defaultAttributes to convert the element to a JointJS cell JSON.
 * The defaultAttributes handles position/size extraction and data separation.
 */
export function defaultMapDataToElementAttributes<Element extends GraphElement>(
  options: ElementToGraphOptions<Element>
): dia.Cell.JSON {
  const { defaultAttributes } = options;
  return defaultAttributes();
}

/**
 * Default selector that converts a JointJS Link cell to a Link representation.
 * @param options - The options containing the cell, previous state, graph, and defaultAttributes.
 * @returns A Link representation extracted from the cell.
 * @group state
 * @description
 * This selector uses the defaultAttributes to convert the JointJS link cell to a Link.
 * The defaultAttributes handles data extraction and shape preservation.
 */
export function mapLinkAttributesToData<Link extends GraphLink>(
  options: GraphToLinkOptions<Link>
): Link {
  const { defaultAttributes } = options;
  return defaultAttributes();
}

/**
 * Default selector that converts a JointJS Element cell to a GraphElement representation.
 * @param options - The options containing the cell, previous state, graph, and defaultAttributes.
 * @returns A GraphElement representation extracted from the cell.
 * @group state
 * @description
 * This selector uses the defaultAttributes to convert the JointJS element cell to a GraphElement.
 * The defaultAttributes handles data extraction and shape preservation.
 */
export function mapElementAttributesToData<Element extends GraphElement>(
  options: GraphToElementOptions<Element>
): GraphElement {
  const { defaultAttributes } = options;
  return defaultAttributes();
}
