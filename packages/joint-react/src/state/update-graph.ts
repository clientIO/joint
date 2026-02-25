import type { dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
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
} from './data-mapper';
import { fastElementArrayEqual, isPositionOnlyUpdate } from '../utils/fast-equality';

/**
 * Configuration options for updating a JointJS graph.
 * @template Graph - The type of JointJS graph instance
 * @template Element - The type of elements in the graph
 * @template Link - The type of links in the graph
 */
export interface UpdateGraphOptions<
  Graph extends dia.Graph,
  Element extends GraphElement,
  Link extends GraphLink,
> {
  /** The JointJS graph instance to update */
  readonly graph: Graph;
  /** The elements to sync to the graph (Record keyed by cell ID) */
  readonly elements: Record<dia.Cell.ID, Element>;
  /** The links to sync to the graph (Record keyed by cell ID) */
  readonly links: Record<dia.Cell.ID, Link>;
  /** Selector to convert graph elements to Element format for comparison */
  readonly graphToElementSelector: (
    options: GraphToElementOptions<Element> & { readonly graph: Graph }
  ) => Element;
  /** Selector to convert graph links to Link format for comparison */
  readonly graphToLinkSelector: (
    options: GraphToLinkOptions<Link> & { readonly graph: Graph }
  ) => Link;
  /** Selector to convert Element to JointJS Cell JSON format */
  readonly mapDataToElementAttributes: (
    options: ElementToGraphOptions<Element> & { readonly graph: Graph }
  ) => dia.Cell.JSON;
  /** Selector to convert Link to JointJS Cell JSON format */
  readonly mapDataToLinkAttributes: (
    options: LinkToGraphOptions<Link> & { readonly graph: Graph }
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
export function mapGraphElement<Graph extends dia.Graph, Element extends GraphElement>(
  cell: dia.Element,
  graph: Graph,
  selector: (options: GraphToElementOptions<Element> & { readonly graph: Graph }) => Element,
  previousData?: Element
): Element {
  const id = cell.id as string;
  return selector({
    id, cell, graph, previousData,
    toData: () => defaultMapElementAttributesToData({ id, cell, graph } as unknown as GraphToElementOptions<Element>),
  });
}

/**
 * Maps a JointJS link to its typed representation using the provided selector.
 * @param cell
 * @param graph
 * @param selector
 * @param previousData
 */
export function mapGraphLink<Graph extends dia.Graph, Link extends GraphLink>(
  cell: dia.Link,
  graph: Graph,
  selector: (options: GraphToLinkOptions<Link> & { readonly graph: Graph }) => Link,
  previousData?: Link
): Link {
  const id = cell.id as string;
  return selector({
    id, cell, graph, previousData,
    toData: () => defaultMapLinkAttributesToData({ id, cell, graph } as unknown as GraphToLinkOptions<Link>),
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
function isGraphInSync<Element extends GraphElement, Link extends GraphLink>(
  graphElements: Element[],
  graphLinks: Link[],
  elements: Element[],
  links: Link[]
): boolean {
  // Fast path: Check if arrays have same length first
  if (elements.length !== graphElements.length || links.length !== graphLinks.length) {
    return false;
  }

  // Position-only update: use fast equality check
  if (isPositionOnlyUpdate(graphElements, elements)) {
    return (
      fastElementArrayEqual(elements, graphElements) && fastElementArrayEqual(links, graphLinks)
    );
  }

  // General equality check
  return fastElementArrayEqual(elements, graphElements) && fastElementArrayEqual(links, graphLinks);
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
  Element extends GraphElement,
  Link extends GraphLink,
>(options: UpdateGraphOptions<Graph, Element, Link>): boolean {
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
    const attrs = mapDataToElementAttributes({
      id, data, graph,
      toAttributes: (newData = data) => defaultMapDataToElementAttributes({ id, data: newData, graph } as unknown as ElementToGraphOptions<Element>),
    });
    if ('id' in attrs && attrs.id !== id) {
      throw new Error(
        `mapDataToElementAttributes returned id "${String(attrs.id)}" but the record key is "${id}". ` +
        'Cell id is immutable and determined by the record key. Do not set id in the mapper return value.'
      );
    }
    attrs.id = id;
    return attrs;
  });

  const linkItems = Object.entries(linksRecord).map(([id, data]) => {
    const attrs = mapDataToLinkAttributes({
      id, data, graph,
      toAttributes: (newData = data) => defaultMapDataToLinkAttributes({ id, data: newData, graph } as unknown as LinkToGraphOptions<Link>),
    });
    if ('id' in attrs && attrs.id !== id) {
      throw new Error(
        `mapDataToLinkAttributes returned id "${String(attrs.id)}" but the record key is "${id}". ` +
        'Cell id is immutable and determined by the record key. Do not set id in the mapper return value.'
      );
    }
    attrs.id = id;
    return attrs;
  });

  graph.syncCells([...elementItems, ...linkItems], { remove: true, isUpdateFromReact });
  return true;
}
