/* eslint-disable prefer-destructuring */
/* eslint-disable unicorn/explicit-length-check */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable jsdoc/require-jsdoc */
import { type dia } from '@joint/core';
import type { ElementRecord, ElementWithLayout, LinkRecord } from '../types/data-types';
import {
  type GraphMappings,
  type MapAttributesToElement,
  type MapAttributesToLink,
  type MapElementToAttributes,
  type MapLinkToAttributes,
  buildElementFromAttributes,
  buildLinkFromAttributes,
  buildAttributesFromElement,
  buildAttributesFromLink,
} from '../state/data-mapping';
import { graphChanges, type UpdateGraphOptions } from './graph-changes';
import { asReadonlyContainer, createContainer } from './state-container';
import { isShallowEqual, isPositionEqual, isSizeEqual } from '../utils/selector-utils';

/** Incremental change set emitted by graphView after container commits. */
export interface IncrementalContainerChanges<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
> {
  readonly elements: {
    readonly added: Map<string, ElementRecord<ElementData>>;
    readonly changed: Map<string, ElementRecord<ElementData>>;
    readonly removed: Set<string>;
  };
  readonly links: {
    readonly added: Map<string, LinkRecord<LinkData>>;
    readonly changed: Map<string, LinkRecord<LinkData>>;
    readonly removed: Set<string>;
  };
}

interface GraphViewState<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
> {
  readonly mappings: GraphMappings<ElementData, LinkData>;
  readonly graph: dia.Graph;
  readonly onIncrementalChange?: (
    changes: IncrementalContainerChanges<ElementData, LinkData>
  ) => void;
}

export function graphView<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
>(options: GraphViewState<ElementData, LinkData>) {
  const { graph, onIncrementalChange, mappings } = options;

  let {
    mapAttributesToElement = buildElementFromAttributes,
    mapAttributesToLink = buildLinkFromAttributes,
    mapElementToAttributes = ({ id, element }) => ({ ...buildAttributesFromElement(element), id }),
    mapLinkToAttributes = ({ id, link }) => ({ ...buildAttributesFromLink(link), id }),
  } = mappings;

  const elements = createContainer<ElementWithLayout<ElementData>>('Elements');
  const links = createContainer<LinkRecord<LinkData>>('Links');

  const trackChanges = onIncrementalChange !== undefined;
  const elementAdded = trackChanges ? new Map<string, ElementRecord<ElementData>>() : undefined;
  const elementChanged = trackChanges ? new Map<string, ElementRecord<ElementData>>() : undefined;
  const elementRemoved = trackChanges ? new Set<string>() : undefined;
  const linkAdded = trackChanges ? new Map<string, LinkRecord<LinkData>>() : undefined;
  const linkChanged = trackChanges ? new Map<string, LinkRecord<LinkData>>() : undefined;
  const linkRemoved = trackChanges ? new Set<string>() : undefined;

  const graphChangesController = graphChanges({
    mapElementToAttributes,
    mapLinkToAttributes,
    graph,
    onChanges: ({ changes, isInsideBatch }) => {
      let hasElementChange = false;
      let hasLinkChange = false;

      for (const [id, change] of changes) {
        const { data, type } = change;
        switch (type) {
          case 'add':
          case 'change': {
            const isAdd = type === 'add';
            if (data.isLink()) {
              const linkData = mapAttributesToLink(data.attributes);
              links.set(id, linkData);
              if (trackChanges) {
                if (isAdd) {
                  linkAdded!.set(id, linkData);
                } else {
                  linkChanged!.set(id, linkData);
                }
              }
              hasLinkChange = true;
            } else if (data.isElement()) {
              // Compare values directly instead of relying on model.changed,
              // because Backbone's changed hash only reflects the last set() call
              // and loses intermediate changes within a batch.
              elements.set(id, (previous) => {
                const newElementData = mapAttributesToElement(
                  data.attributes
                ) as ElementWithLayout<ElementData>;
                if (!previous) return newElementData;
                const { data: userData, position, size, ...rest } = newElementData;
                const { data: prevUserData, position: prevPosition, size: prevSize } = previous;
                return {
                  ...previous,
                  ...rest,
                  data: isShallowEqual(prevUserData, userData) ? prevUserData : userData,
                  position: isPositionEqual(prevPosition, position) ? prevPosition : position,
                  size: isSizeEqual(prevSize, size) ? prevSize : size,
                };
              });
              if (trackChanges) {
                if (isAdd) {
                  elementAdded!.set(id, elements.get(id)!);
                } else {
                  // Only mark as changed if relevant data actually changed (not just an attribute update that doesn't affect the element data/position/size)
                  elementChanged!.set(id, elements.get(id)!);
                }
              }
              // When an element changes, also update connected links since their layout may be affected
              for (const link of graph.getConnectedLinks(data)) {
                const linkId = String(link.id);
                const linkData = mapAttributesToLink(link.attributes);
                links.set(linkId, linkData);
                hasLinkChange = true;
              }
              hasElementChange = true;
            }
            break;
          }
          case 'remove': {
            if (!data) {
              continue;
            }
            if (data.isLink()) {
              links.delete(id);
              if (trackChanges) {
                linkRemoved!.add(id);
              }
              hasLinkChange = true;
            } else if (data.isElement()) {
              elements.delete(id);
              if (trackChanges) {
                elementRemoved!.add(id);
              }
              // When an element is removed, also remove connected links since they are deleted in JointJS
              for (const link of graph.getConnectedLinks(data)) {
                const linkId = String(link.id);
                links.delete(linkId);
                if (trackChanges) {
                  linkRemoved!.add(linkId);
                }
              }
              hasElementChange = true;
            }
            break;
          }
        }
      }

      // Commit all containers — subscribers (React hooks) see updated data
      if (hasElementChange) {
        elements.commitChanges();
      }
      if (hasLinkChange) {
        links.commitChanges();
      }

      const hasTrackedChanges =
        trackChanges &&
        !isInsideBatch &&
        (elementAdded!.size > 0 ||
          elementChanged!.size > 0 ||
          elementRemoved!.size > 0 ||
          linkAdded!.size > 0 ||
          linkChanged!.size > 0 ||
          linkRemoved!.size > 0);

      // Fire incremental change callback AFTER commits — graphStore can read latest container state
      if (hasTrackedChanges) {
        onIncrementalChange!({
          elements: { added: elementAdded!, changed: elementChanged!, removed: elementRemoved! },
          links: { added: linkAdded!, changed: linkChanged!, removed: linkRemoved! },
        });
        // clear
        elementAdded!.clear();
        elementChanged!.clear();
        elementRemoved!.clear();
        linkAdded!.clear();
        linkChanged!.clear();
        linkRemoved!.clear();
      }

      changes.clear();
    },
  });

  /**
   * Populate containers from current graph cells.
   * Called after initial graph sync to seed container state that was missed
   * because graphChanges skips events with `isUpdateFromReact`.
   */
  function syncFromGraph() {
    for (const cell of graph.getCells()) {
      const id = String(cell.id);
      if (cell.isElement()) {
        const data = mapAttributesToElement(cell.attributes);
        elements.set(id, data as ElementWithLayout<ElementData>);
      } else if (cell.isLink()) {
        const data = mapAttributesToLink(cell.attributes);
        links.set(id, data);
      }
    }
    if (elements.getSize() > 0) elements.commitChanges();
    if (links.getSize() > 0) links.commitChanges();
  }

  return {
    elements: asReadonlyContainer(elements),
    links: asReadonlyContainer(links),
    syncFromGraph,
    updateGraph(update: UpdateGraphOptions<ElementData, LinkData>) {
      graphChangesController.updateGraph(update);
      // After updateGraph with isUpdateFromReact, graphChanges skips the events.
      // Populate containers directly so hooks see the data.
      const { elements: userElements, links: userLinks, flag } = update;
      if (flag !== 'updateFromReact') {
        return;
      }
      for (const [id, data] of Object.entries(userElements)) {
        const cell = graph.getCell(id);
        if (cell?.isElement()) {
          elements.set(id, {
            position: cell.position(),
            size: cell.size(),
            angle: cell.angle(),
            ...data,
          } as ElementWithLayout<ElementData>);
        }
      }
      for (const [id, data] of Object.entries(userLinks)) {
        links.set(id, data);
      }
      // Remove elements/links that are no longer in the user state
      for (const [id] of elements.getFull()) {
        if (!(id in userElements)) {
          elements.delete(id);
        }
      }
      for (const [id] of links.getFull()) {
        if (!(id in userLinks)) {
          links.delete(id);
        }
      }

      if (elements.getSize() > 0 || Object.keys(userElements).length > 0) elements.commitChanges();
      if (links.getSize() > 0 || Object.keys(userLinks).length > 0) links.commitChanges();
    },
    updateMappers(nextMappers: GraphMappings<ElementData, LinkData>) {
      // Only update mappers that actually changed
      let changed = false;
      if (
        nextMappers.mapAttributesToElement &&
        nextMappers.mapAttributesToElement !== mapAttributesToElement
      ) {
        mapAttributesToElement = nextMappers.mapAttributesToElement;
        changed = true;
      }
      if (
        nextMappers.mapAttributesToLink &&
        nextMappers.mapAttributesToLink !== mapAttributesToLink
      ) {
        mapAttributesToLink = nextMappers.mapAttributesToLink;
        changed = true;
      }
      if (
        nextMappers.mapElementToAttributes &&
        nextMappers.mapElementToAttributes !== mapElementToAttributes
      ) {
        mapElementToAttributes = nextMappers.mapElementToAttributes;
        changed = true;
      }
      if (
        nextMappers.mapLinkToAttributes &&
        nextMappers.mapLinkToAttributes !== mapLinkToAttributes
      ) {
        mapLinkToAttributes = nextMappers.mapLinkToAttributes;
        changed = true;
      }
      // Skip re-sync if no mapper actually changed
      if (!changed) return;
      // Keep graphChanges in sync so subsequent updateGraph calls use the new mappers
      graphChangesController.updateMappers({
        mapElementToAttributes,
        mapLinkToAttributes,
      });
      // Re-sync all existing data through updated mappers
      const graphElements: dia.Cell.JSON[] = [];
      const graphLinks: dia.Cell.JSON[] = [];

      for (const [id, element] of elements.getFull()) {
        const attributes = mapElementToAttributes({
          id,
          element,
        });
        graphElements.push({ ...attributes, id });
      }
      for (const [id, link] of links.getFull()) {
        const attributes = mapLinkToAttributes({
          id,
          link,
        });
        graphLinks.push({ ...attributes, id });
      }

      graph.syncCells([...graphElements, ...graphLinks], {
        remove: true,
        isUpdateFromReact: true,
      });
    },
    destroy() {
      graphChangesController.destroy();
    },
    mapAttributesToElement: mapAttributesToElement as MapAttributesToElement<ElementData>,
    mapAttributesToLink: mapAttributesToLink as MapAttributesToLink<LinkData>,
    mapElementToAttributes: mapElementToAttributes as MapElementToAttributes<ElementData>,
    mapLinkToAttributes: mapLinkToAttributes as MapLinkToAttributes<LinkData>,
  };
}

export type GraphView<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
> = ReturnType<typeof graphView<ElementData, LinkData>>;
