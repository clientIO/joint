import type { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { FlatElementData } from '../types/element-types';
import type { FlatLinkData } from '../types/link-types';
import type {
  ElementToGraphOptions,
  GraphToElementOptions,
  GraphToLinkOptions,
  LinkToGraphOptions,
} from './graph-state-selectors';
import {
  defaultMapDataToElementAttributes,
  defaultMapDataToLinkAttributes,
  defaultMapElementAttributesToData,
  defaultMapLinkAttributesToData,
} from './data-mapping';
import { resolveCellDefaults } from './data-mapping/resolve-cell-defaults';
import { fastElementArrayEqual, isPositionOnlyUpdate } from '../utils/fast-equality';

/**
 * Configuration options for updating a JointJS graph.
 * @template Graph - The type of JointJS graph instance
 * @template Element - The type of elements in the graph
 * @template Link - The type of links in the graph
 */
export interface UpdateGraphOptions<
  Graph extends dia.Graph,
  ElementData = FlatElementData,
  LinkData = FlatLinkData,
> {
  /** The JointJS graph instance to update */
  readonly graph: Graph;
  /** The elements to sync to the graph (Record keyed by cell ID) */
  readonly elements: Record<CellId, ElementData>;
  /** The links to sync to the graph (Record keyed by cell ID) */
  readonly links: Record<CellId, LinkData>;
  /** Selector to convert graph elements to Element format for comparison */
  readonly graphToElementSelector: (
    options: GraphToElementOptions<ElementData> & { readonly graph: Graph }
  ) => ElementData;
  /** Selector to convert graph links to Link format for comparison */
  readonly graphToLinkSelector: (
    options: GraphToLinkOptions<LinkData> & { readonly graph: Graph }
  ) => LinkData;
  /** Selector to convert Element to JointJS Cell JSON format */
  readonly mapDataToElementAttributes: (
    options: ElementToGraphOptions<ElementData> & { readonly graph: Graph }
  ) => dia.Cell.JSON;
  /** Selector to convert Link to JointJS Cell JSON format */
  readonly mapDataToLinkAttributes: (
    options: LinkToGraphOptions<LinkData> & { readonly graph: Graph }
  ) => dia.Cell.JSON;

  readonly isUpdateFromReact?: boolean;
}

/**
 * Maps a JointJS element to its typed representation using the provided selector.
 * @param cell
 * @param graph
 * @param selector
 * @param previousData
 */
export function mapGraphElement<Graph extends dia.Graph, ElementData = FlatElementData>(
  cell: dia.Element,
  graph: Graph,
  selector: (
    options: GraphToElementOptions<ElementData> & { readonly graph: Graph }
  ) => ElementData,
  previousData?: ElementData
): ElementData {
  const id = cell.id as string;
  const defaultAttributes = resolveCellDefaults(cell);
  return selector({
    id,
    attributes: cell.attributes,
    defaultAttributes,
    element: cell,
    graph,
    previousData,
    toData: (attributes) =>
      defaultMapElementAttributesToData({ attributes, defaultAttributes }) as ElementData,
  });
}

/**
 * Maps a JointJS link to its typed representation using the provided selector.
 * @param cell
 * @param graph
 * @param selector
 * @param previousData
 */
export function mapGraphLink<Graph extends dia.Graph, LinkData = FlatLinkData>(
  cell: dia.Link,
  graph: Graph,
  selector: (options: GraphToLinkOptions<LinkData> & { readonly graph: Graph }) => LinkData,
  previousData?: LinkData
): LinkData {
  const id = cell.id as string;
  const defaultAttributes = resolveCellDefaults(cell);
  return selector({
    id,
    attributes: cell.attributes,
    defaultAttributes,
    link: cell,
    graph,
    previousData,
    toData: (attributes) =>
      defaultMapLinkAttributesToData({ attributes, defaultAttributes }) as LinkData,
  });
}

/**
 * Checks if the graph state matches the provided elements and links.
 * Uses fast equality checks optimized for position-only updates.
 * @param graphElements
 * @param graphLinks
 * @param elements
 * @param links
 */
function isGraphInSync<ElementData = FlatElementData, LinkData = FlatLinkData>(
  graphElements: ElementData[],
  graphLinks: LinkData[],
  elements: ElementData[],
  links: LinkData[]
): boolean {
  // Fast path: Check if arrays have same length first
  if (elements.length !== graphElements.length || links.length !== graphLinks.length) {
    return false;
  }

  // Position-only update: use fast equality check
  if (isPositionOnlyUpdate(graphElements as FlatElementData[], elements as FlatElementData[])) {
    return (
      fastElementArrayEqual(
        elements as Array<Record<string, unknown>>,
        graphElements as Array<Record<string, unknown>>
      ) &&
      fastElementArrayEqual(
        links as Array<Record<string, unknown>>,
        graphLinks as Array<Record<string, unknown>>
      )
    );
  }

  // General equality check
  return (
    fastElementArrayEqual(
      elements as Array<Record<string, unknown>>,
      graphElements as Array<Record<string, unknown>>
    ) &&
    fastElementArrayEqual(
      links as Array<Record<string, unknown>>,
      graphLinks as Array<Record<string, unknown>>
    )
  );
}

/**
 * Updates a JointJS graph with the provided elements and links.
 * Compares the current graph state with the provided state and only syncs if they differ.
 * @template Graph - The type of JointJS graph instance
 * @template Element - The type of elements in the graph
 * @template Link - The type of links in the graph
 * @param options - Configuration options for updating the graph
 * @returns true if the graph was synced, false if it was already in sync or skipped due to active batch
 */
export function updateGraph<
  Graph extends dia.Graph,
  ElementData = FlatElementData,
  LinkData = FlatLinkData,
>(options: UpdateGraphOptions<Graph, ElementData, LinkData>): boolean {
  const {
    graph,
    elements: elementsRecord,
    links: linksRecord,
    graphToElementSelector,
    graphToLinkSelector,
    mapDataToElementAttributes,
    mapDataToLinkAttributes,
    isUpdateFromReact,
  } = options;

  if (graph.hasActiveBatch()) {
    return false;
  }

  // Convert records to arrays
  const elements = Object.values(elementsRecord);
  const links = Object.values(linksRecord);

  // Map current graph state to typed representations
  // Pass previous data state for shape preservation
  const graphElements = graph
    .getElements()
    .map((cell) => mapGraphElement(cell, graph, graphToElementSelector, elementsRecord[cell.id]));
  const graphLinks = graph
    .getLinks()
    .map((cell) => mapGraphLink(cell, graph, graphToLinkSelector, linksRecord[cell.id]));

  // Skip sync if already in sync
  if (isGraphInSync(graphElements, graphLinks, elements, links)) {
    return false;
  }

  // Build items array using selectors
  // The store always enforces the `id` from the record key onto the returned
  // attributes — custom mappers don't need to (and can't) change the cell id.
  const elementItems = Object.entries(elementsRecord).map(([id, data]) => {
    const attributes = mapDataToElementAttributes({
      id,
      data,
      graph,
      toAttributes: (newData) =>
        defaultMapDataToElementAttributes({ id, data: newData as FlatElementData }),
    });
    if ('id' in attributes && attributes.id !== id) {
      throw new Error(
        `mapDataToElementAttributes returned id "${String(attributes.id)}" but the record key is "${id}". ` +
          'Cell id is immutable and determined by the record key. Do not set id in the mapper return value.'
      );
    }
    attributes.id = id;
    return attributes;
  });

  const linkItems = Object.entries(linksRecord).map(([id, data]) => {
    const attributes = mapDataToLinkAttributes({
      id,
      data,
      graph,
      toAttributes: (newData, attributeOptions) =>
        defaultMapDataToLinkAttributes({ id, data: newData as FlatLinkData, ...attributeOptions }),
    });
    if ('id' in attributes && attributes.id !== id) {
      throw new Error(
        `mapDataToLinkAttributes returned id "${String(attributes.id)}" but the record key is "${id}". ` +
          'Cell id is immutable and determined by the record key. Do not set id in the mapper return value.'
      );
    }
    attributes.id = id;
    return attributes;
  });

  graph.syncCells([...elementItems, ...linkItems], { remove: true, isUpdateFromReact });
  return true;
}
