/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable jsdoc/require-jsdoc */
import { util, type dia } from '@joint/core';
import type { FlatElementData, FlatLinkData } from '../types/data-types';
import type { CellData } from '../types/cell-data';
import {
  flatMapDataToElementAttributes,
  flatMapDataToLinkAttributes,
  flatMapElementAttributesToData,
  flatMapLinkAttributesToData,
  type GraphMappings,
  type CellAttributes,
} from '../state/data-mapping';
import { resolveCellDefaults, type PaperStore } from '../internal';
import { graphChanges } from './graph-changes';
import { asReadonlyContainer, createContainer } from './state-container';
import type { ElementLayout, LinkLayout } from '../types/cell-data';
import { getLinkLayout } from './update-layout-state';
import { hasDefinedSize } from '../utils/is';

export interface ElementToData<ElementData extends object = CellData> {
  readonly element: dia.Element;
  readonly previousData?: ElementData;
}

export interface LinkToData<LinkData extends object = CellData> {
  readonly link: dia.Link;
  readonly previousData?: LinkData;
}

export interface ElementToAttributes<ElementData extends object = CellData> {
  readonly id: string;
  readonly data: ElementData;
}

export interface LinkToAttributes<LinkData extends object = CellData> {
  readonly id?: string;
  readonly data: LinkData;
}

/** Incremental change set emitted by graphView after container commits. */
export interface IncrementalContainerChanges<ElementData, LinkData> {
  readonly elements: {
    readonly added: Map<string, ElementData>;
    readonly changed: Map<string, ElementData>;
    readonly removed: Set<string>;
  };
  readonly links: {
    readonly added: Map<string, LinkData>;
    readonly changed: Map<string, LinkData>;
    readonly removed: Set<string>;
  };
  readonly elementsLayout: {
    readonly added: Map<string, ElementLayout>;
    readonly changed: Map<string, ElementLayout>;
    readonly removed: Set<string>;
  };
  readonly linksLayout: {
    readonly added: Map<string, Record<string, LinkLayout>>;
    readonly changed: Map<string, Record<string, LinkLayout>>;
    readonly removed: Set<string>;
  };
}

interface GraphViewState<
  ElementData extends object = CellData,
  LinkData extends object = CellData,
> extends GraphMappings<ElementData, LinkData> {
  readonly graph: dia.Graph;
  readonly enableBatchUpdates?: boolean;
  readonly getPaperStores: () => Map<string, PaperStore>;
  readonly onIncrementalChange?: (
    changes: IncrementalContainerChanges<ElementData, LinkData>
  ) => void;
}

export type ElementToAttribute<ElementData extends object = CellData> = (
  options: ElementToAttributes<ElementData>
) => CellAttributes;
export type LinkToAttribute<LinkData extends object = CellData> = (
  options: LinkToAttributes<LinkData>
) => CellAttributes;

interface UpdateGraphOptions<
  ElementData extends object = CellData,
  LinkData extends object = CellData,
> {
  readonly elements: Record<string, ElementData>;
  readonly links: Record<string, LinkData>;
  readonly flag?: 'updateFromReact';
}

export interface GraphView<
  ElementData extends object = CellData,
  LinkData extends object = CellData,
> {
  /** Populate containers from current graph cells (initial sync). */
  readonly syncFromGraph: () => void;
  readonly elements: ReturnType<typeof asReadonlyContainer<ElementData>>;
  readonly links: ReturnType<typeof asReadonlyContainer<LinkData>>;
  readonly elementsLayout: ReturnType<typeof asReadonlyContainer<ElementLayout>>;
  readonly linksLayout: ReturnType<typeof asReadonlyContainer<Record<string, LinkLayout>>>;
  /** Sync React state into the JointJS graph. */
  readonly updateGraph: (options: UpdateGraphOptions<ElementData, LinkData>) => void;
  /** Update mapper functions at runtime (e.g. when useFlatElementData deps change). */
  readonly updateMappers: (mappers: GraphMappings<ElementData, LinkData>) => void;
  /** Convert a JointJS element to its React data representation. */
  readonly elementToData: (options: ElementToData<ElementData>) => ElementData;
  /** Convert React element data to JointJS cell attributes. */
  readonly elementToAttributes: (options: ElementToAttributes<ElementData>) => CellAttributes;
  /** Convert a JointJS link to its React data representation. */
  readonly linkToData: (options: LinkToData<LinkData>) => LinkData;
  /** Convert React link data to JointJS cell attributes. */
  readonly linkToAttributes: (options: LinkToAttributes<LinkData>) => CellAttributes;
  /** Track auto-sized element IDs. */
  readonly autoSizedElementIds: ReadonlySet<string>;
  /** Update auto-sized status for a single element. */
  readonly updateAutoSizedElement: (id: string, data: Record<string, unknown>) => void;
  destroy: () => void;
}
export function graphView<
  ElementData extends object = CellData,
  LinkData extends object = CellData,
>(options: GraphViewState<ElementData, LinkData>): GraphView<ElementData, LinkData> {
  const { graph, getPaperStores, onIncrementalChange } = options;

  // Mappers are stored mutably so they can be swapped at runtime
  // (e.g. when useFlatElementData/useFlatLinkData deps change).
  const mappers = {
    mapDataToElementAttributes:
      options.mapDataToElementAttributes ?? flatMapDataToElementAttributes,
    mapDataToLinkAttributes: options.mapDataToLinkAttributes ?? flatMapDataToLinkAttributes,
    mapElementAttributesToData:
      options.mapElementAttributesToData ?? flatMapElementAttributesToData,
    mapLinkAttributesToData: options.mapLinkAttributesToData ?? flatMapLinkAttributesToData,
  };

  let {
    mapDataToElementAttributes,
    mapDataToLinkAttributes,
    mapElementAttributesToData,
    mapLinkAttributesToData,
  } = mappers;

  /** Layout-only keys on a JointJS element — changes to these don't affect user data. */
  const LAYOUT_KEYS = new Set(['position', 'size', 'angle']);

  /**
   * Returns true if the element's last change only affected layout properties (position/size/angle).
   * Uses `cell.changed` which JointJS sets to the keys modified in the last `set()` call.
   * @param cell
   */
  function isElementLayoutOnlyChange(cell: dia.Element): boolean {
    const { changed } = cell;
    if (!changed || typeof changed !== 'object') return false;
    const changedKeys = Object.keys(changed);
    return changedKeys.length > 0 && changedKeys.every((key) => LAYOUT_KEYS.has(key));
  }

  const autoSizedElementIds = new Set<string>();

  const elements = createContainer<ElementData>();
  const links = createContainer<LinkData>();
  const elementsLayout = createContainer<ElementLayout>();
  const linksLayout = createContainer<Record<string, LinkLayout>>();

  function getPreviousElementData(element: dia.Element): ElementData | undefined {
    const { id } = element;
    return elements.get(String(id));
  }

  function getPreviousLinkData(link: dia.Link): LinkData | undefined {
    const { id } = link;
    return links.get(String(id));
  }

  function elementToData({ element, previousData }: ElementToData<ElementData>): ElementData {
    previousData = previousData ?? getPreviousElementData(element);
    const defaultAttributes = resolveCellDefaults(element);
    const id = String(element.id);
    return mapElementAttributesToData({
      id,
      attributes: element.attributes,
      defaultAttributes,
      element,
      graph,
      previousData,
      toData: (attributes: dia.Element.Attributes) =>
        flatMapElementAttributesToData({ attributes, defaultAttributes }) as ElementData,
    });
  }

  function elementToAttributes({ id, data }: ElementToAttributes<ElementData>) {
    return mapDataToElementAttributes({
      id,
      data,
      graph,
      toAttributes: (newData: ElementData) =>
        flatMapDataToElementAttributes({ id, data: newData as FlatElementData }),
    });
  }

  function linkToData({ link, previousData }: LinkToData<LinkData>): LinkData {
    previousData = previousData ?? getPreviousLinkData(link);
    const defaultAttributes = resolveCellDefaults(link);
    const id = String(link.id);
    return mapLinkAttributesToData({
      id,
      attributes: link.attributes,
      defaultAttributes,
      link,
      graph,
      previousData,
      toData: (attributes: dia.Link.Attributes) =>
        flatMapLinkAttributesToData({ attributes, defaultAttributes }) as LinkData,
    });
  }
  function linkToAttributes({ id, data }: LinkToAttributes<LinkData>): CellAttributes {
    const mapperId = id ?? util.uuid();
    return mapDataToLinkAttributes({
      id: mapperId,
      data,
      graph,
      toAttributes: (newData: LinkData) =>
        flatMapDataToLinkAttributes({ id: mapperId, data: newData as FlatLinkData }),
    });
  }

  const graphChangesController = graphChanges({
    elementToAttributes,
    linkToAttributes,
    graph,
    onChanges: ({ changes, onlyLayoutUpdate }) => {
      let hasElementChange = false;
      let hasLinkChange = false;
      let hasElementLayoutChange = false;
      let hasLinkLayoutChange = false;

      // Track incremental changes for the callback (only when listener is present)
      const trackChanges = onIncrementalChange !== undefined;
      const elementAdded = trackChanges ? new Map<string, ElementData>() : undefined;
      const elementChanged = trackChanges ? new Map<string, ElementData>() : undefined;
      const elementRemoved = trackChanges ? new Set<string>() : undefined;
      const linkAdded = trackChanges ? new Map<string, LinkData>() : undefined;
      const linkChanged = trackChanges ? new Map<string, LinkData>() : undefined;
      const linkRemoved = trackChanges ? new Set<string>() : undefined;
      const elementLayoutAdded = trackChanges ? new Map<string, ElementLayout>() : undefined;
      const elementLayoutChanged = trackChanges ? new Map<string, ElementLayout>() : undefined;
      const elementLayoutRemoved = trackChanges ? new Set<string>() : undefined;
      const linkLayoutAdded = trackChanges
        ? new Map<string, Record<string, LinkLayout>>()
        : undefined;
      const linkLayoutChanged = trackChanges
        ? new Map<string, Record<string, LinkLayout>>()
        : undefined;
      const linkLayoutRemoved = trackChanges ? new Set<string>() : undefined;

      for (const [id, change] of changes) {
        switch (change.type) {
          case 'add':
          case 'change': {
            const cell = change.data;
            const isAdd = change.type === 'add';
            if (cell.isElement()) {
              const position = cell.position();
              const size = cell.size();
              const angle = cell.angle();
              const layout: ElementLayout = { ...position, ...size, angle };
              elementsLayout.set(id, layout);
              hasElementLayoutChange = true;
              if (trackChanges) {
                (isAdd ? elementLayoutAdded! : elementLayoutChanged!).set(id, layout);
              }

              // When element position/size changes, connected link paths also change.
              // Update link layouts for all papers so useLinkLayout() re-renders.
              if (!isAdd && getPaperStores) {
                const papers = getPaperStores();
                const connectedLinks = graph.getConnectedLinks(cell);
                for (const connectedLink of connectedLinks) {
                  const linkId = String(connectedLink.id);
                  const linkLayoutPerPaper: Record<string, LinkLayout> = {
                    ...linksLayout.get(linkId),
                  };
                  for (const [pid, paperStore] of papers) {
                    const linkView = paperStore.paper.findViewByModel(
                      connectedLink
                    ) as dia.LinkView | null;
                    if (!linkView) continue;
                    linkLayoutPerPaper[pid] = getLinkLayout(linkView);
                  }
                  linksLayout.set(linkId, linkLayoutPerPaper);
                  hasLinkLayoutChange = true;
                  if (trackChanges) {
                    linkLayoutChanged!.set(linkId, linkLayoutPerPaper);
                  }
                }
              }

              // Determine if this is a layout-only change (position/size/angle).
              // JointJS sets `cell.changed` with the keys that changed in the last `set()` call.
              // If ONLY layout keys changed, skip data re-computation to avoid unnecessary re-renders.
              const isLayoutOnlyChange =
                !isAdd && !onlyLayoutUpdate && isElementLayoutOnlyChange(cell);

              // Skip data update when:
              // 1. onlyLayoutUpdate (view mount/unmount) AND element already in container
              // 2. Layout-only change (position/size/angle) — data hasn't changed
              const isElementMissing = elements.get(id) === undefined;
              if (
                (onlyLayoutUpdate && !isElementMissing) ||
                (isLayoutOnlyChange && !isElementMissing)
              ) {
                continue;
              }
              const data = elementToData({ element: cell });
              elements.set(id, data);
              hasElementChange = true;
              if (trackChanges) {
                (isAdd ? elementAdded! : elementChanged!).set(id, data);
              }
            } else if (cell.isLink() && getPaperStores) {
              const papers = getPaperStores();
              const linkLayoutPerPaper: Record<string, LinkLayout> = { ...linksLayout.get(id) };
              for (const [paperId, paperStore] of papers) {
                const { paper } = paperStore;
                const linkView = paper.findViewByModel(cell) as dia.LinkView | null;
                if (!linkView) continue;
                linkLayoutPerPaper[paperId] = getLinkLayout(linkView);
              }
              linksLayout.set(id, linkLayoutPerPaper);
              hasLinkLayoutChange = true;
              if (trackChanges) {
                (isAdd ? linkLayoutAdded! : linkLayoutChanged!).set(id, linkLayoutPerPaper);
              }
              // Same as elements: re-add link data if it was removed by a view hide.
              const isLinkMissing = links.get(id) === undefined;
              if (onlyLayoutUpdate && !isLinkMissing) {
                continue;
              }
              const data = linkToData({ link: cell });
              links.set(id, data);
              hasLinkChange = true;
              if (trackChanges) {
                (isAdd ? linkAdded! : linkChanged!).set(id, data);
              }
            }
            break;
          }
          case 'remove': {
            // For remove events from setPaperViews, cell may be undefined.
            // Fall back to checking which container holds the id.
            const removedCell = change.data;
            const isElement = removedCell
              ? removedCell.isElement()
              : elements.get(id) !== undefined;
            const isLink = removedCell ? removedCell.isLink() : links.get(id) !== undefined;
            if (isElement) {
              elements.delete(id);
              hasElementChange = true;
              elementRemoved?.add(id);
              if (!onlyLayoutUpdate) {
                elementsLayout.delete(id);
                hasElementLayoutChange = true;
                elementLayoutRemoved?.add(id);
              }
            } else if (isLink) {
              links.delete(id);
              hasLinkChange = true;
              linkRemoved?.add(id);
              if (!onlyLayoutUpdate) {
                linksLayout.delete(id);
                hasLinkLayoutChange = true;
                linkLayoutRemoved?.add(id);
              }
            }
            break;
          }
        }
      }

      // Commit all containers first — subscribers (React hooks) see updated data
      if (hasElementChange) {
        elements.commitChanges();
      }
      if (hasLinkChange) {
        links.commitChanges();
      }
      if (hasElementLayoutChange) {
        elementsLayout.commitChanges();
      }
      if (hasLinkLayoutChange) {
        linksLayout.commitChanges();
      }

      // Fire incremental change callback AFTER commits — graphStore can read latest container state
      if (trackChanges) {
        onIncrementalChange!({
          elements: { added: elementAdded!, changed: elementChanged!, removed: elementRemoved! },
          links: { added: linkAdded!, changed: linkChanged!, removed: linkRemoved! },
          elementsLayout: {
            added: elementLayoutAdded!,
            changed: elementLayoutChanged!,
            removed: elementLayoutRemoved!,
          },
          linksLayout: {
            added: linkLayoutAdded!,
            changed: linkLayoutChanged!,
            removed: linkLayoutRemoved!,
          },
        });
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
        const data = elementToData({ element: cell });
        elements.set(id, data);
        const position = cell.position();
        const size = cell.size();
        const angle = cell.angle();
        elementsLayout.set(id, { ...position, ...size, angle });
      } else if (cell.isLink()) {
        const data = linkToData({ link: cell });
        links.set(id, data);
      }
    }
    if (elements.getSize() > 0) elements.commitChanges();
    if (links.getSize() > 0) links.commitChanges();
    if (elementsLayout.getSize() > 0) elementsLayout.commitChanges();
  }

  return {
    elements: asReadonlyContainer(elements),
    links: asReadonlyContainer(links),
    elementsLayout: asReadonlyContainer(elementsLayout),
    linksLayout: asReadonlyContainer(linksLayout),
    syncFromGraph,
    autoSizedElementIds: autoSizedElementIds as ReadonlySet<string>,
    updateAutoSizedElement(id: string, data: Record<string, unknown>) {
      const isAutoSized = !hasDefinedSize(data);
      const hasId = autoSizedElementIds.has(id);
      if (isAutoSized === hasId) return;
      if (isAutoSized) {
        autoSizedElementIds.add(id);
      } else {
        autoSizedElementIds.delete(id);
      }
    },
    updateGraph(update: UpdateGraphOptions<ElementData, LinkData>) {
      graphChangesController.updateGraph(update);
      // After updateGraph with isUpdateFromReact, graphChanges skips the events.
      // Populate containers directly so hooks see the data.
      const { elements: userElements, links: userLinks, flag } = update;
      if (flag === 'updateFromReact') {
        for (const [id, data] of Object.entries(userElements)) {
          elements.set(id, data);
          if (!hasDefinedSize(data as Record<string, unknown>)) {
            autoSizedElementIds.add(id);
          }
          const cell = graph.getCell(id);
          if (cell?.isElement()) {
            const position = cell.position();
            const size = cell.size();
            const angle = cell.angle();
            elementsLayout.set(id, { ...position, ...size, angle });
          }
        }
        for (const [id, data] of Object.entries(userLinks)) {
          links.set(id, data);
        }
        // Remove elements/links that are no longer in the user state
        for (const [id] of elements.getFull()) {
          if (!(id in userElements)) {
            elements.delete(id);
            elementsLayout.delete(id);
          }
        }
        for (const [id] of links.getFull()) {
          if (!(id in userLinks)) {
            links.delete(id);
            linksLayout.delete(id);
          }
        }
        if (elements.getSize() > 0 || Object.keys(userElements).length > 0)
          elements.commitChanges();
        if (links.getSize() > 0 || Object.keys(userLinks).length > 0) links.commitChanges();
        if (elementsLayout.getSize() > 0) elementsLayout.commitChanges();
        if (linksLayout.getSize() > 0) linksLayout.commitChanges();
      }
    },
    updateMappers(nextMappers: GraphMappings<ElementData, LinkData>) {
      let changed = false;
      if (
        nextMappers.mapDataToElementAttributes &&
        nextMappers.mapDataToElementAttributes !== mappers.mapDataToElementAttributes
      ) {
        mappers.mapDataToElementAttributes = nextMappers.mapDataToElementAttributes;
        ({ mapDataToElementAttributes } = mappers);
        changed = true;
      }
      if (
        nextMappers.mapDataToLinkAttributes &&
        nextMappers.mapDataToLinkAttributes !== mappers.mapDataToLinkAttributes
      ) {
        mappers.mapDataToLinkAttributes = nextMappers.mapDataToLinkAttributes;
        ({ mapDataToLinkAttributes } = mappers);
        changed = true;
      }
      if (
        nextMappers.mapElementAttributesToData &&
        nextMappers.mapElementAttributesToData !== mappers.mapElementAttributesToData
      ) {
        mappers.mapElementAttributesToData = nextMappers.mapElementAttributesToData;
        ({ mapElementAttributesToData } = mappers);
        changed = true;
      }
      if (
        nextMappers.mapLinkAttributesToData &&
        nextMappers.mapLinkAttributesToData !== mappers.mapLinkAttributesToData
      ) {
        mappers.mapLinkAttributesToData = nextMappers.mapLinkAttributesToData;
        ({ mapLinkAttributesToData } = mappers);
        changed = true;
      }
      if (!changed) return;
      // Re-sync all existing data through updated mappers
      syncFromGraph();
    },
    elementToData,
    elementToAttributes,
    linkToData,
    linkToAttributes,
    destroy() {
      graphChangesController.destroy();
    },
  };
}
